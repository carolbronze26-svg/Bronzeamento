// Lista de serviços oferecidos + valores e pacote de sessões.
export const SERVICES = [
  {
    id: "bronze",
    name: "Sessão de Bronzeamento",
    duration: "90 min",
    professional: "Carol",
    tag: "Mais procurado",
    preco: 127.90,
    descricao:
      "Aplicação completa de bronzeamento. Ideal para quem está começando o processo ou quer retomar a cor.",
    requerServicoPrevio: null,
  },
  {
    id: "manutencao",
    name: "Manutenção do Bronze",
    duration: "90 min",
    professional: "Carol",
    preco: 127.90,
    descricao:
      "Retoque para manter a cor do bronzeamento já feito.",
    requerServicoPrevio: "bronze", // precisa ter feito "Sessão de Bronzeamento" antes
  },
];

// Pacote de 4 sessões (referente à "Sessão de Bronzeamento")
export const PACOTES = [
  {
    id: "pacote4",
    servicoId: "bronze",
    nome: "Pacote 4 Sessões — Bronzeamento",
    qtdSessoes: 4,
    precoUnitario: 127.90,
    precoTotal: 450, // desconto de 40 sobre 320
    validadeDias: 90,
  },
];

// Horários de atendimento:
// - Segunda a sexta: somente após 19h
// - Domingo: das 10h às 18h
// - Sábado: sem atendimento
export const WEEKDAY_SLOTS = ["19:00", "20:30", "22:00"];
export const SUNDAY_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];

// Texto de regra de cancelamento — usado na aba de Agendamento
export const REGRA_CANCELAMENTO =
  "⚠️ Cancelamentos devem ser feitos com no mínimo 24 horas de antecedência. " +
  "Caso o cancelamento seja feito após esse prazo, o serviço será considerado realizado e cobrado normalmente.";
