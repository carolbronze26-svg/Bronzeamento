import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export function useMyBookings(uid) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setBookings([]); setLoading(false); return; }
    const q = query(collection(db, "agendamentos"), where("usuarioId", "==", uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.dataKey || "").localeCompare(a.dataKey || ""));
      setBookings(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  return { bookings, loading };
}

function checarRegra24h(item) {
  const [ano, mes, dia] = item.dataKey.split("-").map(Number);
  const [hora, minuto] = (item.horario || "00:00").split(":").map(Number);
  const dataAgendamento = new Date(ano, mes - 1, dia, hora, minuto);
  const diffHoras = (dataAgendamento - new Date()) / (1000 * 60 * 60);
  return diffHoras;
}

// Cancelamento respeitando a regra de 24h (mesma regra do admin)
export async function cancelarMeuAgendamento(item) {
  const diffHoras = checarRegra24h(item);
  if (diffHoras < 24) {
    throw new Error(
      "Cancelamentos devem ser feitos com no mínimo 24h de antecedência. Esse horário já está dentro do prazo, então será considerado realizado."
    );
  }
  await updateDoc(doc(db, "agendamentos", item.id), { status: "cancelado" });
}

// Reagendamento respeitando a regra de 24h + checando se o novo horário já está ocupado
export async function reagendarMeuAgendamento(item, novaData, novoHorario) {
  const diffHoras = checarRegra24h(item);
  if (diffHoras < 24) {
    throw new Error(
      "Reagendamentos devem ser feitos com no mínimo 24h de antecedência do horário atual."
    );
  }

  const q = query(
    collection(db, "agendamentos"),
    where("dataKey", "==", novaData),
    where("status", "in", ["pendente", "confirmado"])
  );
  const snap = await getDocs(q);
  const ocupado = snap.docs.some((d) => d.id !== item.id && d.data().horario === novoHorario);
  if (ocupado) {
    throw new Error("Esse horário já está ocupado. Escolha outro.");
  }

  const dataLabel = new Date(novaData + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  await updateDoc(doc(db, "agendamentos", item.id), {
    dataKey: novaData,
    dataLabel,
    horario: novoHorario,
    status: "pendente",
  });
}
export async function confirmarPresenca(item) {
  await updateDoc(doc(db, "agendamentos", item.id), { status: "confirmado" });
}
