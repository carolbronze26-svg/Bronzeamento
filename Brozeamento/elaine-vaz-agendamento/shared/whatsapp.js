// Número da Carol (responsável pelo bronzeamento) para confirmação via WhatsApp.
// Trocar por variável de ambiente se o número puder mudar no futuro.
const CAROL_WHATSAPP = "5511931101976";

/**
 * Monta o link wa.me com a mensagem de confirmação já preenchida.
 * @param {{ serviceName: string, dateLabel: string, time: string, clientName: string }} booking
 */
export function buildWhatsappConfirmationLink(booking) {
  const { serviceName, dateLabel, time, clientName } = booking;

  const text =
    `Olá! Gostaria de confirmar meu agendamento:\n` +
    `• Serviço: ${serviceName}\n` +
    `• Data: ${dateLabel}\n` +
    `• Horário: ${time}\n` +
    `• Nome: ${clientName || ""}`;

  return `https://wa.me/${CAROL_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
