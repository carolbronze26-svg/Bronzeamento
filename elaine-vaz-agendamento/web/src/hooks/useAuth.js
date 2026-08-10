import { useEffect, useState, useCallback } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

// Detecta celular real (não desktop). Em celulares o popup de OAuth costuma
// ser bloqueado/fechado sozinho; em desktop o popup funciona bem e evita um
// problema diferente do redirect (o Chrome às vezes limpa o estado de login
// no meio do caminho ao navegar entre domínios — Google → Firebase → site).
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Salva/atualiza o usuário no Firestore assim que ele loga
async function syncUserToFirestore(firebaseUser) {
  const { uid, displayName, email, photoURL } = firebaseUser;
  await setDoc(
    doc(db, "usuarios", uid),
    { nome: displayName, email, fotoUrl: photoURL, atualizadoEm: serverTimestamp() },
    { merge: true }
  );
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Só relevante para o fluxo de redirect (mobile) — se o usuário veio
    // de volta do Google, captura o resultado aqui.
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          syncUserToFirestore(result.user);
        }
      })
      .catch((err) => {
        console.error("Erro ao concluir login com Google:", err);
        setAuthError(err);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    setAuthError(null);
    try {
      if (isMobileDevice()) {
        // mobile: usa redirect (mais confiável que popup nesses navegadores)
        await signInWithRedirect(auth, googleProvider);
      } else {
        // desktop: usa popup (mais rápido e evita o problema de estado
        // perdido entre domínios que o redirect pode ter)
        const result = await signInWithPopup(auth, googleProvider);
        if (result?.user) {
          await syncUserToFirestore(result.user);
        }
      }
    } catch (err) {
      console.error("Erro ao entrar com Google:", err);
      setAuthError(err);
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return { user, loading, login, logout, authError };
}