import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import {
  Chrome, Clock, CheckCircle2, XCircle, Phone, Mail, Calendar,
  Search, Star, TrendingUp, Users, MessageCircle, CalendarOff, Trash2,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import { ReviewCard } from "./ReviewsPage.jsx";
import "./styles.css";

// E-mails autorizados a ver o painel administrativo.
const ADMIN_EMAILS = ["carol.bronze26@gmail.com"];

export default function AdminDashboard() {
  const { user, loading, login } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [bloqueios, setBloqueios] = useState([]);
  const [novaDataBloqueio, setNovaDataBloqueio] = useState("");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
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
    try {
      await setDoc(doc(db, "bloqueios", novaDataBloqueio), {
        motivo: motivoBloqueio.trim(),
        criadoEm: serverTimestamp(),
      });
      setNovaDataBloqueio("");
      setMotivoBloqueio("");
    } catch (err) {
      alert("Não foi possível bloquear essa data. Tente novamente.");
    }
  }

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

  // conta quantas vezes cada cliente (por e-mail) já agendou, no total
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

  const mediaAvaliacao = useMemo(() => {
    const notas = Object.values(avaliacoes).map((v) => v.nota).filter((n) => typeof n === "number");
    if (notas.length === 0) return null;
    return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
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

          <div className="adminFilters">
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
        </div>

        <div className="adminSection">
          <div className="adminSectionTitle"><CalendarOff size={14} />Datas bloqueadas</div>
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
            <button className="adminToggleBtn" onClick={adicionarBloqueio} disabled={!novaDataBloqueio}>
              Bloquear
            </button>
          </div>
          {bloqueios.length === 0 ? (
            <p className="pMutedSmall">Nenhuma data bloqueada.</p>
          ) : (
            <div className="blockList">
              {bloqueios.map((b) => (
                <div key={b.data} className="blockItem">
                  <span className="blockItemDate">
                    {new Date(b.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                  {b.motivo && <span className="blockItemReason">{b.motivo}</span>}
                  <button className="blockRemoveBtn" onClick={() => removerBloqueio(b.data)} aria-label="Remover bloqueio">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdminSection
          title="Pendentes" icon={<Clock size={14} />} items={pendentes}
          contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus} onDelete={excluirAgendamento}
        />
        <AdminSection
          title="Concluídos" icon={<CheckCircle2 size={14} />} items={confirmados}
          contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus} onDelete={excluirAgendamento}
        />
        <AdminSection
          title="Cancelados" icon={<XCircle size={14} />} items={cancelados}
          contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus} onDelete={excluirAgendamento}
        />

        <div className="adminSection">
          <div className="adminSectionTitle"><Star size={14} />Avaliações ({Object.keys(avaliacoes).length})</div>
          {Object.keys(avaliacoes).length === 0 ? (
            <p className="pMutedSmall">Ainda não há avaliações.</p>
          ) : (
            Object.entries(avaliacoes)
              .sort((a, b) => (b[1].criadoEm?.seconds || 0) - (a[1].criadoEm?.seconds || 0))
              .map(([id, av]) => <ReviewCard key={id} item={av} />)
          )}
        </div>
      </div>
    </div>
  );
}

function clientKey(item) {
  return (item.email || item.telefone || "").toLowerCase();
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
              </div>
              <div className="adminCardMeta"><Mail size={12} /> {item.email || "—"}</div>
              <div className="adminCardMeta"><Phone size={12} /> {item.telefone || "—"}</div>
              <div className="adminCardMeta"><Calendar size={12} /> {item.servicoNome} · {item.dataLabel} · {item.horario}</div>
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
