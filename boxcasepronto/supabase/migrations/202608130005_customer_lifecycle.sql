-- Ciclo completo do cliente: cadastro, upgrade, contador e lembretes diários.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare resolved_name text; resolved_phone text;
begin
  resolved_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  resolved_phone := nullif(new.raw_user_meta_data ->> 'phone', '');
  insert into public.profiles (id, full_name, email, phone) values (new.id, resolved_name, new.email, resolved_phone)
  on conflict (id) do update set full_name=excluded.full_name, email=excluded.email, phone=coalesce(excluded.phone, public.profiles.phone);
  insert into public.clients (user_id, profile_id, name, email, phone, status, whatsapp_opt_in, email_opt_in, app_opt_in)
  values (new.id, new.id, resolved_name, new.email, resolved_phone, 'lead', coalesce((new.raw_user_meta_data ->> 'whatsapp_opt_in')::boolean,false), coalesce((new.raw_user_meta_data ->> 'email_opt_in')::boolean,false), coalesce((new.raw_user_meta_data ->> 'app_opt_in')::boolean,true))
  on conflict (user_id) do update set name=excluded.name, email=excluded.email, profile_id=excluded.profile_id, phone=coalesce(excluded.phone,public.clients.phone), whatsapp_opt_in=excluded.whatsapp_opt_in, email_opt_in=excluded.email_opt_in, app_opt_in=excluded.app_opt_in;
  return new;
end; $$;

create or replace function public.confirm_pix_payment(payment_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare payment public.payment_requests; selected_plan public.plans; new_subscription_id uuid;
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  select * into payment from public.payment_requests where id=payment_request_id for update;
  if payment.id is null or payment.status <> 'under_review' then raise exception 'Payment unavailable for confirmation'; end if;
  select * into selected_plan from public.plans where id=payment.plan_id and active=true;
  if selected_plan.id is null then raise exception 'Plan unavailable'; end if;
  update public.subscriptions set status='expired', ends_at=least(ends_at,current_date) where client_id=payment.client_id and status in ('active','past_due');
  insert into public.subscriptions (client_id,plan_code,plan_name,price_cents,starts_at,ends_at,status,last_payment_at,next_payment_at,payment_reference)
  values (payment.client_id,selected_plan.code,selected_plan.name,payment.amount_cents,current_date,current_date+30,'active',now(),now()+interval '30 days',payment.pix_txid) returning id into new_subscription_id;
  update public.payment_requests set status='paid',confirmed_at=now(),confirmed_by=auth.uid(),subscription_id=new_subscription_id where id=payment.id;
  update public.clients set status='active' where id=payment.client_id;
  return new_subscription_id;
end; $$;
revoke all on function public.confirm_pix_payment(uuid) from public, anon;
grant execute on function public.confirm_pix_payment(uuid) to authenticated;

create extension if not exists pg_cron with schema pg_catalog;
do $$ declare existing_job bigint; begin
  select jobid into existing_job from cron.job where jobname='box-selva-expiration-reminders' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule('box-selva-expiration-reminders','0 9 * * *','select public.queue_expiration_reminders();');
end $$;
