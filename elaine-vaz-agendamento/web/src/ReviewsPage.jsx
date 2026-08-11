import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Star } from "lucide-react";
import { db } from "./firebase";
import "./styles.css";

export default function ReviewsPage() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "avaliacoes"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAvaliacoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="page">
      <div className="frame">
        <div className="header">
          <div className="brandRow">
            <div className="monogram">CS</div>
            <div>
              <div className="brandName">Avaliações</div>
              <div className="brandSub">O que as clientes acham do atendimento</div>
            </div>
          </div>
        </div>
        <div className="body">
          {loading && <p className="pMutedSmall">Carregando...</p>}
          {!loading && avaliacoes.length === 0 && (
            <p className="pMutedSmall">Ainda não há avaliações por aqui.</p>
          )}
          {avaliacoes.map((a) => (
            <ReviewCard key={a.id} item={a} />
          ))}
          <a href="/" className="backLink" style={{ display: "block", marginTop: 8 }}>
            ← Voltar para o agendamento
          </a>
        </div>
      </div>
    </div>
  );
}

export function ReviewCard({ item }) {
  return (
    <div className="reviewCard">
      <div className="reviewCardStars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill={i < item.nota ? "#E8CE85" : "none"} color="#E8CE85" />
        ))}
      </div>
      {item.comentario && <p className="reviewCardComment">"{item.comentario}"</p>}
      <div className="reviewCardFooter">
        <span className="reviewCardName">{item.nome || "Cliente"}</span>
        {item.servico && <span className="reviewCardService">{item.servico}</span>}
      </div>
    </div>
  );
}
