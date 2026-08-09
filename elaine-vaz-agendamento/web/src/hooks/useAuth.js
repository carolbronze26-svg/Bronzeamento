import { useEffect, useState, useCallback } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const { uid, displayName, email, photoURL } = result.user;

    // cria/atualiza o documento do usuário no Firestore
    await setDoc(
      doc(db, "usuarios", uid),
      { nome: displayName, email, fotoUrl: photoURL, atualizadoEm: serverTimestamp() },
      { merge: true }
    );

    return result.user;
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return { user, loading, login, logout };
}
