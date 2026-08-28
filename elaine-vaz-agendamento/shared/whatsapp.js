// shared/whatsapp.js

const ZAPI_INSTANCE = import.meta.env.VITE_ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = import.meta.env.VITE_ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = import.meta.env.VITE_ZAPI_CLIENT_TOKEN; // se a conta exigir
const CAROL_WHATSAPP = "5511931101976";

const ZAPI_BASE = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`;

function formatPhone(phone) {
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  return cleaned;
}

/**
 * Envia mensagem de texto via Z-API
 */
export async function sendWhatsAppText(phone, message) {
  const formatted = formatPhone(phone);

  const res = await fetch(`${ZAPI_BASE}/send-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
    },
    body: JSON.stringify({
      phone: formatted,
      message,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Z-API error:", err);
    throw new Error("Falha ao enviar mensagem no WhatsApp");
  }

  return res.json();
}

/**
 * Envia mensagem com botões (Confirmar / Remarcar / Cancelar)
 */
export async function sendWhatsAppButtons(phone, message, buttons) {
  const formatted = formatPhone(phone);

  const res = await fetch(`${ZAPI_BASE}/send-button-list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
    },
    body: JSON.stringify({
      phone: formatted,
      message,
      buttonList: {
        buttons: buttons.map((b) => ({
          id: b.id,
          label: b.label,
        })),
      },
    }),
  });

  return res.json();
}

// ===== Mantém os links antigos (caso ainda queira usar) =====
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

export function buildWhatsappPacoteLink({ sessoes, clientName }) {
  const linhas = sessoes.map((s, i) => `  ${i + 1}) ${s.dateLabel} às ${s.horario}`).join("\n");
  const text =
    `Olá! Gostaria de confirmar meu pacote de 4 sessões de bronzeamento:\n` +
    `${linhas}\n` +
    `• Nome: ${clientName || ""}`;
  return `https://wa.me/${CAROL_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
export function buildWhatsappConfirmationLink(booking) {
  const { serviceName, dateLabel, time, clientName, amigaNome, amigaTelefone } = booking;
  let text =
    `Olá! Gostaria de confirmar meu agendamento:\n` +
    `• Serviço: ${serviceName}\n` +
    `• Data: ${dateLabel}\n` +
    `• Horário: ${time}\n` +
    `• Nome: ${clientName || ""}`;

  if (amigaNome) {
    text += `\n\n👯 Amiga da promoção:\n• Nome: ${amigaNome}\n• WhatsApp: ${amigaTelefone || ""}`;
  }

  return `https://wa.me/${CAROL_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
