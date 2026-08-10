import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Chrome, Clock, CheckCircle2, Phone, Mail, Calendar } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import "./styles.css";

// E-mails autorizados a ver o painel administrativo.
const ADMIN_EMAILS = ["carol.bronze26@gmail.com"];

export default function AdminDashboard() {
  const { user, loading, login } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "agendamentos"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAgendamentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [isAdmin]);

  async function toggleStatus(item) {
    const novoStatus = item.status === "confirmado" ? "pendente" : "confirmado";
    try {
      await updateDoc(doc(db, "agendamentos", item.id), { status: novoStatus });
    } catch (err) {
      alert("Não foi possível atualizar o status. Tente novamente.");
    }
  }

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

  const pendentes = agendamentos.filter((a) => a.status !== "confirmado");
  const confirmados = agendamentos.filter((a) => a.status === "confirmado");

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
              <span className="adminStatNumber">{pendentes.length}</span>
              <span className="adminStatLabel">Pendentes</span>
            </div>
            <div className="adminStat">
              <span className="adminStatNumber">{confirmados.length}</span>
              <span className="adminStatLabel">Concluídos</span>
            </div>
          </div>
        </div>

        <AdminSection title="Pendentes" icon={<Clock size={14} />} items={pendentes} onToggle={toggleStatus} />
        <AdminSection title="Concluídos" icon={<CheckCircle2 size={14} />} items={confirmados} onToggle={toggleStatus} />
      </div>
    </div>
  );
}

function AdminSection({ title, icon, items, onToggle }) {
  return (
    <div className="adminSection">
      <div className="adminSectionTitle">{icon}{title} ({items.length})</div>
      {items.length === 0 && <p className="pMutedSmall">Nada por aqui.</p>}
      {items.map((item) => (
        <div key={item.id} className="adminCard">
          <div className="adminCardMain">
            <div className="adminCardName">{item.nome || "Sem nome"}</div>
            <div className="adminCardMeta"><Mail size={12} /> {item.email || "—"}</div>
            <div className="adminCardMeta"><Phone size={12} /> {item.telefone || "—"}</div>
            <div className="adminCardMeta"><Calendar size={12} /> {item.servicoNome} · {item.dataLabel} · {item.horario}</div>
          </div>
          <button className="adminToggleBtn" onClick={() => onToggle(item)}>
            {item.status === "confirmado" ? "Marcar pendente" : "Marcar concluído"}
          </button>
        </div>
      ))}
    </div>
  );
}
