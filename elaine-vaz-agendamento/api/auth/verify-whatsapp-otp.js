import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = getFirestore();
const auth = getAuth();

function formatPhone(phone) {
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  return cleaned;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const formatted = formatPhone(phone);
    const otpDoc = await db.collection("otps").doc(formatted).get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: "Código inválido ou expirado" });
    }

    const otp = otpDoc.data();

    if (otp.used || otp.code !== code || new Date() > otp.expiresAt.toDate()) {
      return res.status(400).json({ error: "Código inválido ou expirado" });
    }

    // Marca como usado
    await otpDoc.ref.update({ used: true });

    // Cria ou busca o usuário no Firebase Auth
    let user;
    try {
      user = await auth.getUserByPhoneNumber("+" + formatted);
    } catch {
      // Usuário não existe → cria
      user = await auth.createUser({
        phoneNumber: "+" + formatted,
        displayName: `Cliente ${formatted.slice(-4)}`,
      });
    }

    // Gera custom token
    const token = await auth.createCustomToken(user.uid);

    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}