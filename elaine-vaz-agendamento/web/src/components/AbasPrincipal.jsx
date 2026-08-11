import React, { useState } from "react";
import Agendamento from "./Agendamento";

export default function AbasPrincipal() {
  const [activeTab, setActiveTab] = useState("entrar");

  const tabs = [
    { id: "entrar", label: "Entrar" },
    { id: "agendamento", label: "Agendamento" },
    { id: "avaliacao", label: "Avaliação" },
    { id: "rede-social", label: "Rede Social" },
    { id: "localizacao", label: "Localização" },
  ];

  return (
    <div className="tabsPage">
      <nav className="tabsBar" aria-label="Menu principal">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tabBtn ${activeTab === tab.id ? "tabBtnActive" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tabsContent">
        {activeTab === "entrar" && (
          <section className="tabPanel">
            <h2>Entrar</h2>
            <p>Login com a conta Google.</p>
            <button className="primaryBtn">Continuar com Google</button>
          </section>
        )}

        {activeTab === "agendamento" && (
          <section className="tabPanel">
            <Agendamento />
          </section>
        )}

        {activeTab === "avaliacao" && (
          <section className="tabPanel">
            <h2>Avaliação</h2>
            <p>Aqui ficam as avaliações enviadas pelos clientes.</p>
          </section>
        )}

        {activeTab === "rede-social" && (
          <section className="tabPanel">
            <h2>Rede Social</h2>
            <p>Instagram e contato via WhatsApp.</p>
            <div className="socialButtons">
              <a
                className="primaryBtn"
                href="https://www.instagram.com/carolbronze_oficial/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <button className="secondaryBtn">WhatsApp</button>
            </div>
          </section>
        )}

        {activeTab === "localizacao" && (
          <section className="tabPanel">
            <h2>Localização</h2>
            <p>Cel. Cardoso de Siqueira, 1744 — Vila Oliveira</p>
            <div className="mapBox">Mini mapa aqui</div>
          </section>
        )}
      </div>
    </div>
  );
}
