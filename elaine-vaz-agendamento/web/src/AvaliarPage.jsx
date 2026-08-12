import React, { useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Star, Check, Paperclip, X } from "lucide-react";
import { db } from "./firebase";
import "./styles.css";

const CLOUDINARY_CLOUD_NAME = "yktfb3bt";
const CLOUDINARY_UPLOAD_PRESET = "avaliacoes_carol";
const MAX_FILE_SIZE_MB = 25;

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Falha no upload");
  const data = await res.json();
  return { url: data.secure_url, tipo: data.resource_type }; // "image" | "video"
}

export default function AvaliarPage() {
  const params = new URLSearchParams(window.location.search);
  const agendamentoId = params.get("id");
  const nomeCliente = params.get("nome") || "";
  const servico = params.get("servico") || "";

  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [anonimo, setAnonimo] = useState(false);
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

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Arquivo muito grande. O limite é ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setArquivo(file);
    setPreview(URL.createObjectURL(file));
  }

  function removerArquivo() {
    setArquivo(null);
    setPreview(null);
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

      let midiaUrl = null;
      let midiaTipo = null;
      if (arquivo) {
        const upload = await uploadToCloudinary(arquivo);
        midiaUrl = upload.url;
        midiaTipo = upload.tipo;
      }

      await setDoc(ref, {
        agendamentoId,
        nome: anonimo ? "Cliente anônimo" : nomeCliente,
        servico,
        nota,
        comentario: comentario.trim(),
        midiaUrl,
        midiaTipo,
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

          <label className="anonCheckbox">
            <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
            Avaliar de forma anônima
          </label>

          {!preview ? (
            <label className="attachBtn">
              <Paperclip size={15} />
              Anexar foto ou vídeo (opcional)
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} hidden />
            </label>
          ) : (
            <div className="attachPreview">
              {arquivo?.type.startsWith("video") ? (
                <video src={preview} className="attachPreviewMedia" muted controls />
              ) : (
                <img src={preview} alt="" className="attachPreviewMedia" />
              )}
              <button className="attachRemoveBtn" onClick={removerArquivo} aria-label="Remover anexo">
                <X size={14} />
              </button>
            </div>
          )}

          {status === "error" && (
            <p className="loginError">Sem conexão com o servidor. Verifique sua internet e tente novamente.</p>
          )}

          <button
            className="primaryBtn"
            style={{ width: "100%", marginTop: 18, opacity: nota === 0 || status === "sending" ? 0.4 : 1 }}
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
