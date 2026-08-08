import React, { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useCreateBooking } from "./hooks/useBooking";
import { buildWhatsappConfirmationLink } from "../../shared/whatsapp";
import { SERVICES } from "../../shared/services";

// A UI visual completa (telas de login, serviço, calendário e confirmação)
// já foi validada no protótipo "agendamento-elaine-vaz.jsx".
// Este arquivo conecta aquela UI aos dados reais do Firebase:
//   - useAuth()          -> login Google + criação do usuário no Firestore
//   - useCreateBooking() -> grava o agendamento como "pendente"
//   - buildWhatsappConfirmationLink() -> gera o link de confirmação
//
// Basta importar os componentes visuais do protótipo (LoginStep, ServiceStep,
// DateTimeStep, ConfirmStep) e trocar os dados mockados pelas chamadas abaixo.

export default function App() {
  const { user, loading, login } = useAuth();
  const { createBooking, saving } = useCreateBooking();

  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [dateInfo, setDateInfo] = useState(null); // { dateKey, dateLabel }
  const [time, setTime] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState(null);

  async function handleConfirm() {
    await createBooking({
      usuarioId: user.uid,
      servico: service,
      dateKey: dateInfo.dateKey,
      dateLabel: dateInfo.dateLabel,
      horario: time,
    });

    setWhatsappLink(
      buildWhatsappConfirmationLink({
        serviceName: service.name,
        dateLabel: dateInfo.dateLabel,
        time,
        clientName: user.displayName,
      })
    );
    setStep(3);
  }

  if (loading) return null; // ou um spinner com a identidade da marca

  // Renderize aqui os componentes visuais do protótipo, passando:
  // - step, setStep
  // - user, login (para o LoginStep)
  // - SERVICES, service, setService (para o ServiceStep)
  // - dateInfo, setDateInfo, time, setTime (para o DateTimeStep)
  // - whatsappLink, saving, handleConfirm (para o ConfirmStep)

  return null;
}
