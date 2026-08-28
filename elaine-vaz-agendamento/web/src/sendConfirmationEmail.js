import emailjs from "@emailjs/browser";
import { buildConfirmationEmailHtml, buildPackageConfirmationEmailHtml } from "./emailTemplate";

const EMAILJS_SERVICE_ID = "service_igqq9cd";
const EMAILJS_TEMPLATE_ID = "template_z4kq15m";
const EMAILJS_PUBLIC_KEY = "_HkAf55M5VCL6pWh0";

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

export async function sendConfirmationEmail({
  nome, email, telefone, servico, data, horario, amigaNome, amigaTelefone,
}) {
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      nome: nome || "",
      email: email || "",
      telefone: telefone || "",
      servico: servico || "",
      data: data || "",
      horario: horario || "",
      assunto: `Agendamento - ${nome || ""}`,
      mensagem_html: buildConfirmationEmailHtml({
        nome, email, telefone, servico, data, horario, amigaNome, amigaTelefone,
      }),
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de confirmação:", err);
  }
}

export async function sendPackageConfirmationEmail({
  nome, email, telefone, sessoes, amigaNome, amigaTelefone,
}) {
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      nome: nome || "",
      email: email || "",
      telefone: telefone || "",
      assunto: `Agendamento - ${nome || ""}`,
      mensagem_html: buildPackageConfirmationEmailHtml({
        nome, email, telefone, sessoes, amigaNome, amigaTelefone,
      }),
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de confirmação do pacote:", err);
  }
}

