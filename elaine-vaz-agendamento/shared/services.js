// Lista de serviços oferecidos pelo salão, com preço.

export const SERVICES = [
  {
    id: "sessao",
    name: "Bronzeamento",
    duration: "90 min",
    professional: "Carol",
    tag: "Mais procurado",
    preco: 127.9,
    info: "Sessão completa de bronzeamento artificial. Inclui protetor solar, esfoliação e ativadores. O tempo total do processo é de cerca de 90 minutos (uso da máquina em torno de 20 minutos).",
  },
  {
    id: "manutencao",
    name: "Manutenção do Bronze",
    duration: "90 min",
    professional: "Carol",
    preco: 127.9,
    requerSessaoAnterior: true,
    info: "Manutenção do bronzeado já feito. É necessário ter realizado o Bronzeamento antes de agendar a manutenção.",
  },
  {
    id: "pacote4",
    name: "Pacote 4 Sessões",
    duration: "4 sessões de Bronzeamento",
    professional: "Carol",
    preco: 450.0,
    tag: "Melhor custo-benefício",
    pacote: true,
    numeroSessoes: 4,
    info: "4 sessões de bronzeamento. Inclui protetor solar, esfoliação, montagem de biquíni de fita, parafina, ativadores e óculos de proteção para uso na máquina.",
  },
  {
   id: "amiga-chama-amiga",
    name: "Amiga chama Amiga",
    duration: "2 sessões de Bronzeamento",
    professional: "Carol",
    preco: 150.0,
    tag: "Promoção de setembro",
    info: "Promoção válida em setembro/2026: 2 sessões de bronzeamento por R$150. Agende as duas sessões (podem ser em datas diferentes). Válido apenas durante o mês de setembro.",
  },
];


// Horários de atendimento:
// - Segunda a sexta: 19h, 20h30 e 22h
// - Domingo: das 10h às 18h
// - Sábado: sem atendimento
export const WEEKDAY_SLOTS = ["19:00", "20:30", "22:00"];
export const SUNDAY_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];

export function formatPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
