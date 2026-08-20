import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Retorna um Map: dataKey ("YYYY-MM-DD") -> { diaTodo: boolean, horarios: string[] }
// Atualizado em tempo real sempre que o admin adiciona/remove um bloqueio.
export function useBlockedDates() {
  const [blocked, setBlocked] = useState(new Map());

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bloqueios"),
      (snap) => {
        const map = new Map();
        snap.docs.forEach((d) => {
          const data = d.data();
          map.set(d.id, {
            diaTodo: !!data.diaTodo,
            horarios: Array.isArray(data.horarios) ? data.horarios : [],
          });
        });
        setBlocked(map);
      },
      () => setBlocked(new Map()) // se der erro de permissão, não bloqueia nada
    );
    return unsubscribe;
  }, []);

  return blocked;
}

// Helpers usados pelo calendário
export function isDiaTodoBloqueado(blockedDates, dataKey) {
  return !!blockedDates.get(dataKey)?.diaTodo;
}

export function horariosBloqueados(blockedDates, dataKey) {
  return blockedDates.get(dataKey)?.horarios || [];
}
