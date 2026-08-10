import { useEffect, useState, useCallback } from "react";
import {
  signInWithRedirect,
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

  useEffect(() => {
    // Popups de OAuth são bloqueados/fechados com frequência em navegadores
    // mobile (Chrome Android, Safari iOS), por causa de restrições de cookies
    // de terceiros. Por isso usamos signInWithRedirect: o usuário sai do app,
    // loga na tela do Google e volta — mais lento, mas muito mais confiável.
    //
    // getRedirectResult() captura o resultado assim que o usuário volta.
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          syncUserToFirestore(result.user);
        }
      })
      .catch((err) => {
        console.error("Erro ao concluir login com Google:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(() => {
    // Não precisa de await/retorno aqui — a página é redirecionada para o
    // Google e volta para cá; o resultado é tratado no getRedirectResult acima.
    return signInWithRedirect(auth, googleProvider);
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return { user, loading, login, logout };
}
