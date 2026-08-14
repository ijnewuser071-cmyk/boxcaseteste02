"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasAdminAccess } from "@/lib/auth/roles";
import { isPlausibleInternationalPhone, normalizeInternationalPhone } from "@/lib/phone";

type Mode = "login" | "signup";

export function AuthForm({ initialMode, nextPath, selectedPlan, initialMessage }: { initialMode: Mode; nextPath: string; selectedPlan?: string; initialMessage?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pending, setPending] = useState(false);
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(initialMessage ? { type: "success", text: initialMessage } : null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Conexão com o Supabase ainda não configurada. Verifique o arquivo .env.local." });
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const rawPhone = String(form.get("phone") ?? "").trim();
    const phone = normalizeInternationalPhone(rawPhone);
    if (password.length < 8) {
      setMessage({ type: "error", text: "A senha precisa ter pelo menos 8 caracteres." });
      return;
    }

    if (mode === "signup") {
      if (!isPlausibleInternationalPhone(phone)) {
        setMessage({ type: "error", text: "Informe o WhatsApp com código do país e DDD. Exemplo: +55 84 99999-9999." });
        return;
      }
      setPending(true);
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", nextPath);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback.toString(), data: { full_name: fullName, phone: phone!, whatsapp_opt_in: true, email_opt_in: true, app_opt_in: true, selected_plan: selectedPlan ?? null } },
      });
      setPending(false);
      if (error) return setMessage({ type: "error", text: error.message });
      if (data.session) await supabase.auth.signOut();
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("mode", "login");
      loginUrl.searchParams.set("next", nextPath);
      loginUrl.searchParams.set("registered", data.session ? "success" : "confirm");
      if (selectedPlan) loginUrl.searchParams.set("plan", selectedPlan);
      window.location.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    setPending(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      if (error.code === "email_not_confirmed") {
        setResendEmail(email);
        return setMessage({ type: "error", text: "Seu e-mail ainda não foi confirmado. Abra a mensagem de confirmação ou solicite um novo envio." });
      }
      if (error.code === "over_request_rate_limit") return setMessage({ type: "error", text: "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente." });
      return setMessage({ type: "error", text: "E-mail ou senha incorretos. Confira os dados e tente novamente." });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const isAdmin = hasAdminAccess(data.user.id, (profile as { role?: string } | null)?.role);
    const destination = isAdmin ? "/admin" : nextPath.startsWith("/admin") ? "/dashboard" : nextPath;
    router.replace(destination);
    router.refresh();
  }

  async function recoverPassword() {
    const emailInput = document.querySelector<HTMLInputElement>("#auth-email");
    const email = emailInput?.value.trim();
    if (!email) return setMessage({ type: "error", text: "Digite seu e-mail primeiro para recuperar a senha." });
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage({ type: "error", text: "Supabase ainda não configurado." });
    setRecoveryPending(true);
    const recoveryUrl = new URL("/auth/recovery", window.location.origin);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryUrl.toString() });
    setRecoveryPending(false);
    setMessage(error ? { type: "error", text: error.code === "over_email_send_rate_limit" ? "O limite temporário de e-mails do Supabase foi atingido. Aguarde até uma hora ou configure o SMTP próprio do Box." : "Não foi possível enviar agora. Confira o serviço de e-mail e tente novamente." } : { type: "success", text: "Solicitação enviada. Confira a caixa de entrada e o spam; o link pode levar alguns minutos para chegar." });
  }

  async function resendConfirmation() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !resendEmail) return;
    setRecoveryPending(true);
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const { error } = await supabase.auth.resend({ type: "signup", email: resendEmail, options: { emailRedirectTo: callback.toString() } });
    setRecoveryPending(false);
    setMessage(error ? { type: "error", text: "Aguarde alguns minutos antes de solicitar outro e-mail." } : { type: "success", text: "Novo e-mail de confirmação enviado. Confira também a caixa de spam." });
  }

  return <div className="auth-card">
    <div className="auth-tabs" role="tablist" aria-label="Acesso do cliente">
      <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setMessage(null); }}>Já sou cliente</button>
      <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setMessage(null); }}>Criar minha conta</button>
    </div>
    <div className="auth-card-head"><span className="eyebrow">{mode === "login" ? "Bem-vindo de volta" : "Comece sua jornada"}</span><h1 className="display">{mode === "login" ? "Entre na sua conta." : "Crie sua conta."}</h1><p>{mode === "login" ? "Acesse seus planos, pacotes e preferências." : "Cadastre-se para escolher e gerenciar seu plano do Box."}</p></div>
    {selectedPlan && <div className="selected-plan-note"><span>Plano selecionado</span><strong>{selectedPlan} por semana</strong><small>Você poderá confirmar ou alterar depois do acesso.</small></div>}
    <form className="auth-form" onSubmit={submit}>
      {mode === "signup" && <label>Nome completo<input name="fullName" type="text" autoComplete="name" minLength={2} required placeholder="Como podemos chamar você?" /></label>}
      {mode === "signup" && <label>WhatsApp internacional<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+55 84 99999-9999" /><small>Inclua o código do país. Ex.: +55 Brasil, +32 Bélgica.</small></label>}
      <label>E-mail<input id="auth-email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" /></label>
      <label>Senha<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="Mínimo de 8 caracteres" /></label>
      {mode === "login" && <button className="forgot-button" type="button" disabled={recoveryPending} onClick={recoverPassword}>{recoveryPending ? "Enviando..." : "Esqueci minha senha"}</button>}
      {mode === "signup" && <label className="auth-consent"><input name="notificationsConsent" type="checkbox" required /><span>Autorizo avisos sobre meu plano por WhatsApp, e-mail e aplicativo.</span></label>}
      {message && <p className={`auth-message ${message.type}`} role="status">{message.text}</p>}
      {resendEmail && message?.type === "error" && <button className="resend-confirmation" type="button" disabled={recoveryPending} onClick={resendConfirmation}>Reenviar confirmação de e-mail</button>}
      <button className="button auth-submit" type="submit" disabled={pending}>{pending ? (mode === "login" ? "Acessando..." : "Criando conta...") : mode === "login" ? "Acessar painel →" : "Criar conta →"}</button>
    </form>
    <p className="auth-terms">Ao continuar, você concorda com os termos de uso e a política de privacidade do Box.</p>
  </div>;
}
