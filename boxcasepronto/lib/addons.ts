export const addonCatalog = [
  { code: "jiujitsu-comercial", name: "Jiu-Jitsu Comercial", detail: "BTT Medeiros · Horário comercial", priceCents: 10000 },
  { code: "jiujitsu-iniciantes", name: "Jiu-Jitsu Iniciantes", detail: "BTT Medeiros · Turma de iniciantes", priceCents: 13000 },
  { code: "jiujitsu-competicao", name: "Jiu-Jitsu Competição", detail: "BTT Medeiros · Competição", priceCents: 13000 },
  { code: "lpo-cross-1x", name: "LPO Cross", detail: "Lift Hard · 1x por semana", priceCents: 15000 },
  { code: "forca-2x", name: "Força", detail: "Lift Hard · 2x por semana", priceCents: 15000 },
] as const;

export function getCartTotals(planPriceCents: number, addonCodes: string[]) {
  const addons = addonCatalog.filter((item) => addonCodes.includes(item.code));
  const subtotalCents = planPriceCents + addons.reduce((sum, item) => sum + item.priceCents, 0);
  const discountCents = addons.length > 0 ? Math.round(subtotalCents * 0.15) : 0;
  return { addons, subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}
