import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Inicializa Admin (só uma vez)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = getFirestore();

function formatPhone(phone) {
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  return cleaned;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: "Telefone inválido" });
    }

    const formatted = formatPhone(phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    // Salva o OTP no Firestore
    await db.collection("otps").doc(formatted).set({
      code,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // Envia via Z-API
    const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE_ID;
    const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
    const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
        },
        body: JSON.stringify({
          phone: formatted,
          message: `🔐 Seu código de acesso Carol Sampaio é: *${code}*\n\nVálido por 5 minutos.`,
        }),
      }
    );

    if (!zapiRes.ok) {
      const err = await zapiRes.text();
      console.error("Z-API error:", err);
      return res.status(500).json({ error: "Falha ao enviar código" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}