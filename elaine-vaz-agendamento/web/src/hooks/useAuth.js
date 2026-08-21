import { useEffect, useState, useCallback } from "react";
import {
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

async function syncUserToFirestore(firebaseUser, extra = {}) {
  const { uid, displayName, email, photoURL } = firebaseUser;
  await setDoc(
    doc(db, "usuarios", uid),
    {
      nome: displayName || extra.nome || `Cliente ${extra.phone?.slice(-4) || ""}`,
      email: email || null,
      phone: extra.phone || null,
      fotoUrl: photoURL || null,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Login com Google (mantém o que já existe)
  const login = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        await syncUserToFirestore(result.user);
      }
    } catch (err) {
      console.error("Erro ao entrar com Google:", err);
      setAuthError(err);
    }
  }, []);

  // ===== NOVO: Login com WhatsApp (OTP) =====
  const loginWithWhatsApp = useCallback(async (phone, code) => {
    setAuthError(null);
    try {
      // Chama sua API (vamos criar logo abaixo)
      const res = await fetch("/api/auth/verify-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");

      // Faz login com o custom token gerado no backend
      const result = await signInWithCustomToken(auth, data.token);
      if (result?.user) {
        await syncUserToFirestore(result.user, { phone });
      }
    } catch (err) {
      console.error("Erro no login WhatsApp:", err);
      setAuthError(err);
      throw err;
    }
  }, []);

  // Envia o OTP
  const sendWhatsAppOtp = useCallback(async (phone) => {
    const res = await fetch("/api/auth/send-whatsapp-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao enviar código");
    return data;
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return {
    user,
    loading,
    login,                 // Google
    loginWithWhatsApp,     // WhatsApp
    sendWhatsAppOtp,       // Enviar código
    logout,
    authError,
  };
}