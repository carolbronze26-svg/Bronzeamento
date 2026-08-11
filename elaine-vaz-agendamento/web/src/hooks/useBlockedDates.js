import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Retorna um Set com as datas bloqueadas (formato "YYYY-MM-DD"),
// atualizado em tempo real sempre que o admin adiciona/remove um bloqueio.
export function useBlockedDates() {
  const [blocked, setBlocked] = useState(new Set());

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bloqueios"),
      (snap) => setBlocked(new Set(snap.docs.map((d) => d.id))),
      () => setBlocked(new Set()) // se der erro de permissão, não bloqueia nada
    );
    return unsubscribe;
  }, []);

  return blocked;
}
