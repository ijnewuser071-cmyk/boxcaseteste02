"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { createPixPayload, pixRecipient } from "@/lib/pix";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function PixCheckout({ plan, txid, addonCodes, items, discountCents }: { plan: { id: string; name: string; frequency: number; priceCents: number }; txid: string; addonCodes: string[]; items: string[]; discountCents: number }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const payload = useMemo(() => createPixPayload({ amount: plan.priceCents / 100, txid }), [plan.priceCents, txid]);
  const comboDescription = items.length ? ` Combo: ${items.join(", ")}.` : "";
  const discountDescription = discountCents > 0 ? " Desconto de 15% aplicado." : "";

  useEffect(() => {
    if (canvasRef.current) void QRCode.toCanvas(canvasRef.current, payload, { width: 260, margin: 2, color: { dark: "#101713", light: "#FFFFFF" }, errorCorrectionLevel: "M" });
  }, [payload]);

  async function copyPix() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function reportPayment() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase não configurado.");
    setPending(true);
    const { error } = await supabase.rpc("report_pix_payment" as never, { requested_plan_id: plan.id, requested_txid: txid, requested_addon_codes: addonCodes } as never);
    setPending(false);
    if (error) return setMessage(`Não foi possível registrar: ${error.message}`);
    setMessage(`Pagamento informado! Redirecionando para sua dashboard.${comboDescription}${discountDescription}`);
    router.replace("/dashboard?payment=reported#inicio");
    router.refresh();
  }

  return <div className="pix-checkout"><section className="pix-summary"><span className="eyebrow">Confirmação do plano</span><h1 className="display">Finalize com Pix.</h1><p>Faça o pagamento usando o QR Code ou o Pix Copia e Cola. A ativação acontece após a conferência do administrador.</p><div className="checkout-plan"><div><small>Plano escolhido</small><strong>{plan.name}</strong><span>{plan.frequency} check-ins por semana</span></div><b>{(plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<small>/mês</small></b></div><ol><li><span>1</span>Abra o aplicativo do seu banco.</li><li><span>2</span>Escolha pagar com QR Code ou Pix Copia e Cola.</li><li><span>3</span>Confira o recebedor e o valor antes de confirmar.</li><li><span>4</span>Volte e informe que realizou o pagamento.</li></ol><button type="button" className="back-to-plans" onClick={() => router.push("/dashboard#planos")}>← Escolher outro plano</button></section><section className="pix-payment-card"><div className="pix-qr"><canvas ref={canvasRef} aria-label="QR Code Pix para pagamento do plano" /></div><div className="pix-value"><span>Valor do Pix</span><strong>{(plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div><div className="pix-recipient"><div><span>Recebedor</span><strong>{pixRecipient.name}</strong></div><div><span>Chave Pix</span><strong>{pixRecipient.displayKey}</strong></div><div><span>Cidade</span><strong>{pixRecipient.city}</strong></div></div><label>Pix Copia e Cola<textarea readOnly rows={3} value={payload} /></label><button type="button" className="button copy-pix" onClick={copyPix}>{copied ? "Código copiado ✓" : "Copiar código Pix"}</button><button type="button" className="payment-done" disabled={pending} onClick={reportPayment}>{pending ? "Registrando..." : "Já fiz o Pix →"}</button>{message && <p className="payment-message" role="status">{message}</p>}<p className="manual-warning">O site não confirma pagamentos automaticamente. Guarde o comprovante até a ativação do plano.</p></section></div>;
}
