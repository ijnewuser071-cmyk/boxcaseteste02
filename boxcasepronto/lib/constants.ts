export type Modality = { name: string; tag: string; description: string; benefits: string[]; index: string };
export type Plan = { frequency: string; price: number; perClass: string; featured?: boolean };

export const modalities: Modality[] = [
  { index: "01", name: "Box", tag: "Funcional", description: "Força, emagrecimento e saúde geral. Um programa completo para transformar corpo e mente.", benefits: ["Emagrecimento", "Ganho de força", "Condicionamento"] },
  { index: "02", name: "Selva GPP", tag: "Corrida", description: "Fortalecimento exclusivo para corredores, com prevenção de lesões e mais performance.", benefits: ["Prevenção de lesões", "Força específica", "Mobilidade"] },
  { index: "03", name: "Time Onlion", tag: "Competição", description: "Treino de alto volume para atletas que buscam performance máxima e competição.", benefits: ["Alto rendimento", "Competição", "Performance"] },
  { index: "04", name: "Aventura Kids", tag: "Infantil", description: "Desenvolvimento motor e disciplina para crianças, com movimento e diversão.", benefits: ["Coordenação", "Disciplina", "Diversão"] },
  { index: "05", name: "Jiu-Jitsu", tag: "Lutas", description: "Arte suave para iniciantes, alunos do horário comercial e atletas de competição, em parceria com a BTT Medeiros.", benefits: ["Defesa pessoal", "Disciplina", "Competição"] },
  { index: "06", name: "LPO Cross", tag: "Levantamento olímpico", description: "Técnica, potência e evolução nos movimentos do levantamento de peso olímpico aplicados ao Cross.", benefits: ["Potência", "Técnica", "Explosão"] },
  { index: "07", name: "Força", tag: "Musculação", description: "Treinamento estruturado para aumentar força, estabilidade e capacidade física com acompanhamento.", benefits: ["Força máxima", "Estabilidade", "Progressão"] },
  { index: "08", name: "Performance", tag: "Alto rendimento", description: "Preparação complementar para quem deseja elevar condicionamento e desempenho esportivo.", benefits: ["Condicionamento", "Velocidade", "Alto rendimento"] },
];

export const plans: Plan[] = [
  { frequency: "3x", price: 165, perClass: "R$ 13,75 por treino" },
  { frequency: "4x", price: 200, perClass: "R$ 12,50 por treino" },
  { frequency: "5x", price: 225, perClass: "R$ 11,25 por treino", featured: true },
  { frequency: "6x", price: 240, perClass: "R$ 10,00 por treino" },
];

export const formatBRL = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
