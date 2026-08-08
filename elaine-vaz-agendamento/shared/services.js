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

// Horários — atendimento noturno (após 19h) todos os dias,
// e aos domingos/feriados apenas com hora marcada.
export const DAY_SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30"];
export const NIGHT_SLOTS = ["19:00", "19:30", "20:00", "20:30"];
