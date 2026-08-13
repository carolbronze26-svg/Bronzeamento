import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CreditCard, QrCode } from "lucide-react";
import { db } from "./firebase";
import "./styles.css";

const FUNCTIONS_URL = "https://SEU-PROJETO.cloudfunctions.net"; // ajuste com sua URL

// item: { tipo: "pacote" | "servico", id, nome, valor, qtdSessoes? }
export default function Checkout({ user, item, onClose }) {
  const [metodo, setMetodo] = useState("pix");
  const [status, setStatus] = useState("idle"); // idle | loading | pix | done | error
  const [pixData, setPixData] = useState(null);

  const isPacote = item.tipo === "pacote";

  async function iniciarCompra() {
    setStatus("loading");
    try {
      const referenciaId = `${user.uid}_${Date.now()}`;

      if (isPacote) {
        await setDoc(doc(db, "pacotesClientes", referenciaId), {
          clienteId: user.uid,
          nome: user.displayName,
          email: user.email,
          pacoteId: item.id,
          sessoesRestantes: 0,
          status: "pendente",
          criadoEm: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, "pagamentos", referenciaId), {
          clienteId: user.uid,
          nome: user.displayName,
          email: user.email,
          servicoId: item.id,
          servicoNome: item.nome,
          status: "pendente",
          criadoEm: serverTimestamp(),
        });
      }

      const res = await fetch(`${FUNCTIONS_URL}/criarPagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodo,
          valor: item.valor,
          descricao: item.nome,
          email: user.email,
          tipo: item.tipo,
          referenciaId,
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
        <h2 className="h2">{item.nome}</h2>
        {isPacote ? (
          <p className="pMutedSmall">
            {item.qtdSessoes} sessões por <strong>R$ {item.valor.toFixed(2)}</strong>
          </p>
        ) : (
          <p className="pMutedSmall">
            Valor: <strong>R$ {item.valor.toFixed(2)}</strong>
          </p>
        )}

        {status === "idle" && (
          <>
            <div className="paymentMethodRow">
              <button className={`paymentMethodBtn ${metodo === "pix" ? "active" : ""}`} onClick={() => setMetodo("pix")}>
                <QrCode size={16} /> Pix
              </button>
              <button className={`paymentMethodBtn ${metodo === "credito" ? "active" : ""}`} onClick={() => setMetodo("credito")}>
                <CreditCard size={16} /> Crédito
              </button>
              <button className={`paymentMethodBtn ${metodo === "debito" ? "active" : ""}`} onClick={() =>
