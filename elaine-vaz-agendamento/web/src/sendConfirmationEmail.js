import emailjs from "@emailjs/browser";
import { buildConfirmationEmailHtml } from "./emailTemplate";

const EMAILJS_SERVICE_ID = "service_igqq9cd";
const EMAILJS_TEMPLATE_ID = "template_z4kq15m";
const EMAILJS_PUBLIC_KEY = "_HkAf55M5VCL6pWh0";

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// Dispara o e-mail de confirmação com os dados do agendamento.
// O corpo do e-mail é montado 100% aqui no código (emailTemplate.js) —
// o template no painel do EmailJS só precisa ter a variável
// {{mensagem_html}} no corpo, e o assunto {{assunto}}.
// Nunca lança erro pra fora — se o e-mail falhar, o agendamento em si
// já foi salvo no Firestore e não deve ser bloqueado por isso.
export async function sendConfirmationEmail({ nome, email, telefone, servico, data, horario }) {
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      nome: nome || "",
      email: email || "",
      telefone: telefone || "",
      servico: servico || "",
      data: data || "",
      horario: horario || "",
      assunto: `Agendamento - ${nome || ""}`,
      mensagem_html: buildConfirmationEmailHtml({ nome, email, telefone, servico, data, horario }),
      cc_email: "nickcole10@gmail.com, sampaiocfs@gmail.com",
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de confirmação:", err);
  }
}

