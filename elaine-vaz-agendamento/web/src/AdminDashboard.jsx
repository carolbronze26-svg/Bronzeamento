import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import {
  Chrome, Clock, CheckCircle2, XCircle, Phone, Mail, Calendar,
  Search, Star, TrendingUp, Users, MessageCircle, CalendarOff, Trash2, Activity, Bell, BarChart3,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { SERVICES, WEEKDAY_SLOTS, SUNDAY_SLOTS, formatPreco } from "../../shared/services";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import { ReviewCard } from "./ReviewsPage.jsx";
import "./styles.css";

// E-mails autorizados a ver o painel administrativo.
const ADMIN_EMAILS = ["carol.bronze26@gmail.com"];

const ADMIN_TABS = [
  { id: "andamento", label: "Andamento", icon: Activity },
  { id: "lembretes", label: "Lembretes", icon: Bell },
  { id: "cancelamento", label: "Cancelamento", icon: XCircle },
  { id: "bloqueio", label: "Bloquear data", icon: CalendarOff },
  { id: "avaliacao", label: "Avaliação", icon: Star },
  { id: "relatorio", label: "Relatório", icon: BarChart3 },
];

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function noPeriodo(dataKey, periodo, customStart, customEnd) {
  if (!dataKey) return periodo === "tudo";

  if (periodo === "custom") {
    if (!customStart || !customEnd) return true;
    return dataKey >= customStart && dataKey <= customEnd;
  }

  if (periodo === "tudo") return true;

  const hoje = new Date();
  const [ano, mes, dia] = dataKey.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (periodo === "mes") {
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
  }
  if (periodo === "30dias") {
    const diffDias = (hoje - data) / (1000 * 60 * 60 * 24);
    return diffDias >= 0 && diffDias <= 30;
  }
  return true;
}

function noPeriodoAnterior(dataKey, periodo, customStart, customEnd) {
  if (!dataKey) return false;
  const [ano, mes, dia] = dataKey.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  if (periodo === "mes") {
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return data.getFullYear() === mesAnterior.getFullYear() && data.getMonth() === mesAnterior.getMonth();
  }
  if (periodo === "30dias") {
    const diffDias = (hoje - data) / (1000 * 60 * 60 * 24);
    return diffDias > 30 && diffDias <= 60;
  }
  if (periodo === "custom") {
    if (!customStart || !customEnd) return false;
    const inicio = new Date(customStart);
    const fim = new Date(customEnd);
    const duracaoDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
    const fimAnterior = new Date(inicio);
    fimAnterior.setDate(fimAnterior.getDate() - 1);
    const inicioAnterior = new Date(fimAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - duracaoDias + 1);
    return data >= inicioAnterior && data <= fimAnterior;
  }
  return false; // "tudo" não tem período anterior pra comparar
}

function calcDelta(atual, anterior) {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

function clientKey(item) {
  return (item.email || item.telefone || "").toLowerCase();
}

export default function AdminDashboard() {
  const { user, loading, login } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [bloqueios, setBloqueios] = useState([]);
  const [novaDataBloqueio, setNovaDataBloqueio] = useState("");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [horariosBloqueio, setHorariosBloqueio] = useState([]);
  const [diaTodoBloqueio, setDiaTodoBloqueio] = useState(false);
  const [activeTab, setActiveTab] = useState("andamento");
  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "agendamentos"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAgendamentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, "avaliacoes"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setAvaliacoes(map);
    });
    return unsubscribe;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, "bloqueios"), (snap) => {
      setBloqueios(
        snap.docs
          .map((d) => ({ data: d.id, ...d.data() }))
          .sort((a, b) => a.data.localeCompare(b.data))
      );
    });
    return unsubscribe;
  }, [isAdmin]);

  async function adicionarBloqueio() {
    if (!novaDataBloqueio) return;
    if (!diaTodoBloqueio && horariosBloqueio.length === 0) {
      alert("Escolha pelo menos um horário, ou marque 'Bloquear o dia inteiro'.");
      return;
    }
    try {
      await setDoc(doc(db, "bloqueios", novaDataBloqueio), {
        motivo: motivoBloqueio.trim(),
        diaTodo: diaTodoBloqueio,
        horarios: diaTodoBloqueio ? [] : horariosBloqueio,
        criadoEm: serverTimestamp(),
      });
      setNovaDataBloqueio("");
      setMotivoBloqueio("");
      setHorariosBloqueio([]);
      setDiaTodoBloqueio(false);
    } catch (err) {
      alert("Não foi possível bloquear essa data. Tente novamente.");
    }
  }

  function toggleHorarioBloqueio(h) {
    setHorariosBloqueio((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  }

  // domingo (0) usa os horários de domingo; qualquer outro dia usa os de semana
  const slotsDoDiaBloqueio = useMemo(() => {
    if (!novaDataBloqueio) return [];
    const [ano, mes, dia] = novaDataBloqueio.split("-").map(Number);
    const weekday = new Date(ano, mes - 1, dia).getDay();
    return weekday === 0 ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
  }, [novaDataBloqueio]);

  async function removerBloqueio(dataKey) {
    try {
      await deleteDoc(doc(db, "bloqueios", dataKey));
    } catch (err) {
      alert("Não foi possível remover o bloqueio. Tente novamente.");
    }
  }

  async function excluirAgendamento(item) {
    if (!window.confirm(`Excluir o agendamento de ${item.nome || "cliente sem nome"} permanentemente?`)) return;
    try {
      await deleteDoc(doc(db, "agendamentos", item.id));
    } catch (err) {
      alert("Não foi possível excluir. Tente novamente.");
    }
  }

  async function setStatus(item, novoStatus) {
    try {
      await updateDoc(doc(db, "agendamentos", item.id), { status: novoStatus });
    } catch (err) {
      alert("Não foi possível atualizar o status. Tente novamente.");
    }
  }

  const contagemPorCliente = useMemo(() => {
    const map = {};
    agendamentos.forEach((a) => {
      const key = (a.email || a.telefone || "").toLowerCase();
      if (!key) return;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [agendamentos]);

  const servicoMaisPedido = useMemo(() => {
    const contagem = {};
    agendamentos.forEach((a) => {
      if (!a.servicoNome) return;
      contagem[a.servicoNome] = (contagem[a.servicoNome] || 0) + 1;
    });
    const entries = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || "—";
  }, [agendamentos]);

  const clientesRecorrentes = useMemo(
    () => Object.values(contagemPorCliente).filter((n) => n > 1).length,
    [contagemPorCliente]
  );
  const totalClientesUnicos = useMemo(() => Object.keys(contagemPorCliente).length, [contagemPorCliente]);
  const clientesNovos = totalClientesUnicos - clientesRecorrentes;

  // Lembrete de manutenção: 15 dias após a 1ª sessão concluída,
  // depois a cada 30 dias contados a partir da última sessão.
  const lembretes = useMemo(() => {
    const porCliente = {};
    agendamentos
      .filter((a) => a.status === "confirmado" && a.dataKey)
      .forEach((a) => {
        const key = clientKey(a);
        if (!key) return;
        if (!porCliente[key]) porCliente[key] = [];
        porCliente[key].push(a);
      });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return Object.values(porCliente)
      .map((sessoes) => {
        const ordenadas = [...sessoes].sort((a, b) => a.dataKey.localeCompare(b.dataKey));
        const ultima = ordenadas[ordenadas.length - 1];
        const [ano, mes, dia] = ultima.dataKey.split("-").map(Number);
        const dataUltima = new Date(ano, mes - 1, dia);
        const intervaloDias = ordenadas.length === 1 ? 15 : 30;
        const proxima = new Date(dataUltima);
        proxima.setDate(proxima.getDate() + intervaloDias);
        const diasRestantes = Math.round((proxima - hoje) / (1000 * 60 * 60 * 24));
        return { ...ultima, dataUltimaSessao: dataUltima, proximaManutencao: proxima, diasRestantes, totalSessoes: ordenadas.length };
      })
      .filter((l) => l.diasRestantes <= 5) // mostra vencidos e os próximos 5 dias
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [agendamentos]);

  const mediaAvaliacao = useMemo(() => {
    const notas = Object.values(avaliacoes).map((v) => v.nota).filter((n) => typeof n === "number");
    if (notas.length === 0) return null;
    return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
  }, [avaliacoes]);

  // ------------------------------------------------------------------
  // Relatório
  // ------------------------------------------------------------------
  const [periodoRelatorio, setPeriodoRelatorio] = useState("mes");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const naoCancelados = useMemo(() => agendamentos.filter((a) => a.status !== "cancelado"), [agendamentos]);

  const noPeriodoAtual = useMemo(
    () => naoCancelados.filter((a) => noPeriodo(a.dataKey, periodoRelatorio, customStart, customEnd)),
    [naoCancelados, periodoRelatorio, customStart, customEnd]
  );

  const noPeriodoAnteriorLista = useMemo(
    () => naoCancelados.filter((a) => noPeriodoAnterior(a.dataKey, periodoRelatorio, customStart, customEnd)),
    [naoCancelados, periodoRelatorio, customStart, customEnd]
  );

  const faturamentoTotal = useMemo(
    () => noPeriodoAtual.filter((a) => a.status === "confirmado").reduce((soma, a) => soma + (a.preco || 0), 0),
    [noPeriodoAtual]
  );

  const faturamentoAnterior = useMemo(
    () => noPeriodoAnteriorLista.filter((a) => a.status === "confirmado").reduce((soma, a) => soma + (a.preco || 0), 0),
    [noPeriodoAnteriorLista]
  );

  const ticketMedioAtual = useMemo(() => {
    const confirmadosAtual = noPeriodoAtual.filter((a) => a.status === "confirmado");
    return confirmadosAtual.length ? faturamentoTotal / confirmadosAtual.length : 0;
  }, [noPeriodoAtual, faturamentoTotal]);

  const ticketMedioAnterior = useMemo(() => {
    const confirmadosAnterior = noPeriodoAnteriorLista.filter((a) => a.status === "confirmado");
    return confirmadosAnterior.length ? faturamentoAnterior / confirmadosAnterior.length : 0;
  }, [noPeriodoAnteriorLista, faturamentoAnterior]);

  const faturamentoPorServico = useMemo(() => {
    const mapa = {};
    noPeriodoAtual.filter((a) => a.status === "confirmado").forEach((a) => {
      const nome = a.servicoNome || "Outro";
      mapa[nome] = (mapa[nome] || 0) + (a.preco || 0);
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [noPeriodoAtual]);

  // Ranking de serviços mais vendidos (por quantidade, não faturamento)
  const servicosMaisVendidos = useMemo(() => {
    const contagem = {};
    noPeriodoAtual.forEach((a) => {
      const nome = a.servicoNome || "Outro";
      if (!contagem[nome]) {
        contagem[nome] = { qtd: 0, isPacote: a.servicoId === "pacote" };
      }
      contagem[nome].qtd += 1;
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1].qtd - a[1].qtd)
      .map(([nome, info]) => ({ nome, qtd: info.qtd, isPacote: info.isPacote }));
  }, [noPeriodoAtual]);

  const atendimentosPorDiaSemana = useMemo(() => {
    const contagem = [0, 0, 0, 0, 0, 0, 0];
    noPeriodoAtual.forEach((a) => {
      if (!a.dataKey) return;
      const [ano, mes, dia] = a.dataKey.split("-").map(Number);
      contagem[new Date(ano, mes - 1, dia).getDay()]++;
    });
    return DIAS_SEMANA.map((label, i) => ({ label, valor: contagem[i] }));
  }, [noPeriodoAtual]);

  const atendimentosPorHorario = useMemo(() => {
    const mapa = {};
    noPeriodoAtual.forEach((a) => {
      if (!a.horario) return;
      mapa[a.horario] = (mapa[a.horario] || 0) + 1;
    });
    return Object.entries(mapa).sort((a, b) => a[0].localeCompare(b[0])).map(([label, valor]) => ({ label, valor }));
  }, [noPeriodoAtual]);

  const taxaCancelamento = useMemo(() => {
    const totalPeriodo = agendamentos.filter((a) => noPeriodo(a.dataKey, periodoRelatorio, customStart, customEnd));
    if (totalPeriodo.length === 0) return 0;
    const cancelados = totalPeriodo.filter((a) => a.status === "cancelado").length;
    return Math.round((cancelados / totalPeriodo.length) * 100);
  }, [agendamentos, periodoRelatorio, customStart, customEnd]);

  const taxaCancelamentoAnterior = useMemo(() => {
    const totalAnterior = agendamentos.filter((a) => noPeriodoAnterior(a.dataKey, periodoRelatorio, customStart, customEnd));
    if (totalAnterior.length === 0) return 0;
    const cancelados = totalAnterior.filter((a) => a.status === "cancelado").length;
    return Math.round((cancelados / totalAnterior.length) * 100);
  }, [agendamentos, periodoRelatorio, customStart, customEnd]);

  const taxaComparecimento = useMemo(() => {
    if (noPeriodoAtual.length === 0) return 0;
    const compareceram = noPeriodoAtual.filter((a) => a.status === "confirmado" || a.status === "presenca_confirmada").length;
    return Math.round((compareceram / noPeriodoAtual.length) * 100);
  }, [noPeriodoAtual]);

  const taxaComparecimentoAnterior = useMemo(() => {
    if (noPeriodoAnteriorLista.length === 0) return 0;
    const compareceram = noPeriodoAnteriorLista.filter((a) => a.status === "confirmado" || a.status === "presenca_confirmada").length;
    return Math.round((compareceram / noPeriodoAnteriorLista.length) * 100);
  }, [noPeriodoAnteriorLista]);

  const taxaRetornoManutencao = useMemo(() => {
    const porCliente = {};
    agendamentos.filter((a) => a.status !== "cancelado").forEach((a) => {
      const key = clientKey(a);
      if (!key) return;
      if (!porCliente[key]) porCliente[key] = new Set();
      porCliente[key].add(a.servicoId);
    });
    const comSessao = Object.values(porCliente).filter((s) => s.has("sessao"));
    if (comSessao.length === 0) return { taxa: 0, total: 0, retornaram: 0 };
    const comManutencao = comSessao.filter((s) => s.has("manutencao"));
    return { taxa: Math.round((comManutencao.length / comSessao.length) * 100), total: comSessao.length, retornaram: comManutencao.length };
  }, [agendamentos]);

  const notaMediaEsteMes = useMemo(() => {
    const hoje = new Date();
    const notas = Object.values(avaliacoes)
      .filter((v) => {
        if (!v.criadoEm?.seconds) return false;
        const d = new Date(v.criadoEm.seconds * 1000);
        return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
      })
      .map((v) => v.nota)
      .filter((n) => typeof n === "number");
    if (notas.length === 0) return null;
    return { media: (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1), total: notas.length };
  }, [avaliacoes]);

  const filtrados = useMemo(() => {
    return agendamentos.filter((a) => {
      const buscaLower = busca.trim().toLowerCase();
      const bateBusca =
        !buscaLower ||
        (a.nome || "").toLowerCase().includes(buscaLower) ||
        (a.telefone || "").toLowerCase().includes(buscaLower) ||
        (a.email || "").toLowerCase().includes(buscaLower);
      const bateData = !dataFiltro || a.dataKey === dataFiltro;
      return bateBusca && bateData;
    });
  }, [agendamentos, busca, dataFiltro]);

  if (loading) return <div className="page" />;

  if (!user) {
    return (
      <div className="page">
        <div className="frame">
          <div className="body stepCenter">
            <h1 className="h1">Painel administrativo</h1>
            <p className="pMuted">Entre com a conta autorizada para ver os agendamentos.</p>
            <button className="googleBtn" onClick={login}>
              <Chrome size={18} />
              Continuar com Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="frame">
          <div className="body stepCenter">
            <h1 className="h1">Acesso restrito</h1>
            <p className="pMuted">Essa conta ({user.email}) não tem permissão para ver o painel.</p>
          </div>
        </div>
      </div>
    );
  }

  const pendentes = filtrados.filter((a) => a.status !== "confirmado" && a.status !== "cancelado");
  const confirmados = filtrados.filter((a) => a.status === "confirmado");
  const cancelados = filtrados.filter((a) => a.status === "cancelado");

  return (
    <div className="page">
      <div className="adminFrame">
        <div className="adminHeader">
          <div className="adminBrand">Painel — Carol Sampaio</div>

          <div className="adminStats">
            <div className="adminStat">
              <span className="adminStatNumber">{agendamentos.length}</span>
              <span className="adminStatLabel">Atendimentos</span>
            </div>
            <div className="adminStat">
              <span className="adminStatNumber">{agendamentos.filter((a) => a.status !== "confirmado" && a.status !== "cancelado").length}</span>
              <span className="adminStatLabel">Pendentes</span>
            </div>
            <div className="adminStat">
              <span className="adminStatNumber">{agendamentos.filter((a) => a.status === "confirmado").length}</span>
              <span className="adminStatLabel">Concluídos</span>
            </div>
          </div>

          <div className="adminMetrics">
            <div className="adminMetric">
              <TrendingUp size={13} />
              <span>Mais pedido: <strong>{servicoMaisPedido}</strong></span>
            </div>
            <div className="adminMetric">
              <Users size={13} />
              <span><strong>{clientesRecorrentes}</strong> clientes recorrentes</span>
            </div>
            {mediaAvaliacao && (
              <div className="adminMetric">
                <Star size={13} />
                <span><strong>{mediaAvaliacao}</strong> ({Object.keys(avaliacoes).length} avaliações)</span>
              </div>
            )}
          </div>
        </div>

        <div className="adminTabBar">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className="adminTabItem"
                style={{ color: active ? "#E8CE85" : "#6B6459" }}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                <span className="tabLabel">{tab.label}</span>
                {active && <span className="tabUnderline" />}
              </button>
            );
          })}
        </div>

        {(activeTab === "andamento" || activeTab === "cancelamento") && (
          <div className="adminFilters adminFiltersInline">
            <div className="adminSearchBox">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou e-mail"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="adminSearchInput"
              />
            </div>
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="adminDateInput"
            />
            {(busca || dataFiltro) && (
              <button className="adminClearBtn" onClick={() => { setBusca(""); setDataFiltro(""); }}>
                Limpar
              </button>
            )}
          </div>
        )}

        {activeTab === "andamento" && (
          <>
            <AdminSection
              title="Pendentes" icon={<Clock size={14} />} items={pendentes}
              contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus} onDelete={excluirAgendamento}
            />
            <AdminSection
              title="Concluídos" icon={<CheckCircle2 size={14} />} items={confirmados}
              contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus} onDelete={excluirAgendamento}
            />
          </>
        )}

        {activeTab === "lembretes" && (
          <div className="adminSection">
            <div className="adminSectionTitle"><Bell size={14} />Manutenções para lembrar ({lembretes.length})</div>
            <p className="pMutedSmall" style={{ marginBottom: 12 }}>
              1ª manutenção 15 dias após a sessão · demais a cada 30 dias
            </p>
            {lembretes.length === 0 ? (
              <p className="pMutedSmall">Nenhuma manutenção prevista pros próximos dias.</p>
            ) : (
              lembretes.map((l) => {
                const atrasado = l.diasRestantes < 0;
                const hoje = l.diasRestantes === 0;
                const textoData = l.proximaManutencao.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
                const whatsappLembrete = l.telefone
                  ? `https://wa.me/${l.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Oi ${l.nome || ""}! Passando pra lembrar que já está na hora da sua manutenção de bronze 🌞 Bora agendar?`
                    )}`
                  : null;
                return (
                  <div key={l.id} className="adminCard">
                    <div className="adminCardMain">
                      <div className="adminCardName">{l.nome || "Sem nome"}</div>
                      <div className="adminCardMeta"><Phone size={12} /> {l.telefone || "—"}</div>
                      <div className="adminCardMeta">
                        <Calendar size={12} /> Última sessão: {l.dataUltimaSessao.toLocaleDateString("pt-BR")} ({l.totalSessoes}ª sessão)
                      </div>
                      <div className="adminCardRating" style={{ color: atrasado ? "#E07856" : hoje ? "#E8CE85" : "#6FCF97" }}>
                        {atrasado
                          ? `Atrasado ${Math.abs(l.diasRestantes)} dia(s) — previsto ${textoData}`
                          : hoje
                          ? `Manutenção hoje!`
                          : `Em ${l.diasRestantes} dia(s) — ${textoData}`}
                      </div>
                    </div>
                    {whatsappLembrete && (
                      <div className="adminCardActions">
                        <a className="adminReviewBtn" href={whatsappLembrete} target="_blank" rel="noreferrer">
                          <MessageCircle size={12} /> Enviar lembrete
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "cancelamento" && (
          <AdminSection
            title="Cancelados" icon={<XCircle size={14} />} items={cancelados}
            contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus} onDelete={excluirAgendamento}
          />
        )}

        {activeTab === "bloqueio" && (
          <div className="adminSection">
            <div className="blockForm">
              <input
                type="date"
                value={novaDataBloqueio}
                onChange={(e) => setNovaDataBloqueio(e.target.value)}
                className="adminDateInput"
              />
              <input
                type="text"
                placeholder="Motivo (opcional)"
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                className="adminSearchInput blockReasonInput"
              />
            </div>

            {novaDataBloqueio && (
              <>
                <label className="anonCheckbox" style={{ marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={diaTodoBloqueio}
                    onChange={(e) => { setDiaTodoBloqueio(e.target.checked); setHorariosBloqueio([]); }}
                  />
                  Bloquear o dia inteiro
                </label>

                {!diaTodoBloqueio && (
                  <div className="slotsGrid" style={{ marginBottom: 14 }}>
                    {slotsDoDiaBloqueio.map((h) => {
                      const active = horariosBloqueio.includes(h);
                      return (
                        <button
                          key={h}
                          className="slotBtn"
                          onClick={() => toggleHorarioBloqueio(h)}
                          style={{ borderColor: active ? "#E8CE85" : "#2A241A", background: active ? "#C9A24B" : "#151109", color: active ? "#0B0A09" : "#F3ECDD" }}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <button className="adminToggleBtn" onClick={adicionarBloqueio} disabled={!novaDataBloqueio} style={{ marginBottom: 16 }}>
              Bloquear
            </button>

            {bloqueios.length === 0 ? (
              <p className="pMutedSmall">Nenhuma data bloqueada.</p>
            ) : (
              <div className="blockList">
                {bloqueios.map((b) => (
                  <div key={b.data} className="blockItem">
                    <span className="blockItemDate">
                      {new Date(b.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <span className="blockItemReason">
                      {b.diaTodo ? "Dia inteiro" : (b.horarios || []).join(", ")}
                      {b.motivo && ` · ${b.motivo}`}
                    </span>
                    <button className="blockRemoveBtn" onClick={() => removerBloqueio(b.data)} aria-label="Remover bloqueio">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "avaliacao" && (
          <div className="adminSection">
            {Object.keys(avaliacoes).length === 0 ? (
              <p className="pMutedSmall">Ainda não há avaliações.</p>
            ) : (
              Object.entries(avaliacoes)
                .sort((a, b) => (b[1].criadoEm?.seconds || 0) - (a[1].criadoEm?.seconds || 0))
                .map(([id, av]) => <ReviewCard key={id} item={av} />)
            )}
          </div>
        )}

        {activeTab === "relatorio" && (
          <div className="adminSection">
            <div className="reportPeriodTabs">
              {[
                { id: "mes", label: "Este mês" },
                { id: "30dias", label: "Últimos 30 dias" },
                { id: "tudo", label: "Tudo" },
                { id: "custom", label: "Personalizado" },
              ].map((p) => (
                <button
                  key={p.id}
                  className="reportPeriodBtn"
                  style={{ background: periodoRelatorio === p.id ? "#C9A24B" : "transparent", color: periodoRelatorio === p.id ? "#0B0A09" : "#9C9384" }}
                  onClick={() => setPeriodoRelatorio(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {periodoRelatorio === "custom" && (
              <div className="reportDateRange">
                <div className="reportDateField">
                  <label className="reportDateLabel">De</label>
                  <input
                    type="date"
                    className="reportDateInput"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <span className="reportDateSeparator">até</span>
                <div className="reportDateField">
                  <label className="reportDateLabel">Até</label>
                  <input
                    type="date"
                    className="reportDateInput"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="reportStatsGrid">
              <ReportStatCard
                title="Faturamento do período"
                value={formatPreco(faturamentoTotal)}
                delta={calcDelta(faturamentoTotal, faturamentoAnterior)}
              />
              <ReportStatCard
                title="Ticket médio"
                value={formatPreco(ticketMedioAtual)}
                delta={calcDelta(ticketMedioAtual, ticketMedioAnterior)}
              />
              <ReportStatCard
                title="Taxa de comparecimento"
                value={`${taxaComparecimento}%`}
                delta={calcDelta(taxaComparecimento, taxaComparecimentoAnterior)}
              />
              <ReportStatCard
                title="Taxa de cancelamento"
                value={`${taxaCancelamento}%`}
                delta={calcDelta(taxaCancelamento, taxaCancelamentoAnterior)}
              />
            </div>

            <div className="reportCard">
              <div className="reportCardTitle">Serviços mais vendidos</div>
              {servicosMaisVendidos.length === 0 ? (
                <p className="pMutedSmall">Sem dados nesse período.</p>
              ) : (
                <div className="topServicesList">
                  {servicosMaisVendidos.map((s, i) => (
                    <div key={s.nome} className="topServiceRow">
                      <div className="topServiceLeft">
                        <span className="topServiceRank">{i + 1}º</span>
                        <span className="topServiceName">{s.nome}</span>
                      </div>
                      <span className="topServiceCount">
                        {s.qtd} {formatUnidade(s.qtd, s.isPacote)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="reportCard">
              <div className="reportCardTitle">Faturamento por serviço</div>
              <p className="pMutedSmall" style={{ marginBottom: 10 }}>Somente atendimentos concluídos</p>
              {faturamentoPorServico.map(([nome, valor]) => (
                <BarRow key={nome} label={nome} value={valor} max={faturamentoTotal || 1} formatValue={formatPreco} />
              ))}
            </div>

            <div className="reportCard">
              <div className="reportCardTitle">Atendimentos por dia da semana</div>
              {atendimentosPorDiaSemana.map((d) => (
                <BarRow key={d.label} label={d.label} value={d.valor} max={Math.max(...atendimentosPorDiaSemana.map((x) => x.valor), 1)} />
              ))}
            </div>

            <div className="reportCard">
              <div className="reportCardTitle">Horários mais pedidos</div>
              {atendimentosPorHorario.length === 0 ? (
                <p className="pMutedSmall">Sem dados nesse período.</p>
              ) : (
                atendimentosPorHorario.map((h) => (
                  <BarRow key={h.label} label={h.label} value={h.valor} max={Math.max(...atendimentosPorHorario.map((x) => x.valor), 1)} />
                ))
              )}
            </div>

            <div className="reportStatsRow">
              <div className="reportStatBox">
                <span className="reportStatNumber">{clientesNovos}</span>
                <span className="adminStatLabel">Clientes novos</span>
              </div>
              <div className="reportStatBox">
                <span className="reportStatNumber">{clientesRecorrentes}</span>
                <span className="adminStatLabel">Recorrentes</span>
              </div>
            </div>

            <div className="reportCard">
              <div className="reportCardTitle">Retorno pra manutenção</div>
              {taxaRetornoManutencao.total > 0 ? (
                <>
                  <div className="reportBigNumber">{taxaRetornoManutencao.taxa}%</div>
                  <p className="pMutedSmall">
                    {taxaRetornoManutencao.retornaram} de {taxaRetornoManutencao.total} clientes que fizeram o Bronzeamento voltaram pra Manutenção
                  </p>
                </>
              ) : (
                <p className="pMutedSmall">Sem dados suficientes ainda.</p>
              )}
            </div>

            <div className="reportStatsRow">
              <div className="reportStatBox">
                <span className="reportStatNumber">{notaMediaEsteMes ? notaMediaEsteMes.media : "—"}</span>
                <span className="adminStatLabel">Nota este mês {notaMediaEsteMes ? `(${notaMediaEsteMes.total})` : ""}</span>
              </div>
              <div className="reportStatBox">
                <span className="reportStatNumber">{mediaAvaliacao || "—"}</span>
                <span className="adminStatLabel">Nota geral</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatUnidade(qtd, isPacote) {
  if (isPacote) return qtd > 1 ? "pacotes" : "pacote";
  return qtd > 1 ? "sessões" : "sessão";
}

function ReportStatCard({ title, value, delta }) {
  const isPositive = delta != null && delta >= 0;
  return (
    <div className="reportStatCard">
      <div className="reportStatCardTitle">{title}</div>
      <div className="reportStatCardValue">{value}</div>
      {delta != null && (
        <div className={`reportStatCardDelta ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(delta)}% vs. período anterior
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, max, formatValue }) {
  const pct = Math.max(4, Math.round((value / max) * 100));
  return (
    <div className="barRow">
      <div className="barRowTop">
        <span className="barRowLabel">{label}</span>
        <span className="barRowValue">{formatValue ? formatValue(value) : value}</span>
      </div>
      <div className="barRowTrack">
        <div className="barRowFill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AdminSection({ title, icon, items, contagemPorCliente, avaliacoes, onSetStatus, onDelete }) {
  return (
    <div className="adminSection">
      <div className="adminSectionTitle">{icon}{title} ({items.length})</div>
      {items.length === 0 && <p className="pMutedSmall">Nada por aqui.</p>}
      {items.map((item) => {
        const visitas = contagemPorCliente[clientKey(item)] || 1;
        const avaliacao = avaliacoes[item.id];
        const linkAvaliacao = `${window.location.origin}/avaliar?id=${item.id}&nome=${encodeURIComponent(item.nome || "")}&servico=${encodeURIComponent(item.servicoNome || "")}`;
        const whatsappAvaliacao = item.telefone
          ? `https://wa.me/${item.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Oi ${item.nome || ""}! Poderia avaliar seu atendimento? ${linkAvaliacao}`
            )}`
          : null;

        return (
          <div key={item.id} className="adminCard">
            <div className="adminCardMain">
              <div className="adminCardName">
                {item.nome || "Sem nome"}
                {visitas > 1 && <span className="adminVisitTag">{visitas}ª vez</span>}
                {item.status === "presenca_confirmada" && <span className="adminVisitTag" style={{ background: "#1F3A2A", color: "#6FCF97" }}>Presença confirmada</span>}
              </div>
              <div className="adminCardMeta"><Mail size={12} /> {item.email || "—"}</div>
              <div className="adminCardMeta"><Phone size={12} /> {item.telefone || "—"}</div>
              <div className="adminCardMeta"><Calendar size={12} /> {item.servicoNome} · {item.dataLabel} · {item.horario}</div>
              {item.preco != null && <div className="adminCardMeta">{item.preco > 0 ? formatPreco(item.preco) : "Incluso no pacote"}</div>}
              {avaliacao && (
                <div className="adminCardRating">
                  {"★".repeat(avaliacao.nota)}{"☆".repeat(5 - avaliacao.nota)}
                  {avaliacao.comentario && <span className="adminCardComment">"{avaliacao.comentario}"</span>}
                </div>
              )}
            </div>
            <div className="adminCardActions">
              {item.status !== "confirmado" && (
                <button className="adminToggleBtn" onClick={() => onSetStatus(item, "confirmado")}>
                  Concluído
                </button>
              )}
              {item.status !== "cancelado" && (
                <button className="adminCancelBtn" onClick={() => onSetStatus(item, "cancelado")}>
                  Cancelar
                </button>
              )}
              {item.status !== "pendente" && (
                <button className="adminReopenBtn" onClick={() => onSetStatus(item, "pendente")}>
                  Reabrir
                </button>
              )}
              {item.status === "confirmado" && !avaliacao && whatsappAvaliacao && (
                <a className="adminReviewBtn" href={whatsappAvaliacao} target="_blank" rel="noreferrer">
                  <MessageCircle size={12} /> Pedir avaliação
                </a>
              )}
              {item.status === "cancelado" && (
                <button className="adminDeleteBtn" onClick={() => onDelete(item)}>
                  <Trash2 size={12} /> Excluir
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
