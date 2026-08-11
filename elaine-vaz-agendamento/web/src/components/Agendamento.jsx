import React, { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MessageCircle, Clock } from "lucide-react";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const SERVICES = [
  { id: "servico1", name: "Serviço 1", duration: "1h", professional: "Carol" },
  { id: "servico2", name: "Serviço 2", duration: "1h30", professional: "Carol" },
];

const WEEKDAY_SLOTS = ["19:00", "19:30", "20:00", "20:30", "21:00"];
const SUNDAY_SLOTS = ["10:00", "10:30", "11:00", "11:30", "12:00"];

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

export default function Agendamento() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [phone, setPhone] = useState("");

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  const cells = useMemo(
    () => buildMonth(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const monthLabel = viewDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const weekdayOf = (d) => d && new Date(viewDate.getFullYear(), viewDate.getMonth(), d).getDay();
  const isSunday = (d) => weekdayOf(d) === 0;
  const isSaturday = (d) => weekdayOf(d) === 6;

  const isPast = (d) => {
    if (!d) return true;
    const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < t;
  };

  const isClosed = (d) => isSaturday(d);
  const isDisabled = (d) => isPast(d) || isClosed(d);

  const allSlots = isSunday(selectedDay) ? SUNDAY_SLOTS : WEEKDAY_SLOTS;

  const selectedDateLabel = selectedDay
    ? new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay).toLocaleDateString("pt-BR")
    : "";

  const summaryDateKey = selectedDay
    ? toDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay)
    : "";

  return (
    <div>
      {step === 0 && (
        <section>
          <h2>Agendamento</h2>
          <p>Escolha um serviço para começar.</p>

          <div className="serviceList">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`serviceCard ${service?.id === s.id ? "serviceCardActive" : ""}`}
                onClick={() => setService(s)}
              >
                <div className="radioOuter">
                  {service?.id === s.id && <div className="radioInner" />}
                </div>

                <div style={{ flex: 1 }}>
                  <div className="serviceName">
                    {s.name}
                    <span className="serviceTag">Popular</span>
                  </div>

                  <div className="serviceMeta">
                    <Clock size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                    {s.duration} · com {s.professional}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            className="primaryBtn"
            disabled={!service}
            onClick={() => setStep(1)}
            style={{ marginTop: 16, width: "100%" }}
          >
            Continuar
          </button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2>Escolha a data</h2>
          <p>Selecione o dia e depois escolha o horário disponível.</p>

          <div className="calendarCard">
            <div className="calendarNav">
              <button type="button" onClick={() => setMonthOffset((m) => m - 1)} className="navBtn">
                <ChevronLeft size={16} />
              </button>

              <span className="monthLabel">{monthLabel}</span>

              <button type="button" onClick={() => setMonthOffset((m) => m + 1)} className="navBtn">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="weekRow">
              {DAYS.map((d, i) => (
                <span key={i} className="weekDay">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid">
              {cells.map((d, i) => {
                const disabled = isDisabled(d);
                const sunday = isSunday(d);
                const active = d === selectedDay;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!d || disabled}
                    onClick={() => {
                      setSelectedDay(d);
                      setSelectedTime(null);
                      setPhone("");
                    }}
                    className="dayCell"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, #E8CE85, #C9A24B)"
                        : disabled
                        ? "transparent"
                        : "#151109",
                      color: active ? "#0B0A09" : disabled ? "#5F594C" : "#F3ECDD",
                      cursor: !d || disabled ? "not-allowed" : "pointer",
                      opacity: !d ? 0 : 1,
                    }}
                  >
                    {d}
                    {sunday && !active && <span className="sundayDot" />}
                    {active && (
                      <span className="activeDot">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDay && (
            <div className="slotsWrap">
              <h3 className="slotsHeading">Escolha o horário</h3>

              <div className="slotsGrid">
                {allSlots.map((t) => {
                  const active = selectedTime === t;

                  return (
                    <button
                      key={t}
                      type="button"
                      className="slotBtn"
                      onClick={() => setSelectedTime(t)}
                      style={{
                        background: active ? "linear-gradient(135deg, #E8CE85, #C9A24B)" : "#151109",
                        color: active ? "#0B0A09" : "#F3ECDD",
                        borderColor: active ? "transparent" : "#2A241A",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTime && (
            <div className="phoneWrap">
              <label className="phoneLabel">Seu telefone (WhatsApp)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="phoneInput"
              />
            </div>
          )}

          <div className="footerNav">
            <button
              type="button"
              className="ghostBtn"
              onClick={() => {
                setStep(0);
                setSelectedDay(null);
                setSelectedTime(null);
                setPhone("");
              }}
            >
              Voltar
            </button>

            <button
              type="button"
              className="primaryBtn"
              disabled={!selectedDay || !selectedTime || phone.trim().length < 8}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <div className="stepCenter">
            <div className="checkCircle">
              <Check size={22} color="#0B0A09" />
            </div>

            <h2>Confirmar</h2>
            <p>Resumo do agendamento pronto para integrar com WhatsApp.</p>
          </div>

          <div className="summaryCard">
            <div className="summaryRow">
              <span className="summaryLabel">Serviço</span>
              <span className="summaryValue">{service?.name}</span>
            </div>

            <div className="summaryDivider" />

            <div className="summaryRow">
              <span className="summaryLabel">Data</span>
              <span className="summaryValue">{selectedDateLabel}</span>
            </div>

            <div className="summaryDivider" />

            <div className="summaryRow">
              <span className="summaryLabel">Horário</span>
              <span className="summaryValue">{selectedTime}</span>
            </div>

            <div className="summaryDivider" />

            <div className="summaryRow">
              <span className="summaryLabel">Telefone</span>
              <span className="summaryValue">{phone}</span>
            </div>
          </div>

          <a
            className="whatsBtn"
            href={`https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Olá! Quero confirmar meu agendamento.\n\nServiço: ${service?.name}\nData: ${selectedDateLabel}\nHorário: ${selectedTime}\nCódigo: ${summaryDateKey}`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} />
            Confirmar no WhatsApp
          </a>

          <button
            type="button"
            className="backLink"
            onClick={() => setStep(1)}
          >
            Voltar para edição
          </button>
        </section>
      )}
    </div>
  );
}
