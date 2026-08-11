import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import AvaliarPage from "./AvaliarPage.jsx";

// Registra o service worker — necessário para o navegador oferecer
// a opção de "Instalar app" (PWA).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Falha ao registrar o service worker:", err);
    });
  });
}

// Roteamento simples: /admin mostra o painel administrativo,
// /avaliar mostra a página pública de avaliação, qualquer outro
// caminho mostra o app de agendamento normal.
const path = window.location.pathname;

function Root() {
  if (path.startsWith("/admin")) return <AdminDashboard />;
  if (path.startsWith("/avaliar")) return <AvaliarPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
