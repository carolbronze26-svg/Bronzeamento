import React, { useMemo, useState } from "react";
import { Calendar, Clock, XCircle, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { useOccupiedSlots } from "./hooks/useBooking";
import { useBlockedDates } from "./hooks/useBlockedDates";
import { WEEKDAY_SLOTS, SUNDAY_SLOTS } from "../../shared/services";
import { useMyBookings, cancelarMeuAgendamento, reagendarMeuAgendamento, confirmarPresenca } from "./hooks/useMyBookings";

const STATUS_LABEL = {
  pendente: { label: "Pendente", color: "#E8CE85" },
  confirmado: { label: "Confirmado", color: "#6FCF97" },
  cancelado: { label: "Cancelado", color: "#E07856" },
};

export default function MeusAgendamentos({ user }) {
  const { bookings, loading } = useMyBookings(user?.uid);
  const [reagendando, setReagendando] = useState(null);

  async function handleCancelar(item) {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    try {
      await cancelarMeuAgendamento(item);
    } catch (err) {
      alert(err.message);
    }
  }

async function handleConfirmarPresenca(item) {
  try {
    await confirmarPresenca(item);
  } catch (err) {
    alert(err.message);
  }
}

  if (loading) return <p className="pMutedSmall">Carregando seus agendamentos...</p>;

  if (bookings.length === 0) {
    return (
      <div className="stepCenter">
        <Calendar size={28} color="#C9A24B" style={{ marginBottom: 14 }} />
        <p className="pMuted">Você ainda não tem agendamentos.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="h2">Meus Agendamentos</h2>
        <p className="pMutedSmall">Acompanhe e gerencie seus horários</p>
      </div>

      {bookings.map((item) => {
        const status = STATUS_LABEL[item.status] || STATUS_LABEL.pendente;
        return (
          <div key={item.id} className="adminCard">
            <div className="adminCardMain">
              <div className="adminCardName">
                {item.servicoNome}
                <span className="adminVisitTag" style={{ background: status.color, color: "#0B0A09" }}>
                  {status.label}
                </span>
              </div>
              <div className="adminCardMeta"><Calendar size={12} /> {item.dataLabel}</div>
              <div className="adminCardMeta"><Clock size={12} /> {item.horario}</div>
              {item.status !== "cancelado" && (
                <div className="adminCardMeta" style={{ color: "#8A8375" }}>
                  <AlertCircle size={12} /> Alterações com mín. 24h de antecedência
                </div>
              )}
            </div>
            <div className="adminCardActions">
              {item.status === "pendente" && (
  <>
    <button className="adminReopenBtn" onClick={() => setReagendando(item)}>
      <RefreshCw size={12} /> Reagendar
    </button>
    <button className="adminCancelBtn" onClick={() => handleCancelar(item)}>
      <XCircle size={12} /> Cancelar
    </button>
    <button className="adminConfirmBtn" onClick={() => handleConfirmarPresenca(item)}>
      <CheckCircle2 size={12} /> Confirmar Presença
    </button>
  </>
)}

              {item.status === "confirmado" && (
                <span className="adminCardRating" style={{ color: "#6FCF97" }}>
                  <CheckCircle2 size={12} /> Presença confirmada
                </span>
              )}
            </div>
          </div>
        );
      })}

      {reagendando && (
        <ReagendarModal item={reagendando} onClose={() => setReagendando(null)} />
      )}
    </div>
  );
}

function ReagendarModal({ item, onClose }) {
  const blockedDates = useBlockedDates();
  const { fetchOccupied } = useOccupiedSlots();
  const [novaData, setNovaData] = useState(item.dataKey || "");
  const [novoHorario, setNovoHorario] = useState("");
  const [occupied, setOccupied] = useState([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(null);

  const isSunday = novaData ? new Date(novaData + "T00:00:00").getDay() === 0 : false;
  const isSaturday = novaData ? new Date(novaData + "T00:00:00").getDay() === 6 : false;
  const isBlocked = novaData ? blockedDates.has(novaData) : false;

  const allSlots = isSunday ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
  const availableSlots = useMemo(
    () => allSlots.filter((t) => !occupied.includes(t) || t === item.horario),
    [allSlots, occupied, item.horario]
  );

  async function handleDataChange(e) {
    const val = e.target.value;
    setNovaData(val);
    setNovoHorario("");
    setErro(null);
    if (val) {
      const taken = await fetchOccupied(val);
      setOccupied(taken);
    }
  }

  async function handleConfirmar() {
    if (!novaData || !novoHorario) return;
    setSaving(true);
    setErro(null);
    try {
      await reagendarMeuAgendamento(item, novaData, novoHorario);
      onClose();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <button className="tooltipClose" onClick={onClose} aria-label="Fechar">
          <X size={16} />
        </button>
        <h3 className="h2">Reagendar</h3>
        <p className="pMutedSmall">{item.servicoNome} — atual: {item.dataLabel} às {item.horario}</p>

        <input
          type="date"
          value={novaData}
          min={today}
          onChange={handleDataChange}
          className="adminDateInput"
          style={{ width: "100%", marginTop: 12 }}
        />

        {isSaturday && <p className="loginError" style={{ marginTop: 8 }}>Sábado é fechado. Escolha outra data.</p>}
        {isBlocked && <p className="loginError" style={{ marginTop: 8 }}>Essa data está bloqueada. Escolha outra.</p>}

        {novaData && !isSaturday && !isBlocked && (
          <div className="slotsWrap" style={{ marginTop: 12 }}>
            <div className="slotsHeading">
              {isSunday ? "Domingo — 10h às 18h" : "Atendimento noturno, após 19h"}
            </div>
            {availableSlots.length === 0 ? (
              <p className="pMutedSmall">Sem horários livres neste dia.</p>
            ) : (
              <div className="slotsGrid">
                {availableSlots.map((t) => {
                  const active = t === novoHorario;
                  return (
                    <button
                      key={t}
                      onClick={() => setNovoHorario(t)}
                      className="slotBtn"
                      style={{
                        borderColor: active ? "#E8CE85" : "#2A241A",
                        background: active ? "#C9A24B" : "#151109",
                        color: active ? "#0B0A09" : "#F3ECDD",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {erro && <p className="loginError" style={{ marginTop: 10 }}>{erro}</p>}

        <div className="footerNav">
          <button className="ghostBtn" onClick={onClose}>Cancelar</button>
          <button
            className="primaryBtn"
            onClick={handleConfirmar}
            disabled={!novaData || !novoHorario || saving}
            style={{ opacity: !novaData || !novoHorario || saving ? 0.4 : 1 }}
          >
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
