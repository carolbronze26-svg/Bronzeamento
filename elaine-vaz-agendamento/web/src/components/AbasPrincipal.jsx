import React, { useState } from "react";
import { MapPin, Phone, Instagram, Clock, ChevronRight } from "lucide-react";

const TABS = [
  { id: "sobre", label: "Sobre" },
  { id: "horarios", label: "Horários" },
  { id: "localizacao", label: "Localização" },
  { id: "contato", label: "Contato" },
];

export default function AbasPrincipal() {
  const [activeTab, setActiveTab] = useState("sobre");

  return (
    <div className="tabsPage">
      <div className="tabsBar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tabBtn ${activeTab === tab.id ? "tabBtnActive" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tabsContent">
        {activeTab === "sobre" && (
          <div className="tabPanel">
            <h2>Sobre nós</h2>
            <p>
              Somos um espaço criado para oferecer uma experiência elegante,
              confortável e organizada. Aqui você encontra atendimento com
              horário marcado e foco total na qualidade.
            </p>

            <div className="socialButtons">
              <button type="button" className="secondaryBtn">
                Ver serviços
              </button>
              <button type="button" className="secondaryBtn">
                Falar no WhatsApp
              </button>
            </div>
          </div>
        )}

        {activeTab === "horarios" && (
          <div className="tabPanel">
            <h2>Horários</h2>
            <p>Atendimento de segunda a domingo, conforme disponibilidade.</p>

            <div style={{ marginTop: 18 }}>
              <div className="summaryCard">
                <div className="summaryRow">
                  <span className="summaryLabel">Segunda a sexta</span>
                  <span className="summaryValue">19:00 às 22:00</span>
                </div>

                <div className="summaryDivider" />

                <div className="summaryRow">
                  <span className="summaryLabel">Sábado</span>
                  <span className="summaryValue">Fechado</span>
                </div>

                <div className="summaryDivider" />

                <div className="summaryRow">
                  <span className="summaryLabel">Domingo</span>
                  <span className="summaryValue">10:00 às 12:00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "localizacao" && (
          <div className="tabPanel">
            <h2>Localização</h2>
            <p>Estamos em Mogi das Cruzes - SP, com fácil acesso para agendamento.</p>

            <div className="mapBox">
              <div style={{ textAlign: "center" }}>
                <MapPin size={22} style={{ marginBottom: 8 }} />
                <div>Mapa / endereço aqui</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contato" && (
          <div className="tabPanel">
            <h2>Contato</h2>
            <p>Escolha o melhor canal para falar com a gente.</p>

            <div className="socialButtons">
              <button type="button" className="secondaryBtn">
                <Phone size={16} style={{ marginRight: 6 }} />
                WhatsApp
              </button>

              <button type="button" className="secondaryBtn">
                <Instagram size={16} style={{ marginRight: 6 }} />
                Instagram
              </button>

              <button type="button" className="secondaryBtn">
                <Clock size={16} style={{ marginRight: 6 }} />
                Agendar agora
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <button type="button" className="secondaryBtn" style={{ width: "100%" }}>
                Ver mais detalhes
                <ChevronRight size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
