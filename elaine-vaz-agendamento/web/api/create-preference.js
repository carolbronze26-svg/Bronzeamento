// Função serverless (roda no servidor do Vercel, nunca no navegador).
// O MERCADOPAGO_ACCESS_TOKEN fica só aqui — nunca é enviado pro cliente.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "Pagamento não configurado no servidor." });
  }

  const { servico, preco, nome, email, bookingId } = req.body || {};

  if (!servico || !preco) {
    return res.status(400).json({ error: "Dados do pagamento incompletos." });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: servico,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(preco),
          },
        ],
        payer: {
          name: nome || undefined,
          email: email || undefined,
        },
        external_reference: bookingId || undefined,
        back_urls: {
          success: `${origin}/agendado`,
          failure: `${origin}/agendamento`,
          pending: `${origin}/agendado`,
        },
        auto_return: "approved",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", data);
      return res.status(500).json({ error: data.message || "Erro ao criar pagamento." });
    }

    return res.status(200).json({ init_point: data.init_point });
  } catch (err) {
    console.error("Erro ao criar preferência de pagamento:", err);
    return res.status(500).json({ error: "Erro ao criar pagamento." });
  }
}
