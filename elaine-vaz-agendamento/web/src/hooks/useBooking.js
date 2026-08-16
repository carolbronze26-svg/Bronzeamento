import { useCallback, useState } from "react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Retorna os horários já reservados — "pendente" e "confirmado" bloqueiam o slot.
// Quando o admin clica "Confirmar presença", o status vira "confirmado" e
// o horário passa a aparecer aqui automaticamente, ficando indisponível
// para novos agendamentos.
export function useOccupiedSlots() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOccupied = useCallback(async (dateKey) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
           collection(db, "agendamentos"),
          where("dataKey", "==", dateKey),
           where("status", "==", "confirmado") // só bloqueia após confirmar presença
        );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data().horario);
    } catch (err) {
      console.error("Erro ao buscar horários ocupados:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchOccupied, loading, error };
}

export function useCreateBooking() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const createBooking = useCallback(async ({ usuarioId, nome, email, telefone, servico, dateKey, dateLabel, horario, pacoteClienteId }) => {
    setSaving(true);
    setError(null);
    try {
      const ref = await addDoc(collection(db, "agendamentos"), {
        usuarioId,
        nome: nome || "",
        email: email || "",
        telefone: telefone || "",
        servicoId: servico.id,
        servicoNome: servico.name,
        profissional: servico.professional,
        preco: servico.preco || null,
        pacoteClienteId: pacoteClienteId || null,
        dataKey: dateKey,
        dataLabel: dateLabel,
        horario,
        status: "pendente",
        criadoEm: serverTimestamp(),
      });
      return ref.id;
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { createBooking, saving, error };
}
