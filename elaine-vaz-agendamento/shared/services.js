// Lista de serviços oferecidos pelo salão.
// Sem campo de preço — valores das sessões de bronzeamento são
// combinados diretamente com a Carol, não exibidos no app.

export const SERVICES = [
  {
    id: "bronze",
    name: "Bronzeamento Artificial",
    duration: "45 min",
    professional: "Carol",
    tag: "Mais procurado",
  },
  {
    id: "bronze-vip",
    name: "Bronzeamento VIP + Hidratação",
    duration: "70 min",
    professional: "Carol",
  },
  {
    id: "manutencao",
    name: "Manutenção de Bronze",
    duration: "25 min",
    professional: "Carol",
  },
];

/// Horários de atendimento:
// - Segunda a sexta: somente após 19h
// - Domingo: das 10h às 18h
// - Sábado: sem atendimento
export const WEEKDAY_SLOTS = ["19:00", "19:30", "20:00", "20:30"];
export const SUNDAY_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];