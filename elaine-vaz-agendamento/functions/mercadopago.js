const { MercadoPagoConfig, Payment } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
const payment = new Payment(client);

// Cria pagamento via Pix
async function criarPagamentoPix({ valor, descricao, email, referencia }) {
  const body = {
    transaction_amount: valor,
    description: descricao,
    payment_method_id: "pix",
    payer: { email },
    external_reference: referencia,
  };
  const result = await payment.create({ body });
  return {
    id: result.id,
    status: result.status,
    qr_code: result.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
  };
}

// Cria pagamento via cartão (token gerado no front pelo SDK do Mercado Pago)
async function criarPagamentoCartao({ token, valor, descricao, email, installments, referencia }) {
  const body = {
    transaction_amount: valor,
    token,
    description: descricao,
    installments: installments || 1,
    payer: { email },
    external_reference: referencia,
  };
  const result = await payment.create({ body });
  return { id: result.id, status: result.status };
}

async function consultarPagamento(id) {
  return payment.get({ id });
}

module.exports = { criarPagamentoPix, criarPagamentoCartao, consultarPagamento };
