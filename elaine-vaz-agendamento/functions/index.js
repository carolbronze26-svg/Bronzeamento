const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const cors = require("cors")({ origin: true });
const {
  criarPagamentoPix,
  criarPagamentoCartao,
  consultarPagamento,
} = require("./mercadopago");

initializeApp();
const db = getFirestore();

// -----------------------------------------------------------------------
// Gatilho: novo agendamento criado
// -----------------------------------------------------------------------
exports.onAgendamentoCriado = onDocumentCreated("agendamentos/{agendamentoId}", (event) => {
  const agendamento = event.data.data();
  logger.info("Novo agendamento criado", {
    id: event.params.agendamentoId,
    servico: agendamento.servicoNome,
    data: agendamento.dataLabel,
    horario: agendamento.horario,
  });
});

// -----------------------------------------------------------------------
// HTTPS: criar pagamento (Pix ou Cartão) para pacote/sessão
// -----------------------------------------------------------------------
exports.criarPagamento = onRequest({ cors: true }, async (req, res) => {
  cors(req, res, async () => {
    try {
      const { metodo, valor, descricao, email, token, installments, tipo, referenciaId } = req.body;

      if (!metodo || !valor || !email) {
        return res.status(400).json({ error: "Dados incompletos." });
      }

      const referencia = `${tipo || "pagamento"}_${referenciaId || Date.now()}`;
      let resultado;

      if (metodo === "pix") {
        resultado = await criarPagamentoPix({ valor, descricao, email, referencia });
      } else if (metodo === "credito" || metodo === "debito") {
        if (!token) return res.status(400).json({ error: "Token do cartão é obrigatório." });
        resultado = await criarPagamentoCartao({ token, valor, descricao, email, installments, referencia });
      } else {
        return res.status(400).json({ error: "Método de pagamento inválido." });
      }

      // Salva o registro de pagamento no Firestore
      await db.collection("pagamentos").doc(String(resultado.id)).set({
        metodo,
        valor,
        status: resultado.status,
        email,
        tipo: tipo || "pagamento",
        referenciaId: referenciaId || null,
        criadoEm: FieldValue.serverTimestamp(),
      });

      return res.json(resultado);
    } catch (err) {
      logger.error("Erro ao criar pagamento:", err);
      return res.status(500).json({ error: "Erro ao processar pagamento." });
    }
  });
});

// -----------------------------------------------------------------------
// Webhook do Mercado Pago — confirma pagamento automaticamente
// -----------------------------------------------------------------------
exports.webhookMercadoPago = onRequest({ cors: true }, async (req, res) => {
  try {
    const paymentId = req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    const info = await consultarPagamento(paymentId);

    await db.collection("pagamentos").doc(String(paymentId)).set(
      { status: info.status, atualizadoEm: FieldValue.serverTimestamp() },
      { merge: true }
    );

    if (info.status === "approved") {
      const [tipo, referenciaId] = (info.external_reference || "").split("_");

      if (tipo === "pacote") {
        // Cria/atualiza o pacote do cliente com 4 sessões disponíveis
        await db.collection("pacotesClientes").doc(referenciaId).set(
          {
            sessoesRestantes: 4,
            status: "ativo",
            pagamentoId: paymentId,
            atualizadoEm: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (tipo === "agendamento") {
        // Confirma o agendamento e bloqueia o horário automaticamente
        await db.collection("agendamentos").doc(referenciaId).update({
          status: "confirmado",
          pagamentoId: paymentId,
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error("Erro no webhook do Mercado Pago:", err);
    res.sendStatus(500);
  }
});
