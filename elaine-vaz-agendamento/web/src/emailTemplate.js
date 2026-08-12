// Template do e-mail de confirmação — controlado aqui no código, não no
// painel do EmailJS. O template no EmailJS deve conter só a variável
// {{mensagem_html}} sozinha no corpo, pra receber esse HTML pronto.
export function buildConfirmationEmailHtml({ nome, servico, data, horario, telefone, email }) {
  return `
  <div style="font-family: Arial, sans-serif; background:#0B0A09; padding:24px; color:#F3ECDD;">
    <div style="max-width:420px; margin:0 auto; background:#151109; border:1px solid #2A241A; border-radius:16px; overflow:hidden;">
      <div style="background:linear-gradient(135deg,#E8CE85,#C9A24B); padding:18px 22px;">
        <span style="font-size:18px; font-weight:bold; color:#0B0A09;">Carol Sampaio</span>
      </div>
      <div style="padding:22px;">
        <h2 style="margin:0 0 6px; color:#F3ECDD; font-size:20px;">Novo agendamento confirmado</h2>
        <p style="margin:0 0 18px; color:#9C9384; font-size:13px;">Beleza que você vê, saúde que você sente.</p>

        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px 0; color:#8A8272;">Cliente</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${nome || "-"}</td></tr>
          <tr><td style="padding:6px 0; color:#8A8272;">Serviço</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${servico || "-"}</td></tr>
          <tr><td style="padding:6px 0; color:#8A8272;">Data</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${data || "-"}</td></tr>
          <tr><td style="padding:6px 0; color:#8A8272;">Horário</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${horario || "-"}</td></tr>
          <tr><td style="padding:6px 0; color:#8A8272;">Telefone</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${telefone || "-"}</td></tr>
          <tr><td style="padding:6px 0; color:#8A8272;">E-mail</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${email || "-"}</td></tr>
        </table>
      </div>
    </div>
  </div>`;
}
