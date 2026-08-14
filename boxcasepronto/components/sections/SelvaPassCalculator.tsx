"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/constants";

type Partner = {
  id: string;
  name: string;
  category: string;
  initial: string;
  plans: { label: string; price: number }[];
};

const partners: Partner[] = [
  {
    id: "box-selva",
    name: "Box",
    category: "Funcional & condicionamento",
    initial: "B",
    plans: [
      { label: "2 check-ins por semana", price: 120 },
      { label: "3 check-ins por semana", price: 165 },
      { label: "4 check-ins por semana", price: 200 },
      { label: "5 check-ins por semana", price: 225 },
      { label: "6 check-ins por semana", price: 240 },
    ],
  },
  {
    id: "btt-medeiros",
    name: "BTT Medeiros",
    category: "Lutas & artes marciais",
    initial: "B",
    plans: [
      { label: "Comercial", price: 100 },
      { label: "Competição", price: 130 },
      { label: "Iniciantes", price: 130 },
    ],
  },
  {
    id: "lift-hard",
    name: "Lift Hard",
    category: "Força & performance",
    initial: "L",
    plans: [
      { label: "LPO Cross — 1x por semana", price: 150 },
      { label: "LPO Cross — 2x por semana", price: 180 },
      { label: "Força — 2x por semana", price: 150 },
      { label: "Força — 3x por semana", price: 200 },
      { label: "Performance — 1x por semana", price: 100 },
      { label: "Performance — 2x por semana", price: 140 },
      { label: "Performance — 3x por semana", price: 170 },
    ],
  },
];

export function SelvaPassCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, number>>({});

  const summary = useMemo(() => {
    const prices = Object.values(selections).filter((price) => price > 0);
    const subtotal = prices.reduce((total, price) => total + price, 0);
    const eligible = prices.length >= 2;
    const savings = eligible ? subtotal * 0.15 : 0;
    return { count: prices.length, subtotal, savings, total: subtotal - savings, eligible };
  }, [selections]);

  function updateSelection(partnerId: string, value: string) {
    const price = Number(value);
    setSelections((current) => {
      const next = { ...current };
      if (price > 0) next[partnerId] = price;
      else delete next[partnerId];
      return next;
    });
  }

  function reset() {
    setSelections({});
  }

  return <div className={`pass-shell ${isOpen ? "is-open" : ""}`} id="simulador">
    <div className="pass-banner">
      <div><span className="eyebrow">Combo Box</span><h3 className="display">Mais modalidades.<br/>Menos mensalidade.</h3></div>
      <p>Combine planos de duas ou mais empresas parceiras e ganhe <strong>15% de desconto</strong>. Aceitamos Gympass, Totalpass e demais passes.</p>
      <button type="button" className="button" aria-expanded={isOpen} aria-controls="pass-calculator" onClick={() => setIsOpen((open) => !open)}>{isOpen ? "Fechar simulação ×" : "Simular desconto →"}</button>
    </div>

    {isOpen && <section className="pass-calculator" id="pass-calculator" aria-label="Simulador de desconto do Box">
      <div className="calculator-head"><div><span className="eyebrow">Monte seu combo</span><h3 className="display">Escolha seus planos</h3></div><p>Selecione no mínimo duas empresas para liberar o desconto.</p></div>
      <div className="partner-grid">{partners.map((partner) => <article className="partner-card" key={partner.id}>
        <div className="partner-title"><span>{partner.initial}</span><div><h4>{partner.name}</h4><p>{partner.category}</p></div></div>
        <label htmlFor={`plan-${partner.id}`}>Plano mensal</label>
        <select id={`plan-${partner.id}`} value={selections[partner.id] ?? ""} onChange={(event) => updateSelection(partner.id, event.target.value)}>
          <option value="">Não incluir esta empresa</option>
          {partner.plans.map((plan) => <option key={`${partner.id}-${plan.label}`} value={plan.price}>{plan.label} — {formatBRL(plan.price)}/mês</option>)}
        </select>
      </article>)}</div>

      <div className={`calculator-result ${summary.eligible ? "discount-active" : ""}`} aria-live="polite">
        <div className="result-message"><span>{summary.eligible ? "Desconto liberado" : `${summary.count}/2 empresas selecionadas`}</span><strong>{summary.eligible ? "Você economiza 15% todo mês." : "Escolha mais uma empresa para economizar."}</strong></div>
        <dl><div><dt>Valor dos planos</dt><dd>{formatBRL(summary.subtotal)}</dd></div><div><dt>Economia mensal</dt><dd className="savings">− {formatBRL(summary.savings)}</dd></div><div className="result-total"><dt>Total com Combo Box</dt><dd>{formatBRL(summary.total)}<small>/mês</small></dd></div></dl>
        <button type="button" className="reset-button" onClick={reset} disabled={summary.count === 0}>Limpar seleção</button>
      </div>
    </section>}
  </div>;
}
