import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { title, price, referenciaId, tipo, clienteEmail } = req.body;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'BRL',
          },
        ],
        payer: { email: clienteEmail },
        external_reference: `${tipo}|${referenciaId}|${itemId}`, // ex: "pacote|uid_123|pacote1"
        back_urls: {
          success: 'https://bronzeamento-snfc.vercel.app/',
          failure: 'https://bronzeamento-snfc.vercel.app/',
          pending: 'https://bronzeamento-snfc.vercel.app/',
        },
        auto_return: 'approved',
        notification_url: 'https://bronzeamento-snfc.vercel.app/api/payment-webhook',
      },
    });

    return res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
}
