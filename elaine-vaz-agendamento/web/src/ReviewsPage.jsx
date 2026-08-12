import React from "react";
import { Star } from "lucide-react";
import { useReviews } from "./hooks/useReviews";
import "./styles.css";

export default function ReviewsPage() {
  const { reviews, loading } = useReviews();

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
          {!loading && reviews.length === 0 && (
            <p className="pMutedSmall">Ainda não há avaliações por aqui.</p>
          )}
          {reviews.map((a) => (
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
