import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // ajuste o caminho se seu firebase.js estiver em outro lugar

// Cria/mantém o documento usuarios/{uid} e escuta em tempo real
// os selos de fidelidade e prêmios (sessões grátis) do cliente logado.
export function useLoyalty(user) {
  const [selos, setSelos] = useState(0);
  const [premios, setPremios] = useState(0);

  // garante que o perfil do cliente existe no Firestore
  useEffect(() => {
    if (!user) return;
    setDoc(
      doc(db, "usuarios", user.uid),
      {
        nome: user.displayName || null,
        email: user.email || null,
        telefone: user.phoneNumber || null,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {
      // silencioso: não é crítico se essa atualização de perfil falhar
    });
  }, [user?.uid]);

  // escuta em tempo real os selos do cliente
  useEffect(() => {
    if (!user) {
      setSelos(0);
      setPremios(0);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      const data = snap.data();
      setSelos(data?.selosFidelidade || 0);
      setPremios(data?.premiosDisponiveis || 0);
    });
    return unsubscribe;
  }, [user?.uid]);

  return { selos, premios };
}
