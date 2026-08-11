import React, { useMemo, useState, useEffect } from "react";
import { Chrome, Sun, Moon, Check, ChevronLeft, ChevronRight, MessageCircle, Clock } from "lucide-react";

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

  const isClosed = (d) => isSaturday(d);
  const isDisabled = (d) => isPast(d) || isClosed(d);

  const allSlots = isSunday(selectedDay) ? SUNDAY_SLOTS : WEEKDAY_SLOTS;

  useEffect(() => {
    if (step === 0) return;
  }, [step]);

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
                className={`serviceCard ${service?.id === s.id ? "serviceCardActive" : ""}`}
                onClick={() => setService(s)}
              >
                <div>
                  <div className="serviceName">{s.name}</div>
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
            style={{ marginTop: 16 }}
          >
            Continuar
          </button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2>Escolha a data</h2>
          <div className="calendarNav">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="navBtn">
              <ChevronLeft size={16} />
            </button>
            <span className="monthLabel">{monthLabel}</span>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="navBtn">
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
                  disabled={!d || disabled}
                  onClick={() => setSelectedDay(d)}
                  className="dayCell"
                >
                  {d}
                  {sunday && <span className="sundayDot" />}
                  {active && <span className="activeDot"><Check size={10} /></span>}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div style={{ marginTop: 18 }}>
              <h3>Escolha o horário</h3>
              <div className="slotsGrid">
                {allSlots.map((t) => (
                  <button
                    key={t}
                    className={`slotBtn ${selectedTime === t ? "slotBtnActive" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTime && (
            <div style={{ marginTop: 18 }}>
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

          <div className="footerNav" style={{ marginTop: 24 }}>
            <button className="ghostBtn" onClick={() => setStep(0)}>
              Voltar
            </button>
            <button
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
          <h2>Confirmar</h2>
          <p>Resumo do agendamento pronto para integrar com WhatsApp.</p>
          <div className="summaryCard">
            <p><strong>Serviço:</strong> {service?.name}</p>
            <p><strong>Data:</strong> {selectedDay}</p>
            <p><strong>Horário:</strong> {selectedTime}</p>
            <p><strong>Telefone:</strong> {phone}</p>
          </div>
          <a className="whatsBtn" href="#" target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            Confirmar no WhatsApp
          </a>
        </section>
      )}
    </div>
  );
}
