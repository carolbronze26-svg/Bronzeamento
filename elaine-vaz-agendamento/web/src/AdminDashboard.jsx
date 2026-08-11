import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import {
  Chrome, Clock, CheckCircle2, XCircle, Phone, Mail, Calendar,
  Search, Star, TrendingUp, Users, MessageCircle,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import "./styles.css";

// E-mails autorizados a ver o painel administrativo.
const ADMIN_EMAILS = ["carol.bronze26@gmail.com"];

export default function AdminDashboard() {
  const { user, loading, login } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
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

        <AdminSection
          title="Pendentes" icon={<Clock size={14} />} items={pendentes}
          contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus}
        />
        <AdminSection
          title="Concluídos" icon={<CheckCircle2 size={14} />} items={confirmados}
          contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus}
        />
        <AdminSection
          title="Cancelados" icon={<XCircle size={14} />} items={cancelados}
          contagemPorCliente={contagemPorCliente} avaliacoes={avaliacoes} onSetStatus={setStatus}
        />
      </div>
    </div>
  );
}

function clientKey(item) {
  return (item.email || item.telefone || "").toLowerCase();
}

function AdminSection({ title, icon, items, contagemPorCliente, avaliacoes, onSetStatus }) {
  return (
    <div className="adminSection">
      <div className="adminSectionTitle">{icon}{title} ({items.length})</div>
      {items.length === 0 && <p className="pMutedSmall">Nada por aqui.</p>}
      {items.map((item) => {
        const visitas = contagemPorCliente[clientKey(item)] || 1;
        const avaliacao = avaliacoes[item.id];
        const linkAvaliacao = `${window.location.origin}/avaliar?id=${item.id}`;
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
