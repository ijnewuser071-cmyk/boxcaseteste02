"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const extras = [
  { code: "jiujitsu-comercial", name: "Jiu-Jitsu", detail: "BTT Medeiros · Horário comercial", price: 100 },
  { code: "jiujitsu-iniciantes", name: "Jiu-Jitsu", detail: "BTT Medeiros · Turma de iniciantes", price: 130 },
  { code: "jiujitsu-competicao", name: "Jiu-Jitsu", detail: "BTT Medeiros · Competição", price: 130 },
  { code: "lpo-cross-1x", name: "LPO Cross", detail: "Lift Hard · 1x por semana", price: 150 },
  { code: "forca-2x", name: "Força", detail: "Lift Hard · 2x por semana", price: 150 },
];

export function CustomerAddons({ initialCodes = [], baseMonthlyPrice = 0 }: { initialCodes?: string[]; baseMonthlyPrice?: number }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialCodes);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const chosen = extras.filter((item) => selected.includes(item.code));
  const extrasTotal = chosen.reduce((sum, item) => sum + item.price, 0);
  const subtotal = baseMonthlyPrice + extrasTotal;
  const modalityCount = chosen.length + (baseMonthlyPrice > 0 ? 1 : 0);
  const discountEligible = modalityCount >= 2;
  const savings = discountEligible ? subtotal * 0.15 : 0;
  const discountedTotal = subtotal - savings;

  function toggle(code: string) {
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
    setMessage("");
  }

  async function save() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase não configurado.");
    setPending(true);
    const { error } = await supabase.auth.updateUser({ data: { selected_addons: selected } });
    setPending(false);
    if (error) return setMessage("Não foi possível salvar agora.");
    if (!selected.length) return setMessage("Selecione pelo menos uma modalidade.");
    const [product, ...addons] = selected;
    const query = new URLSearchParams({ product });
    if (addons.length) query.set("addons", addons.join(","));
    router.push(`/carrinho?${query}`);
  }

  return <><div className="discount-rule"><span>Desconto Combo Box</span><strong>{discountEligible ? "15% liberado para seu combo" : "Adicione mais uma modalidade e economize 15%"}</strong><p>O desconto é aplicado quando o combo possui duas ou mais modalidades.</p></div><div className="customer-addon-grid">{extras.map((item) => {
    const active = selected.includes(item.code);
    return <button type="button" className={active ? "selected" : ""} aria-pressed={active} key={item.code} onClick={() => toggle(item.code)}><span>{active ? "✓ Adicionado" : "Adicionar modalidade"}</span><strong>{item.name}</strong><small>{item.detail}</small><b>{formatBRL(item.price)}<i>/mês</i></b></button>;
  })}</div><div className={`addon-summary ${discountEligible ? "discount-active" : ""}`}><div><span>{modalityCount} {modalityCount === 1 ? "modalidade selecionada" : "modalidades selecionadas"}</span><strong>{discountEligible ? `${formatBRL(discountedTotal)}/mês com desconto` : `${formatBRL(subtotal)}/mês`}</strong>{discountEligible && <small>Você economiza {formatBRL(savings)} por mês</small>}</div><button className="button" type="button" disabled={pending || chosen.length === 0} onClick={save}>{pending ? "Preparando..." : "Adicionar ao carrinho"}</button></div>{message && <p className="plan-feedback" role="status">{message}</p>}</>;
}
