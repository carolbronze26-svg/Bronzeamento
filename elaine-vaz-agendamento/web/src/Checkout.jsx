import React, { useMemo, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CreditCard, Sun, Moon, Check, X } from "lucide-react";
import { db } from "./firebase";
import { useOccupiedSlots, useCreateBooking } from "./hooks/useBooking";
import { useBlockedDates, isDiaTotalmenteBloqueado, getHorariosBloqueados } from "./hooks/useBlockedDates";
import { SERVICES, PACOTES, WEEKDAY_SLOTS, SUNDAY_SLOTS } from "../../shared/services";
import "./styles.css";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// item: { tipo: "pacote" | "servico", id, nome, valor, qtdSessoes? }
export default function Checkout({ user, item, onClose }) {
  const isPacote = item.tipo === "pacote";

  // Para pacote, precisamos saber qual serviço será agendado nas sessões
  const pacoteInfo = isPacote ? PACOTES.find((p) => p.id === item.id) : null;
  const servicoDoPacote = pacoteInfo ? SERVICES.find((s) => s.id === pacoteInfo.servicoId) : null;

  // step: "agendar" (só pacote) -> "resumo" -> "loading" | "error"
  const [step, setStep] = useState(isPacote ? "agendar" : "resumo");
  const [sessoesEscolhidas, setSessoesEscolhidas] = useState([]); // [{dataKey, dataLabel, horario}]

  async function handleAgendarConcluido(sessoes) {
    setSessoesEscolhidas(sessoes);
    setStep("resumo");
  }

  async function iniciarCompra() {
    setStep("loading");
    try {
      const referenciaId = `${user.uid}_${Date.now()}`;

      if (isPacote) {
        // 1. Cria o doc do pacote do cliente (pendente até pagamento aprovar)
        await setDoc(doc(db, "pacotesClientes", referenciaId), {
          clienteId: user.uid,
          nome: user.displayName,
          email: user.email,
          pacoteId: item.id,
          sessoesRestantes: 0, // liberado pelo webhook quando pagamento aprovar
          status: "pendente",
          criadoEm: serverTimestamp(),
        });

        // 2. Cria os N agendamentos já vinculados ao pacote, reservando os horários
        for (const sessao of sessoesEscolhidas) {
          await setDoc(doc(db, "agendamentos", `${referenciaId}_s${sessoesEscolhidas.indexOf(sessao)}`), {
            usuarioId: user.uid,
            nome: user.displayName || "",
            email: user.email || "",
            telefone: "",
            servicoId: servicoDoPacote.id,
            servicoNome: servicoDoPacote.name,
            profissional: servicoDoPacote.professional,
            preco: null,
            pacoteClienteId: referenciaId,
            dataKey: sessao.dataKey,
            dataLabel: sessao.dataLabel,
            horario: sessao.horario,
            status: "pendente",
            criadoEm: serverTimestamp(),
          });
        }
      } else {
        await setDoc(doc(db, "pagamentos", referenciaId), {
          clienteId: user.uid,
          nome: user.displayName,
          email: user.email,
          servicoId: item.id,
          servicoNome: item.nome,
          status: "pendente",
          criadoEm: serverTimestamp(),
        });
      }

      // Chama a Vercel Function que cria a preferência no Mercado Pago
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.nome,
          price: item.valor,
          referenciaId,
          tipo: item.tipo,
          itemId: item.id,
          clienteEmail: user.email,
        }),
      });

      const data = await res.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setStep("error");
      }
    } catch (err) {
      console.error(err);
      setStep("error");
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        {step !== "agendar" && (
          <button className="tooltipClose" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        )}

        {step === "agendar" && (
          <AgendarSessoesStep
            qtdSessoes={item.qtdSessoes}
            servico={servicoDoPacote}
            onClose={onClose}
            onConcluir={handleAgendarConcluido}
          />
        )}

        {step === "resumo" && (
          <>
            <h2 className="h2">{item.nome}</h2>
            {isPacote ? (
              <>
                <p className="pMutedSmall">
                  {item.qtdSessoes} sessões por <strong>R$ {item.valor.toFixed(2)}</strong>
                </p>
                <div style={{ margin: "12px 0" }}>
                  {sessoesEscolhidas.map((s, i) => (
                    <div key={i} className="pMutedSmall" style={{ marginBottom: 4 }}>
                      <Check size={12} style={{ marginRight: 6, verticalAlign: -1, color: "#6FCF97" }} />
                      Sessão {i + 1}: {s.dataLabel} às {s.horario}
                    </div>
                  ))}
                </div>
                <button className="backLink" onClick={() => setStep("agendar")}>
                  Alterar datas
                </button>
              </>
            ) : (
              <p className="pMutedSmall">
                Valor: <strong>R$ {item.valor.toFixed(2)}</strong>
              </p>
            )}

            <p className="pMutedSmall" style={{ marginTop: 10 }}>
              Você será redirecionado ao Mercado Pago para escolher Pix, Crédito ou Débito.
            </p>
            <button className="primaryBtn" style={{ width: "100%", marginTop: 16 }} onClick={iniciarCompra}>
              <CreditCard size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
              Ir para pagamento
            </button>
            <button className="backLink" onClick={onClose}>Fechar</button>
          </>
        )}

        {step === "loading" && <p className="pMutedSmall">Gerando pagamento...</p>}
        {step === "error" && (
          <>
            <p className="loginError">Não foi possível processar o pagamento. Tente novamente.</p>
            <button className="backLink" onClick={onClose}>Fechar</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo de agendamento das N sessões do pacote
// ---------------------------------------------------------------------------
function AgendarSessoesStep({ qtdSessoes, servico, onClose, onConcluir }) {
  const { fetchOccupied } = useOccupiedSlots();
  const blockedDates = useBlockedDates();

  const [sessoes, setSessoes] = useState([]); // sessões já confirmadas
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [occupied, setOccupied] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const cells = useMemo(() => buildMonth(viewDate.getFullYear(), viewDate.getMonth()), [monthOffset]);
  const monthLabel = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const weekdayOf = (d) => d && new Date(viewDate.getFullYear(), viewDate.getMonth(), d).getDay();
  const isSunday = (d) => weekdayOf(d) === 0;
  const isSaturday = (d) => weekdayOf(d) === 6;
  const isPast = (d) => {
    if (!d) return true;
    const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < t;
  };
  const dateKeyOf = (d) => d && toDateKey(viewDate.getFullYear(), viewDate.getMonth(), d);
  const isBlocked = (d) => d && isDiaTotalmenteBloqueado(blockedDates, dateKeyOf(d));
  const isClosed = (d) => isSaturday(d) || isBlocked(d);

  // Impede escolher a mesma data já usada em outra sessão do pacote
  const jaEscolhida = (d) => d && sessoes.some((s) => s.dataKey === dateKeyOf(d));
  const isDisabled = (d) => isPast(d) || isClosed(d) || jaEscolhida(d);

  const horariosBloqueados = selectedDay ? getHorariosBloqueados(blockedDates, dateKeyOf(selectedDay)) : [];
  const allSlots = isSunday(selectedDay) ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
  const availableSlots = allSlots.filter(
    (t) => !occupied.includes(t) && !horariosBloqueados.includes(t)
  );

  async function handleSelectDay(d) {
    setSelectedDay(d);
    setSelectedTime(null);
    const taken = await fetchOccupied(dateKeyOf(d));
    setOccupied(taken);
  }

  function handleAdicionarSessao() {
    if (!selectedDay || !selectedTime) return;
    const dataLabel = new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay).toLocaleDateString(
      "pt-BR",
      { weekday: "long", day: "2-digit", month: "long" }
    );
    setSessoes((prev) => [...prev, { dataKey: dateKeyOf(selectedDay), dataLabel, horario: selectedTime }]);
    setSelectedDay(null);
    setSelectedTime(null);
    setOccupied([]);
  }

  function handleRemoverSessao(index) {
    setSessoes((prev) => prev.filter((_, i) => i !== index));
  }

  const completo = sessoes.length >= qtdSessoes;

  return (
    <div>
      <h2 className="h2">Escolha suas sessões</h2>
      <p className="pMutedSmall" style={{ marginBottom: 14 }}>
        {servico?.name} — selecione {qtdSessoes} datas e horários ({sessoes.length}/{qtdSessoes})
      </p>

      {sessoes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {sessoes.map((s, i) => (
            <div
              key={i}
              className="adminCardMeta"
              style={{ justifyContent: "space-between", display: "flex", alignItems: "center", marginBottom: 6 }}
            >
              <span>
                <Check size={12} style={{ marginRight: 6, verticalAlign: -1, color: "#6FCF97" }} />
                Sessão {i + 1}: {s.dataLabel} às {s.horario}
              </span>
              <button className="tooltipClose" style={{ position: "static" }} onClick={() => handleRemoverSessao(i)}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!completo && (
        <>
          <div className="calendarCard">
            <div className="calendarNav">
              <button className="navBtn" onClick={() => setMonthOffset((m) => m - 1)} aria-label="Mês anterior">
                ‹
              </button>
              <span className="monthLabel">{monthLabel}</span>
              <button className="navBtn" onClick={() => setMonthOffset((m) => m + 1)} aria-label="Próximo mês">
                ›
              </button>
            </div>
            <div className="weekRow">
              {DAYS.map((d, i) => (
                <span key={i} className="weekDay">{d}</span>
              ))}
            </div>
            <div className="grid">
              {cells.map((d, i) => {
                const disabled = isDisabled(d);
                const closed = isClosed(d);
                const sunday = isSunday(d);
                const active = d === selectedDay;
                return (
                  <button
                    key={i}
                    disabled={!d || disabled}
                    onClick={() => handleSelectDay(d)}
                    className="dayCell"
                    style={{
                      visibility: d ? "visible" : "hidden",
                      background: active ? "#C9A24B" : "transparent",
                      color: active ? "#0B0A09" : disabled ? "#4A4436" : sunday ? "#E8CE85" : "#F3ECDD",
                      fontWeight: active ? 700 : sunday ? 600 : 500,
                      cursor: disabled ? "default" : "pointer",
                      textDecoration: closed || jaEscolhida(d) ? "line-through" : "none",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDay && (
            <div className="slotsWrap" style={{ marginTop: 12 }}>
              <div className="slotsHeading">
                {isSunday(selectedDay) ? (
                  <><Sun size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Domingo — 10h às 18h</>
                ) : (
                  <><Moon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Atendimento noturno, após 19h</>
                )}
              </div>
              {availableSlots.length === 0 ? (
                <p className="pMutedSmall">Sem horários livres neste dia.</p>
              ) : (
                <div className="slotsGrid">
                  {availableSlots.map((t) => {
                    const active = t === selectedTime;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
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

          <div className="footerNav">
            <button
              className="primaryBtn"
              style={{ width: "100%", opacity: !selectedDay || !selectedTime ? 0.4 : 1 }}
              onClick={handleAdicionarSessao}
              disabled={!selectedDay || !selectedTime}
            >
              Adicionar sessão
            </button>
          </div>
        </>
      )}

      <div className="footerNav">
        <button className="ghostBtn" onClick={onClose}>Cancelar</button>
        <button
          className="primaryBtn"
          style={{ opacity: completo ? 1 : 0.4 }}
          disabled={!completo}
          onClick={() => onConcluir(sessoes)}
        >
          Continuar para pagamento
        </button>
      </div>
    </div>
  );
}
