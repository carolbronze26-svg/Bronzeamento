// src/AmigaPopup.jsx
import { useState } from "react";

export default function AmigaPopup({ onConfirm, onClose }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const podeConfirmar = nome.trim().length > 1 && telefone.replace(/\D/g, "").length >= 10;

  return (
    <div className="promoOverlay" onClick={onClose}>
      <div className="promoBox" onClick={(e) => e.stopPropagation()} style={{ padding: 20 }}>
        <button className="promoCloseBtn" onClick={onClose}>✕</button>
        <h2 className="h2" style={{ marginBottom: 6 }}>Dados da amiga</h2>
        <p className="pMutedSmall" style={{ marginBottom: 16 }}>
          Essa promoção é para você e uma amiga. Informe os dados dela abaixo.
        </p>

        <div className="phoneWrap">
          <label className="phoneLabel">Nome da amiga</label>
          <input
            type="text"
            className="phoneInput"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="phoneWrap" style={{ marginTop: 12 }}>
          <label className="phoneLabel">WhatsApp da amiga</label>
          <input
            type="tel"
            className="phoneInput"
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>

        <button
          className="primaryBtn"
          style={{ marginTop: 20, width: "100%", opacity: podeConfirmar ? 1 : 0.4, pointerEvents: podeConfirmar ? "auto" : "none" }}
          onClick={() => onConfirm({ nome, telefone })}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
