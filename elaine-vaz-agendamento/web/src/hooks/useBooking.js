import { useCallback, useState } from "react";
import { collection, addDoc, doc, updateDoc, query, where, getDocs, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Status que "ocupam" um horário, impedindo que outro cliente agende:
// pendente (acabou de agendar), presenca_confirmada (cliente confirmou
// que vai comparecer) e confirmado (admin marcou como concluído).
const STATUS_QUE_OCUPAM = ["pendente", "presenca_confirmada", "confirmado"];

// Retorna os horários já reservados para uma data específica (formato "YYYY-MM-DD")
export function useOccupiedSlots() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOccupied = useCallback(async (dateKey, ignorarId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "agendamentos"),
        where("dataKey", "==", dateKey),
        where("status", "in", STATUS_QUE_OCUPAM)
      );
      const snap = await getDocs(q);
      return snap.docs.filter((d) => d.id !== ignorarId).map((d) => d.data().horario);
    } catch (err) {
      console.error("Erro ao buscar horários ocupados:", err);
      setError(err);
      return []; // em caso de erro, não bloqueia nenhum horário
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchOccupied, loading, error };
}

// Cria o agendamento com status "pendente".
export function useCreateBooking() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const createBooking = useCallback(async ({ usuarioId, nome, email, telefone, servico, dateKey, dateLabel, horario, extra }) => {
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
        preco: servico.preco != null ? servico.preco : null,
        dataKey: dateKey,
        dataLabel: dateLabel,
        horario,
        status: "pendente",
        criadoEm: serverTimestamp(),
        ...(extra || {}),
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

// Escuta em tempo real todos os agendamentos do cliente logado.
export function useMyBookings(usuarioId) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const subscribe = useCallback(() => {
    if (!usuarioId) {
      setBookings([]);
      setLoading(false);
      return () => {};
    }
    const q = query(
      collection(db, "agendamentos"),
      where("usuarioId", "==", usuarioId),
      orderBy("criadoEm", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [usuarioId]);

  return { bookings, loading, subscribe };
}

// Ações do cliente sobre o próprio agendamento: cancelar, confirmar
// presença, ou reagendar (trocar data/hora e voltar pro status pendente).
export function useBookingActions() {
  const cancelar = useCallback(async (id) => {
    await updateDoc(doc(db, "agendamentos", id), { status: "cancelado" });
  }, []);

  const confirmarPresenca = useCallback(async (id) => {
    await updateDoc(doc(db, "agendamentos", id), { status: "presenca_confirmada" });
  }, []);

  const reagendar = useCallback(async (id, { dataKey, dataLabel, horario }) => {
    await updateDoc(doc(db, "agendamentos", id), {
      dataKey,
      dataLabel,
      horario,
      status: "pendente",
    });
  }, []);

  return { cancelar, confirmarPresenca, reagendar };
}
