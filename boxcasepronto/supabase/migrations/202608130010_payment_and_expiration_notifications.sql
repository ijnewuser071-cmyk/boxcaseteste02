-- Avisos transacionais: pagamento confirmado e vencimento em exatamente 3 dias.

insert into public.notification_templates (code, channel, title, body, provider_template_name)
values
  ('payment_confirmed', 'whatsapp', 'Pagamento confirmado', 'Olá, {{name}}! Seu pagamento foi confirmado e o plano {{plan_name}} está ativo.', 'payment_confirmed'),
  ('plan_expires_3d_app', 'app', 'Seu plano vence em 3 dias', 'Olá, {{name}}! Restam 3 dias para o vencimento do seu plano. Continue conosco efetuando o pagamento.', null),
  ('payment_confirmed_app', 'app', 'Pagamento confirmado', 'Seu pagamento foi confirmado e seu novo ciclo já está ativo.', null)
on conflict (code) do update set
  title = excluded.title,
  body = excluded.body,
  provider_template_name = excluded.provider_template_name,
  active = true;

alter table public.payment_requests add column if not exists addon_codes text[] not null default '{}';
alter table public.payment_requests add column if not exists discount_cents integer not null default 0;

create or replace function public.report_pix_payment(
  requested_plan_id uuid,
  requested_txid text,
  requested_addon_codes text[]
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  resolved_client_id uuid;
  plan_amount integer;
  addons_amount integer := 0;
  resolved_discount integer := 0;
  resolved_total integer;
  safe_codes text[];
  result_id uuid;
begin
  select id into resolved_client_id from public.clients where user_id = auth.uid();
  if resolved_client_id is null then raise exception 'Client profile not found'; end if;

  select price_cents into plan_amount from public.plans where id = requested_plan_id and active = true;
  if plan_amount is null then raise exception 'Plan unavailable'; end if;

  select coalesce(array_agg(code order by code), '{}'::text[]), coalesce(sum(price), 0)::integer
  into safe_codes, addons_amount
  from (
    select distinct code,
      case code
        when 'jiujitsu-comercial' then 10000
        when 'jiujitsu-iniciantes' then 13000
        when 'jiujitsu-competicao' then 13000
        when 'lpo-cross-1x' then 15000
        when 'forca-2x' then 15000
        else 0
      end as price
    from unnest(coalesce(requested_addon_codes, '{}'::text[])) code
  ) valid
  where price > 0;

  if cardinality(safe_codes) > 0 then
    resolved_discount := round((plan_amount + addons_amount) * 0.15);
  end if;
  resolved_total := plan_amount + addons_amount - resolved_discount;

  insert into public.payment_requests (
    client_id, plan_id, amount_cents, pix_txid, status, reported_paid_at,
    addon_codes, discount_cents
  ) values (
    resolved_client_id, requested_plan_id, resolved_total, requested_txid,
    'under_review', now(), safe_codes, resolved_discount
  )
  on conflict (pix_txid) do update set
    status = 'under_review',
    reported_paid_at = coalesce(public.payment_requests.reported_paid_at, now()),
    addon_codes = excluded.addon_codes,
    discount_cents = excluded.discount_cents,
    amount_cents = excluded.amount_cents
  returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.report_pix_payment(uuid, text, text[]) from public, anon;
grant execute on function public.report_pix_payment(uuid, text, text[]) to authenticated;

create or replace function public.queue_expiration_reminders()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  inserted_count integer := 0;
  app_count integer := 0;
  whatsapp_count integer := 0;
begin
  insert into public.notifications (
    client_id, subscription_id, template_id, kind, channel, title, message,
    status, scheduled_at, dedupe_key, metadata
  )
  select
    s.client_id,
    s.id,
    (select nt.id from public.notification_templates nt where nt.code = 'plan_expires_3d_app' limit 1),
    'expiration',
    'app',
    'Seu plano vence em 3 dias',
    concat('Olá, ', c.name, '! Restam 3 dias para o vencimento do seu plano ', s.plan_name, '. Continue conosco efetuando o pagamento.'),
    'sent',
    now(),
    concat('expiration:app:', s.id, ':3'),
    jsonb_build_object('days_remaining', 3, 'plan_name', s.plan_name, 'ends_at', s.ends_at)
  from public.subscriptions s
  join public.clients c on c.id = s.client_id
  where s.status in ('active', 'past_due')
    and s.ends_at - current_date = 3
    and c.app_opt_in = true
  on conflict do nothing;
  get diagnostics app_count = row_count;

  insert into public.notifications (
    client_id, subscription_id, template_id, kind, channel, title, message,
    status, scheduled_at, dedupe_key, metadata
  )
  select
    s.client_id,
    s.id,
    (select nt.id from public.notification_templates nt where nt.code = 'plan_expires_3d' limit 1),
    'expiration',
    'whatsapp',
    'Seu plano vence em 3 dias',
    concat('Olá, ', c.name, '! Restam 3 dias para o vencimento do seu plano ', s.plan_name, '. Continue conosco efetuando o pagamento.'),
    'queued',
    now(),
    concat('expiration:whatsapp:', s.id, ':3'),
    jsonb_build_object('days_remaining', 3, 'plan_name', s.plan_name, 'ends_at', s.ends_at)
  from public.subscriptions s
  join public.clients c on c.id = s.client_id
  where s.status in ('active', 'past_due')
    and s.ends_at - current_date = 3
    and c.whatsapp_opt_in = true
    and nullif(c.phone, '') is not null
  on conflict do nothing;
  get diagnostics whatsapp_count = row_count;

  inserted_count := app_count + whatsapp_count;
  return inserted_count;
end;
$$;

revoke all on function public.queue_expiration_reminders() from public, anon, authenticated;
grant execute on function public.queue_expiration_reminders() to service_role;

create or replace function public.confirm_pix_payment(payment_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  payment public.payment_requests;
  selected_plan public.plans;
  selected_client public.clients;
  new_subscription_id uuid;
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;

  select * into payment from public.payment_requests where id = payment_request_id for update;
  if payment.id is null or payment.status <> 'under_review' then
    raise exception 'Payment unavailable for confirmation';
  end if;

  select * into selected_plan from public.plans where id = payment.plan_id and active = true;
  if selected_plan.id is null then raise exception 'Plan unavailable'; end if;
  select * into selected_client from public.clients where id = payment.client_id;

  update public.subscriptions
  set status = 'expired', ends_at = least(ends_at, current_date)
  where client_id = payment.client_id and status in ('active', 'past_due');

  insert into public.subscriptions (
    client_id, plan_code, plan_name, price_cents, starts_at, ends_at, status,
    last_payment_at, next_payment_at, payment_reference
  ) values (
    payment.client_id, selected_plan.code, selected_plan.name, payment.amount_cents,
    current_date, current_date + 30, 'active', now(), now() + interval '30 days', payment.pix_txid
  ) returning id into new_subscription_id;

  update public.payment_requests
  set status = 'paid', confirmed_at = now(), confirmed_by = auth.uid(), subscription_id = new_subscription_id
  where id = payment.id;
  update public.clients set status = 'active' where id = payment.client_id;

  if selected_client.app_opt_in then
    insert into public.notifications (
      client_id, subscription_id, template_id, kind, channel, title, message,
      status, scheduled_at, sent_at, dedupe_key, metadata
    ) values (
      payment.client_id,
      new_subscription_id,
      (select id from public.notification_templates where code = 'payment_confirmed_app' limit 1),
      'payment',
      'app',
      'Pagamento confirmado',
      concat('Pagamento confirmado! Seu plano ', selected_plan.name, ' está ativo até ', to_char(current_date + 30, 'DD/MM/YYYY'), '.'),
      'sent',
      now(),
      now(),
      concat('payment:app:', payment.id),
      jsonb_build_object('plan_name', selected_plan.name, 'ends_at', current_date + 30)
    ) on conflict do nothing;
  end if;

  if selected_client.whatsapp_opt_in and nullif(selected_client.phone, '') is not null then
    insert into public.notifications (
      client_id, subscription_id, template_id, kind, channel, title, message,
      status, scheduled_at, dedupe_key, metadata
    ) values (
      payment.client_id,
      new_subscription_id,
      (select id from public.notification_templates where code = 'payment_confirmed' limit 1),
      'payment',
      'whatsapp',
      'Pagamento confirmado',
      concat('Olá, ', selected_client.name, '! Seu pagamento foi confirmado e o plano ', selected_plan.name, ' está ativo.'),
      'queued',
      now(),
      concat('payment:whatsapp:', payment.id),
      jsonb_build_object('plan_name', selected_plan.name, 'ends_at', current_date + 30)
    ) on conflict do nothing;
  end if;

  return new_subscription_id;
end;
$$;

revoke all on function public.confirm_pix_payment(uuid) from public, anon;
grant execute on function public.confirm_pix_payment(uuid) to authenticated;
