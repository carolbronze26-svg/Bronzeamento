import React, { useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Star, Check } from "lucide-react";
import { db } from "./firebase";
import "./styles.css";

export default function AvaliarPage() {
  const params = new URLSearchParams(window.location.search);
  const agendamentoId = params.get("id");
  const nomeCliente = params.get("nome") || "";
  const servico = params.get("servico") || "";

  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [status, setStatus] = useState("form"); // form | sending | done | error

  if (!agendamentoId) {
    return (
      <div className="page">
        <div className="frame">
          <div className="body stepCenter">
            <h1 className="h1">Link inválido</h1>
            <p className="pMuted">Não encontramos o agendamento para essa avaliação.</p>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    if (nota === 0) return;
    setStatus("sending");
    try {
      const ref = doc(db, "avaliacoes", agendamentoId);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        setStatus("done");
        return;
      }
      await setDoc(ref, {
        agendamentoId,
        nome: nomeCliente,
        servico,
        nota,
        comentario: comentario.trim(),
        criadoEm: serverTimestamp(),
      });
      setStatus("done");
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="page">
        <div className="frame">
          <div className="body stepCenter">
            <div className="checkCircle"><Check size={22} color="#0B0A09" strokeWidth={3} /></div>
            <h1 className="h1">Obrigada!</h1>
            <p className="pMuted">Sua avaliação foi enviada. A Carol agradece o carinho 💛</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="frame">
        <div className="body stepCenter">
          <img src="/logo-carol-sampaio.png" alt="Carol Sampaio" className="loginLogo" />
          <h1 className="h1">Como foi seu atendimento?</h1>
          <p className="pMuted">
            {servico ? `${servico} — sua opinião ajuda a Carol a melhorar cada vez mais.` : "Sua opinião ajuda a Carol a melhorar cada vez mais."}
          </p>

          <div className="starRow">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className="starBtn"
                onMouseEnter={() => setHoverNota(n)}
                onMouseLeave={() => setHoverNota(0)}
                onClick={() => setNota(n)}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              >
                <Star
                  size={32}
                  fill={(hoverNota || nota) >= n ? "#E8CE85" : "none"}
                  color="#E8CE85"
                />
              </button>
            ))}
          </div>

          <textarea
            className="reviewTextarea"
            placeholder="Quer deixar um comentário? (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
          />

          {status === "error" && (
            <p className="loginError">Não foi possível enviar. Tente novamente.</p>
          )}

          <button
            className="primaryBtn"
            style={{ width: "100%", opacity: nota === 0 || status === "sending" ? 0.4 : 1 }}
            disabled={nota === 0 || status === "sending"}
            onClick={handleSubmit}
          >
            {status === "sending" ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}
