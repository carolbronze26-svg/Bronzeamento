// Lista de serviços oferecidos pelo salão.
// Sem campo de preço — valores das sessões de bronzeamento são
// combinados diretamente com a Carol, não exibidos no app.

export const SERVICES = [
  {
    id: "bronze",
    name: "Bronzeamento Artificial",
    duration: "90 min",
    professional: "Carol",
    tag: "Mais procurado",
  },
    {
    id: "manutencao",
    name: "Manutenção de Bronze",
    duration: "90 min",
    professional: "Carol",
  },
];

// Horários de atendimento:
// - Segunda a sexta: somente após 18h
// - Domingo: das 10h às 18h
// - Sábado: sem atendimento
export const WEEKDAY_SLOTS = ["18:00", "19:30","21:00", "21:30"];
export const SUNDAY_SLOTS = ["10:00", "11:30","13:00","14:30", "16:00", "17:30"];
