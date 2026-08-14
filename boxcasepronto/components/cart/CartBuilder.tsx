"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addonCatalog, getCartTotals } from "@/lib/addons";

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CartBuilder({ plan, initialAddonCodes = [] }: { plan: { code: string; frequency: number; name: string; priceCents: number }; initialAddonCodes?: string[] }) {
  const router = useRouter();
  const [addons, setAddons] = useState<string[]>(initialAddonCodes.filter((code) => code !== plan.code));
  const totals = useMemo(() => getCartTotals(plan.priceCents, addons), [plan.priceCents, addons]);
  function toggle(code: string) {
    setAddons((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  function checkout() {
    const query = new URLSearchParams({ product: plan.code });
    if (addons.length) query.set("addons", addons.join(","));
    router.push(`/pagamento?${query}`);
  }

  return <div className="cart-layout"><section className="cart-content"><div className="cart-heading"><span className="eyebrow">Seu carrinho</span><h1 className="display">Revise seu plano.</h1><p>O pagamento só será gerado depois que você confirmar todos os itens.</p></div><article className="cart-plan-item"><div><small>Plano principal</small><strong>{plan.name}</strong><span>{plan.frequency} treinos por semana</span></div><b>{money(plan.priceCents)}<small>/mês</small></b></article><section className="cart-discounts"><div><span className="eyebrow">Aba descontos</span><h2 className="display">Quer adicionar outra modalidade?</h2><p>Adicione uma modalidade ao plano principal e receba 15% de desconto no combo.</p></div><div className="cart-addon-grid">{addonCatalog.map((item) => { const active = addons.includes(item.code); return <button key={item.code} type="button" aria-pressed={active} className={active ? "selected" : ""} onClick={() => toggle(item.code)}><span>{active ? "✓ No carrinho" : "+ Adicionar"}</span><strong>{item.name}</strong><small>{item.detail}</small><b>{money(item.priceCents)}/mês</b></button>; })}</div></section></section><aside className="cart-receipt"><span>Resumo da compra</span><h2 className="display">{plan.name}</h2><div className="receipt-lines"><p><span>Plano principal</span><strong>{money(plan.priceCents)}</strong></p>{totals.addons.map((item) => <p key={item.code}><span>{item.name}</span><strong>{money(item.priceCents)}</strong></p>)}</div><div className="receipt-subtotal"><p><span>Subtotal</span><strong>{money(totals.subtotalCents)}</strong></p><p className="receipt-discount"><span>Desconto do combo</span><strong>− {money(totals.discountCents)}</strong></p></div><div className="receipt-total"><span>Total mensal</span><strong>{money(totals.totalCents)}</strong></div><button type="button" className="button" onClick={checkout}>Finalizar e gerar Pix →</button><button type="button" className="cart-back" onClick={() => router.push("/dashboard#planos")}>Escolher outro plano</button></aside></div>;
}
