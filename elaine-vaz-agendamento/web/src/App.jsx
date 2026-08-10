import React, { useMemo, useState, useEffect } from "react";
import { Chrome, Sun, Moon, Check, ChevronLeft, ChevronRight, MessageCircle, Clock, Download, X } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useCreateBooking, useOccupiedSlots } from "./hooks/useBooking";
import { SERVICES, WEEKDAY_SLOTS, SUNDAY_SLOTS } from "../../shared/services";
import { buildWhatsappConfirmationLink } from "../../shared/whatsapp";
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

// Escuta o evento que o navegador dispara quando o app pode ser instalado
// (PWA). Guarda o evento e o dispara de novo quando o usuário clica no
// nosso banner "Instalar app".
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !installed, promptInstall };
}

function IntroScreen({ onFinish }) {
  useEffect(() => {
    // segurança: mesmo se o vídeo falhar ou não disparar "onEnded",
    // avança sozinho depois de um tempo
    const fallback = setTimeout(onFinish, 6000);
    return () => clearTimeout(fallback);
  }, [onFinish]);

  return (
    <div className="introPage" onClick={onFinish}>
      <video
        className="introVideo"
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
      />
      <button className="introSkip" onClick={onFinish}>
        Pular
      </button>
    </div>
  );
}

export default function App() {
  const { user, loading, login } = useAuth();
  const { createBooking, saving } = useCreateBooking();
  const { fetchOccupied } = useOccupiedSlots();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("introSeen"));

  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [occupied, setOccupied] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState(null);

  // avança automaticamente pro passo 1 assim que o login completa
  useEffect(() => {
    if (user && step === 0) setStep(1);
  }, [user]);

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const cells = useMemo(() => buildMonth(viewDate.getFullYear(), viewDate.getMonth()), [monthOffset]);
  const monthLabel = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // 0 = domingo, 6 = sábado
  const weekdayOf = (d) => d && new Date(viewDate.getFullYear(), viewDate.getMonth(), d).getDay();
  const isSunday = (d) => weekdayOf(d) === 0;
  const isSaturday = (d) => weekdayOf(d) === 6;
  const isPast = (d) => {
    if (!d) return true;
    const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < t;
  };
  // sábado não tem atendimento
  const isClosed = (d) => isSaturday(d);
  const isDisabled = (d) => isPast(d) || isClosed(d);

  const allSlots = isSunday(selectedDay) ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
  const availableSlots = allSlots.filter((t) => !occupied.includes(t));

  async function handleSelectDay(d) {
    setSelectedDay(d);
    setSelectedTime(null);
    const dateKey = toDateKey(viewDate.getFullYear(), viewDate.getMonth(), d);
    const taken = await fetchOccupied(dateKey);
    setOccupied(taken);
  }

  const dateLabel =
    selectedDay &&
    new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });

  async function handleConfirm() {
    const dateKey = toDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay);
    try {
      await createBooking({
        usuarioId: user.uid,
        servico: service,
        dateKey,
        dateLabel,
        horario: selectedTime,
      });
      setWhatsappLink(
        buildWhatsappConfirmationLink({
          serviceName: service.name,
          dateLabel,
          time: selectedTime,
          clientName: user.displayName,
        })
      );
      setStep(3);
    } catch (err) {
      alert("Não foi possível confirmar o agendamento. Tente novamente em instantes.");
    }
  }

  const steps = ["Entrar", "Serviço", "Horário", "Confirmar"];

  function finishIntro() {
    sessionStorage.setItem("introSeen", "1");
    setShowIntro(false);
  }

  if (showIntro) return <IntroScreen onFinish={finishIntro} />;

  if (loading) return <div className="page" />;

  return (
    <div className="page">
      <div className="frame">
        {canInstall && !dismissedInstall && (
          <InstallBanner onInstall={promptInstall} onDismiss={() => setDismissedInstall(true)} />
        )}
        <Header step={step} steps={steps} />
        <div className="body">
          {step === 0 && <LoginStep onLogin={login} />}

          {step === 1 && (
            <ServiceStep
              selected={service}
              onSelect={setService}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && (
            <DateTimeStep
              cells={cells}
              monthLabel={monthLabel}
              selectedDay={selectedDay}
              setSelectedDay={handleSelectDay}
              isSunday={isSunday}
              isClosed={isClosed}
              isDisabled={isDisabled}
              onPrevMonth={() => setMonthOffset((m) => m - 1)}
              onNextMonth={() => setMonthOffset((m) => m + 1)}
              slots={availableSlots}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              onNext={handleConfirm}
              onBack={() => setStep(1)}
              saving={saving}
            />
          )}

          {step === 3 && (
            <ConfirmStep
              service={service}
              dateLabel={dateLabel}
              selectedTime={selectedTime}
              userName={user?.displayName}
              whatsappLink={whatsappLink}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="installBanner">
      <img src="/logo-carol-sampaio.png" alt="" className="installBannerIcon" />
      <div className="installBannerText">
        <div className="installBannerTitle">Instalar o app</div>
        <div className="installBannerSubtitle">Agende mais rápido direto da tela inicial</div>
      </div>
      <button className="installBannerBtn" onClick={onInstall}>
        <Download size={14} />
        Instalar
      </button>
      <button className="installBannerClose" onClick={onDismiss} aria-label="Fechar">
        <X size={16} />
      </button>
    </div>
  );
}

function Header({ step, steps }) {
  const total = steps.length;
  const progress = step / (total - 1);
  const radius = 30;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="header">
      <div className="brandRow">
        <div className="monogram">CS</div>
        <div>
          <div className="brandName">Carol Sampaio</div>
          <div className="brandSub">Onde há uma mulher confiante, há brilho</div>
        </div>
      </div>
      <div className="arcWrap" aria-hidden="true">
        <svg width="100%" height="46" viewBox="0 0 76 40">
          <path d="M 6 38 A 30 30 0 0 1 70 38" fill="none" stroke="#2A241A" strokeWidth="4" strokeLinecap="round" />
          <path
            d="M 6 38 A 30 30 0 0 1 70 38"
            fill="none"
            stroke="url(#sunGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 500ms ease" }}
          />
          <defs>
            <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B8642F" />
              <stop offset="100%" stopColor="#E8CE85" />
            </linearGradient>
          </defs>
        </svg>
        <div className="arcLabels">
          {steps.map((label, i) => (
            <span key={label} className="arcLabel" style={{ color: i <= step ? "#E8CE85" : "#6B6459", fontWeight: i === step ? 700 : 500 }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginStep({ onLogin }) {
  return (
    <div className="stepCenter">
      <img src="/logo-carol-sampaio.png" alt="Carol Sampaio" className="loginLogo" />
      <h1 className="h1">{"Beleza que você vê,\nsaúde que você sente."}</h1>
      <p className="pMuted">Entre com sua conta Google para marcar seu horário em segundos.</p>
      <button className="googleBtn" onClick={onLogin}>
        <Chrome size={18} />
        Continuar com Google
      </button>
      <p className="fineprint">
        Ao continuar, você concorda com o uso dos seus dados apenas para confirmar e lembrar seus agendamentos.
      </p>
    </div>
  );
}

function ServiceStep({ selected, onSelect, onNext, onBack }) {
  return (
    <div>
      <StepTitle title="Escolha o serviço" subtitle="Selecione o que você quer agendar" />
      <div className="serviceList">
        {SERVICES.map((s) => {
          const active = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="serviceCard"
              style={{
                borderColor: active ? "#C9A24B" : "#2A241A",
                background: active ? "linear-gradient(135deg,#1F1A11,#171310)" : "#151109",
              }}
            >
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="serviceName">
                  {s.name}
                  {s.tag && <span className="serviceTag">{s.tag}</span>}
                </div>
                <div className="serviceMeta">
                  <Clock size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                  {s.duration} · com {s.professional}
                </div>
              </div>
              <div className="radioOuter" style={{ borderColor: active ? "#E8CE85" : "#4A4436" }}>
                {active && <div className="radioInner" />}
              </div>
            </button>
          );
        })}
      </div>
      <FooterNav onBack={onBack} onNext={onNext} nextDisabled={!selected} />
    </div>
  );
}

function DateTimeStep({
  cells, monthLabel, selectedDay, setSelectedDay, isSunday, isClosed, isDisabled,
  onPrevMonth, onNextMonth, slots, selectedTime, setSelectedTime, onNext, onBack, saving,
}) {
  return (
    <div>
      <StepTitle title="Data e horário" subtitle="Seg a sex após 19h · Domingo das 10h às 18h · Sábado fechado" />
      <div className="calendarCard">
        <div className="calendarNav">
          <button className="navBtn" onClick={onPrevMonth} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
          <span className="monthLabel">{monthLabel}</span>
          <button className="navBtn" onClick={onNextMonth} aria-label="Próximo mês"><ChevronRight size={16} /></button>
        </div>
        <div className="weekRow">
          {DAYS.map((d, i) => <span key={i} className="weekDay">{d}</span>)}
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
                onClick={() => setSelectedDay(d)}
                className="dayCell"
                style={{
                  visibility: d ? "visible" : "hidden",
                  background: active ? "#C9A24B" : "transparent",
                  color: active ? "#0B0A09" : disabled ? "#4A4436" : sunday ? "#E8CE85" : "#F3ECDD",
                  fontWeight: active ? 700 : sunday ? 600 : 500,
                  cursor: disabled ? "default" : "pointer",
                  textDecoration: closed ? "line-through" : "none",
                }}
              >
                {d}
                {sunday && !active && <span className="sundayDot" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="slotsWrap">
          <div className="slotsHeading">
            {isSunday(selectedDay) ? (
              <><Sun size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Domingo — 10h às 18h</>
            ) : (
              <><Moon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Atendimento noturno, após 19h</>
            )}
          </div>
          {slots.length === 0 ? (
            <p className="pMutedSmall">Sem horários livres neste dia. Escolha outra data.</p>
          ) : (
            <div className="slotsGrid">
              {slots.map((t) => {
                const active = t === selectedTime;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className="slotBtn"
                    style={{ borderColor: active ? "#E8CE85" : "#2A241A", background: active ? "#C9A24B" : "#151109", color: active ? "#0B0A09" : "#F3ECDD" }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <FooterNav onBack={onBack} onNext={onNext} nextDisabled={!selectedDay || !selectedTime || saving} nextLabel={saving ? "Agendando..." : "Continuar"} />
    </div>
  );
}

function ConfirmStep({ service, dateLabel, selectedTime, userName, whatsappLink, onBack }) {
  return (
    <div className="stepCenter">
      <div className="checkCircle"><Check size={22} color="#0B0A09" strokeWidth={3} /></div>
      <h1 className="h1">Quase lá, {userName?.split(" ")[0]}!</h1>
      <p className="pMuted">Confira os detalhes e confirme pelo WhatsApp.</p>
      <div className="summaryCard">
        <SummaryRow label="Serviço" value={service?.name} />
        <SummaryRow label="Duração" value={service?.duration} />
        <SummaryRow label="Profissional" value={service?.professional} />
        <div className="summaryDivider" />
        <SummaryRow label="Data" value={dateLabel} capitalize />
        <SummaryRow label="Horário" value={selectedTime} />
        <div className="summaryDivider" />
        <SummaryRow label="Local" value="Cel. Cardoso de Siqueira, 1744 — Vila Oliveira" />
      </div>
      <a href={whatsappLink} target="_blank" rel="noreferrer" className="whatsBtn">
        <MessageCircle size={18} />
        Confirmar no WhatsApp
      </a>
      <button className="backLink" onClick={onBack}>Alterar horário</button>
    </div>
  );
}

function SummaryRow({ label, value, capitalize }) {
  return (
    <div className="summaryRow">
      <span className="summaryLabel">{label}</span>
      <span className="summaryValue" style={{ textTransform: capitalize ? "capitalize" : "none" }}>{value}</span>
    </div>
  );
}

function StepTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 className="h2">{title}</h2>
      <p className="pMutedSmall">{subtitle}</p>
    </div>
  );
}

function FooterNav({ onBack, onNext, nextDisabled, nextLabel = "Continuar" }) {
  return (
    <div className="footerNav">
      <button className="ghostBtn" onClick={onBack}>Voltar</button>
      <button className="primaryBtn" style={{ opacity: nextDisabled ? 0.4 : 1, pointerEvents: nextDisabled ? "none" : "auto" }} onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );
}
