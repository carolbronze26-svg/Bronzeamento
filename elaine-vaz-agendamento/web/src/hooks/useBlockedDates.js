import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Retorna um Map: chave = data ("YYYY-MM-DD"), valor = array de horários bloqueados
// (ou [] quando o dia todo está bloqueado, sem horários específicos).
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
          map.set(d.id, data.horarios || []);
        });
        setBlocked(map);
      },
      () => setBlocked(new Map()) // se der erro de permissão, não bloqueia nada
    );
    return unsubscribe;
  }, []);

  return blocked;
}

// Helper: dia todo bloqueado = existe a data no Map E horarios está vazio []
export function isDiaTotalmenteBloqueado(blockedMap, dataKey) {
  return blockedMap.has(dataKey) && (blockedMap.get(dataKey) || []).length === 0;
}

// Helper: retorna os horários bloqueados de uma data específica
export function getHorariosBloqueados(blockedMap, dataKey) {
  return blockedMap.get(dataKey) || [];
}
