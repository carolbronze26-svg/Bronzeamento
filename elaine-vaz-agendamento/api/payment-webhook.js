import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PACOTES } from '../../shared/services.js';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Inicializa o Firebase Admin (apenas uma vez)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const paymentId = req.body?.data?.id || req.query['data.id'];
    const topic = req.body?.type || req.query.type;

    if (topic !== 'payment' || !paymentId) {
      // Ignora outros tipos de notificação (ex: merchant_order)
      return res.status(200).json({ received: true });
    }

    // Consulta o pagamento real na API do Mercado Pago
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const status = payment.status; // approved | pending | rejected | cancelled
    const externalRef = payment.external_reference || '';
    const [tipo, referenciaId, itemId] = externalRef.split('|');

    if (!tipo || !referenciaId) {
      return res.status(200).json({ received: true });
    }

    if (tipo === 'pacote') {
      const pacoteRef = db.collection('pacotesClientes').doc(referenciaId);

      if (status === 'approved') {
        const pacoteInfo = PACOTES.find((p) => p.id === itemId);
        await pacoteRef.update({
          status: 'aprovado',
          sessoesRestantes: pacoteInfo?.qtdSessoes || 0,
          pagamentoId: paymentId,
          aprovadoEm: new Date(),
        });
        // Agendamentos vinculados permanecem "pendente" — já estavam reservados
      } else if (status === 'rejected' || status === 'cancelled') {
        await pacoteRef.update({ status: 'cancelado', pagamentoId: paymentId });

        // Cancela os agendamentos vinculados a esse pacote, liberando os horários
        const snap = await db
          .collection('agendamentos')
          .where('pacoteClienteId', '==', referenciaId)
          .get();

        const batch = db.batch();
        snap.docs.forEach((d) => batch.update(d.ref, { status: 'cancelado' }));
        await batch.commit();
      }
      // status "pending" (ex: boleto/pix aguardando) -> não faz nada, mantém reservado
    }

    if (tipo === 'servico') {
      const pagamentoRef = db.collection('pagamentos').doc(referenciaId);
      if (status === 'approved') {
        await pagamentoRef.update({ status: 'aprovado', pagamentoId: paymentId });
      } else if (status === 'rejected' || status === 'cancelled') {
        await pagamentoRef.update({ status: 'cancelado', pagamentoId: paymentId });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}
