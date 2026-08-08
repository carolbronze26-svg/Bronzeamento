import { useCallback, useState } from "react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Retorna os horários já reservados para uma data específica (formato "YYYY-MM-DD")
export function useOccupiedSlots() {
  const [loading, setLoading] = useState(false);

  const fetchOccupied = useCallback(async (dateKey) => {
    setLoading(true);
    const q = query(
      collection(db, "agendamentos"),
      where("dataKey", "==", dateKey),
      where("status", "in", ["pendente", "confirmado"])
    );
    const snap = await getDocs(q);
    setLoading(false);
    return snap.docs.map((d) => d.data().horario);
  }, []);

  return { fetchOccupied, loading };
}

// Cria o agendamento com status "pendente" — a confirmação definitiva
// acontece quando o cliente fala com a Carol pelo WhatsApp.
export function useCreateBooking() {
  const [saving, setSaving] = useState(false);

  const createBooking = useCallback(async ({ usuarioId, servico, dateKey, dateLabel, horario }) => {
    setSaving(true);
    const ref = await addDoc(collection(db, "agendamentos"), {
      usuarioId,
      servicoId: servico.id,
      servicoNome: servico.name,
      profissional: servico.professional,
      dataKey: dateKey,
      dataLabel: dateLabel,
      horario,
      status: "pendente",
      criadoEm: serverTimestamp(),
    });
    setSaving(false);
    return ref.id;
  }, []);

  return { createBooking, saving };
}
