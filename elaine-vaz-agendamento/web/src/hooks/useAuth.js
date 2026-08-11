import { useEffect, useState, useCallback } from "react";
import {
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

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
    // Mantido por segurança, caso sobre algum estado de redirect antigo
    // no navegador — não usamos mais signInWithRedirect no login.
    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    setAuthError(null);
    try {
      // Popup funciona tanto em desktop quanto em mobile — evita o
      // problema do redirect perder o estado de login ao navegar entre
      // domínios (Google → Firebase → site).
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        await syncUserToFirestore(result.user);
      }
    } catch (err) {
      console.error("Erro ao entrar com Google:", err);
      setAuthError(err);
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return { user, loading, login, logout, authError };
}