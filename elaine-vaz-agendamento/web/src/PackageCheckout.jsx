import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CreditCard, QrCode } from "lucide-react";
import { db } from "./firebase";
import { PACOTES } from "../../shared/services";
import "./styles.css";

const FUNCTIONS_URL = "https://SEU-PROJETO.cloudfunctions.net"; // ajuste com sua URL

export default function PackageCheckout({ user, onClose }) {
  const pacote = PACOTES[0];
  const [metodo, setMetodo] = useState("pix");
  const [status, setStatus] = useState("idle"); // idle | loading | pix | done | error
  const [pixData, setPixData] = useState(null);

  async function iniciarCompra() {
    setStatus("loading");
    try {
      const pacoteClienteId = `${user.uid}_${Date.now()}`;

      await setDoc(doc(db, "pacotesClientes", pacoteClienteId), {
        clienteId: user.uid,
        nome: user.displayName,
        email: user.email,
        pacoteId: pacote.id,
        sessoesRestantes: 0,
        status: "pendente",
        criadoEm: serverTimestamp(),
      });

      const res = await fetch(`${FUNCTIONS_URL}/criarPagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodo,
          valor: pacote.precoTotal,
          descricao: pacote.nome,
          email: user.email,
          tipo: "pacote",
          referenciaId: pacoteClienteId,
        }),
      });
      const data = await res.json();

      if (metodo === "pix") {
        setPixData(data);
        setStatus("pix");
      } else {
        setStatus(data.status === "approved" ? "done" : "error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <h2 className="h2">{pacote.nome}</h2>
        <p className="pMutedSmall">
          {pacote.qtdSessoes} sessões por <strong>R$ {pacote.precoTotal.toFixed(2)}</strong> (em vez de R$ {(pacote.precoUnitario * pacote.qtdSessoes).toFixed(2)})
        </p>

        {status === "idle" && (
          <>
            <div className="paymentMethodRow">
              <button className={`paymentMethodBtn ${metodo === "pix" ? "active" : ""}`} onClick={() => setMetodo("pix")}>
                <QrCode size={16} /> Pix
              </button>
              <button className={`paymentMethodBtn ${metodo === "credito" ? "active" : ""}`} onClick={() => setMetodo("credito")}>
                <CreditCard size={16} /> Crédito
              </button>
              <button className={`paymentMethodBtn ${metodo === "debito" ? "active" : ""}`} onClick={() => setMetodo("debito")}>
                <CreditCard size={16} /> Débito
              </button>
            </div>
            <button className="primaryBtn" style={{ width: "100%", marginTop: 16 }} onClick={iniciarCompra}>
              Pagar com {metodo === "pix" ? "Pix" : metodo === "credito" ? "Crédito" : "Débito"}
            </button>
          </>
        )}

        {status === "loading" && <p className="pMutedSmall">Gerando pagamento...</p>}

        {status === "pix" && pixData && (
          <div className="stepCenter">
            <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" style={{ width: 200, borderRadius: 12, marginTop: 12 }} />
            <p className="pMutedSmall" style={{ marginTop: 10 }}>Escaneie o QR Code ou copie o código abaixo:</p>
            <textarea className="reviewTextarea" readOnly value={pixData.qr_code} rows={3} />
          </div>
        )}

        {status === "done" && <p className="pMuted">Pagamento aprovado! Seu pacote já está disponível para agendar.</p>}
        {status === "error" && <p className="loginError">Não foi possível processar o pagamento. Tente novamente.</p>}

        <button className="backLink" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
