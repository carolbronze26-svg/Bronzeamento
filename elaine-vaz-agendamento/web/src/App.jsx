import React, { useMemo, useState, useEffect } from "react";
import {
  Chrome, Sun, Moon, Check, ChevronLeft, ChevronRight, MessageCircle, Clock,
  Download, X, LogIn, LogOut, CalendarDays, Star, Instagram, MapPin, Phone,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useCreateBooking, useOccupiedSlots } from "./hooks/useBooking";
import { useBlockedDates } from "./hooks/useBlockedDates";
import { useReviews } from "./hooks/useReviews";
import { SERVICES, WEEKDAY_SLOTS, SUNDAY_SLOTS } from "../../shared/services";
import { buildWhatsappConfirmationLink } from "../../shared/whatsapp";
import { ReviewCard } from "./ReviewsPage.jsx";
import "./styles.css";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const CAROL_WHATSAPP = "5511931101976";
const INSTAGRAM_HANDLE = "carol_sampaio_bronze_massagem";
const ENDERECO = "Cel. Cardoso de Siqueira, 1744 — Vila Oliveira";

const TABS = [
  { id: "entrar", label: "Entrar", icon: LogIn },
  { id: "agendamento", label: "Agendamento", icon: CalendarDays },
  { id: "avaliacao", label: "Avaliação", icon: Star },
  { id: "social", label: "Rede Social", icon: Instagram },
  { id: "localizacao", label: "Localização", icon: MapPin },
];

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
    const fallback = setTimeout(onFinish, 6000);
    return () => clearTimeout(fallback);
  }, [onFinish]);

  return (
    <div className="introPage" onClick={onFinish}>
      <video className="introVideo" src="/intro.mp4" autoPlay muted playsInline onEnded={onFinish} />
      <button className="introSkip" onClick={onFinish}>Pular</button>
    </div>
  );
}

export default function App() {
  const { user, loading, login, logout, authError } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("introSeen"));
  const [activeTab, setActiveTab] = useState("entrar");

  useEffect(() => {
    if (user && activeTab === "entrar") setActiveTab("agendamento");
  }, [user]);

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
        <div className="brandRow" style={{ padding: "20px 22px 0" }}>
          <div className="monogram">CS</div>
          <div>
            <div className="brandName">Carol Sampaio</div>
            <div className="brandSub">Onde há uma mulher confiante, há brilho</div>
          </div>
        </div>

        <TabBar activeTab={activeTab} onChange={setActiveTab} loggedIn={!!user} />

        <div className="body">
          {activeTab === "entrar" && (
            <EntrarTab user={user} onLogin={login} onLogout={logout} authError={authError} />
          )}
          {activeTab === "agendamento" && (
            <AgendamentoTab
              user={user}
              onGoToEntrar={() => setActiveTab("entrar")}
            />
          )}
          {activeTab === "avaliacao" && <AvaliacaoTab />}
          {activeTab === "social" && <SocialTab />}
          {activeTab === "localizacao" && <LocalizacaoTab />}
        </div>
      </div>
    </div>
  );
}

function TabBar({ activeTab, onChange, loggedIn }) {
  return (
    <div className="tabBar">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className="tabItem"
            style={{ color: active ? "#E8CE85" : "#6B6459" }}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={16} />
            <span className="tabLabel">{tab.label}</span>
            {tab.id === "entrar" && loggedIn && <span className="tabDot" />}
            {active && <span className="tabUnderline" />}
          </button>
        );
      })}
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

// ---------------------------------------------------------------------------
// Aba: Entrar
// ---------------------------------------------------------------------------
function EntrarTab({ user, onLogin, onLogout, authError }) {
  if (user) {
    return (
      <div className="stepCenter">
        {user.photoURL && <img src={user.photoURL} alt="" className="userAvatar" />}
        <h1 className="h1">Olá, {user.displayName?.split(" ")[0]}!</h1>
        <p className="pMuted">Você está conectado como {user.email}.</p>
        <button className="ghostBtn" style={{ maxWidth: 220 }} onClick={onLogout}>
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="stepCenter">
      <img src="/logo-carol-sampaio.png" alt="Carol Sampaio - Beleza que você vê, saúde que você sente" className="loginLogo" />
      <p className="pMuted">Entre com sua conta Google para marcar seu horário em segundos.</p>
      <button className="googleBtn" onClick={onLogin}>
        <Chrome size={18} />
        Continuar com Google
      </button>
      {authError && (
        <p className="loginError">
          Não foi possível entrar com o Google. Verifique sua conexão e tente novamente.
        </p>
      )}
      <p className="fineprint">
        Ao continuar, você concorda com o uso dos seus dados apenas para confirmar e lembrar seus agendamentos.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba: Agendamento (serviço → data/hora → confirmar)
// ---------------------------------------------------------------------------
function AgendamentoTab({ user, onGoToEntrar }) {
  const { createBooking, saving } = useCreateBooking();
  const { fetchOccupied } = useOccupiedSlots();
  const blockedDates = useBlockedDates();

  const [subStep, setSubStep] = useState(0); // 0 Serviço, 1 Horário, 2 Confirmar
  const [service, setService] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [occupied, setOccupied] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [phone, setPhone] = useState("");
  const [whatsappLink, setWhatsappLink] = useState(null);

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
  const isBlocked = (d) => d && blockedDates.has(toDateKey(viewDate.getFullYear(), viewDate.getMonth(), d));
  const isClosed = (d) => isSaturday(d) || isBlocked(d);
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
        nome: user.displayName,
        email: user.email,
        telefone: phone,
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
      setSubStep(2);
    } catch (err) {
      alert("Não foi possível confirmar o agendamento. Tente novamente em instantes.");
    }
  }

  if (!user) {
    return (
      <div className="stepCenter">
        <CalendarDays size={28} color="#C9A24B" style={{ marginBottom: 14 }} />
        <h1 className="h1">Faça login para agendar</h1>
        <p className="pMuted">Você precisa entrar com sua conta Google antes de marcar um horário.</p>
        <button className="googleBtn" onClick={onGoToEntrar}>
          <LogIn size={18} />
          Ir para Entrar
        </button>
      </div>
    );
  }

  const subSteps = ["Serviço", "Horário", "Confirmar"];

  return (
    <div>
      <MiniProgress step={subStep} steps={subSteps} />

      {subStep === 0 && (
        <ServiceStep
          selected={service}
          onSelect={setService}
          onNext={() => setSubStep(1)}
        />
      )}

      {subStep === 1 && (
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
          phone={phone}
          setPhone={setPhone}
          onNext={handleConfirm}
          onBack={() => setSubStep(0)}
          saving={saving}
        />
      )}

      {subStep === 2 && (
        <ConfirmStep
          service={service}
          dateLabel={dateLabel}
          selectedTime={selectedTime}
          userName={user?.displayName}
          whatsappLink={whatsappLink}
          onBack={() => setSubStep(1)}
        />
      )}
    </div>
  );
}

function MiniProgress({ step, steps }) {
  return (
    <div className="miniProgress">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <span className="miniProgressLabel" style={{ color: i <= step ? "#E8CE85" : "#6B6459", fontWeight: i === step ? 700 : 500 }}>
            {label}
          </span>
          {i < steps.length - 1 && <span className="miniProgressDivider" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function ServiceStep({ selected, onSelect, onNext }) {
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
      <div className="footerNav">
        <button className="primaryBtn" style={{ flex: 1, opacity: selected ? 1 : 0.4, pointerEvents: selected ? "auto" : "none" }} onClick={onNext}>
          Continuar
        </button>
      </div>
    </div>
  );
}

function DateTimeStep({
  cells, monthLabel, selectedDay, setSelectedDay, isSunday, isClosed, isDisabled,
  onPrevMonth, onNextMonth, slots, selectedTime, setSelectedTime, phone, setPhone, onNext, onBack, saving,
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

      {selectedTime && (
        <div className="phoneWrap">
          <label className="phoneLabel">Seu telefone (WhatsApp)</label>
          <input
            type="tel"
            inputMode="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="phoneInput"
          />
        </div>
      )}

      <FooterNav onBack={onBack} onNext={onNext} nextDisabled={!selectedDay || !selectedTime || phone.trim().length < 8 || saving} nextLabel={saving ? "Agendando..." : "Continuar"} />
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
        <SummaryRow label="Local" value={ENDERECO} />
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

// ---------------------------------------------------------------------------
// Aba: Avaliação
// ---------------------------------------------------------------------------
function AvaliacaoTab() {
  const { reviews, loading } = useReviews();
  return (
    <div>
      <StepTitle title="Avaliações" subtitle="O que as clientes acham do atendimento" />
      {loading && <p className="pMutedSmall">Carregando...</p>}
      {!loading && reviews.length === 0 && <p className="pMutedSmall">Ainda não há avaliações por aqui.</p>}
      {reviews.map((r) => <ReviewCard key={r.id} item={r} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba: Rede Social
// ---------------------------------------------------------------------------
function SocialTab() {
  const whatsappContato = `https://wa.me/${CAROL_WHATSAPP}?text=${encodeURIComponent("Olá! Gostaria de tirar uma dúvida.")}`;
  return (
    <div>
      <StepTitle title="Rede Social" subtitle="Siga e fale com a gente por aqui" />
      <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noreferrer" className="socialCard">
        <Instagram size={20} color="#E8CE85" />
        <div>
          <div className="socialCardTitle">Instagram</div>
          <div className="socialCardSubtitle">@{INSTAGRAM_HANDLE}</div>
        </div>
      </a>
      <a href={whatsappContato} target="_blank" rel="noreferrer" className="socialCard">
        <Phone size={20} color="#6FCF97" />
        <div>
          <div className="socialCardTitle">WhatsApp</div>
          <div className="socialCardSubtitle">Falar com a Carol</div>
        </div>
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba: Localização
// ---------------------------------------------------------------------------
function LocalizacaoTab() {
  const query = encodeURIComponent(ENDERECO);
  return (
    <div>
      <StepTitle title="Localização" subtitle="Onde acontece o atendimento" />
      <div className="mapWrap">
        <iframe
          title="Localização"
          src={`https://maps.google.com/maps?q=${query}&output=embed`}
          className="mapFrame"
          loading="lazy"
        />
      </div>
      <div className="addressBlock">
        <MapPin size={16} color="#C9A24B" />
        <span>{ENDERECO}</span>
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noreferrer"
        className="ghostBtn"
        style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 10 }}
      >
        Abrir no Google Maps
      </a>
    </div>
  );
}