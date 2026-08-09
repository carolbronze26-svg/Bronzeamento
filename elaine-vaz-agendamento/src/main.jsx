import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Registra o service worker — necessário para o navegador oferecer
// a opção de "Instalar app" (PWA).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Falha ao registrar o service worker:", err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
