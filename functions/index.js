const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

// Disparada sempre que um novo agendamento é criado (status "pendente").
// Hoje a confirmação é manual: o cliente clica no link do WhatsApp.
// Este gatilho serve como ponto de extensão futuro, por exemplo para:
//   - notificar a Carol automaticamente (push, e-mail ou WhatsApp Business API)
//   - enviar lembrete 1h antes do horário
//   - expirar agendamentos "pendente" que não foram confirmados em X horas
exports.onAgendamentoCriado = onDocumentCreated("agendamentos/{agendamentoId}", (event) => {
  const agendamento = event.data.data();

  logger.info("Novo agendamento criado", {
    id: event.params.agendamentoId,
    servico: agendamento.servicoNome,
    profissional: agendamento.profissional,
    data: agendamento.dataLabel,
    horario: agendamento.horario,
  });

  // TODO: quando integrar a API oficial do WhatsApp (Twilio ou Meta Cloud API),
  // enviar aqui a mensagem automática para a Carol.
});
