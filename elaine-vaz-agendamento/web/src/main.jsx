import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

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
// qualquer outro caminho mostra o app de agendamento normal.
const isAdminRoute = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminDashboard /> : <App />}
  </React.StrictMode>
);
