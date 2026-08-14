-- TESTE MANUAL: altera somente o usuário informado e gera os avisos de 3 dias.
-- Execute no SQL Editor do projeto de testes. Não use em produção.

do $$
declare
  target_client_id uuid;
  target_subscription_id uuid;
begin
  select id into target_client_id
  from public.clients
  where lower(email) = lower('joaopaulorochass@icloud.com')
  limit 1;

  if target_client_id is null then raise exception 'Cliente de teste não encontrado'; end if;

  update public.clients
  set phone = '+32492870961', whatsapp_opt_in = true, app_opt_in = true, updated_at = now()
  where id = target_client_id;

  select id into target_subscription_id
  from public.subscriptions
  where client_id = target_client_id and status in ('active', 'past_due')
  order by ends_at desc
  limit 1;

  if target_subscription_id is null then raise exception 'O cliente não possui plano ativo para simular'; end if;

  update public.subscriptions
  set ends_at = current_date + 3,
      next_payment_at = (current_date + 3)::timestamptz,
      updated_at = now()
  where id = target_subscription_id;

  delete from public.notifications
  where subscription_id = target_subscription_id
    and kind = 'expiration'
    and metadata ->> 'days_remaining' = '3';
end;
$$;

select public.queue_expiration_reminders() as notifications_created;

select channel, title, message, status, scheduled_at, metadata
from public.notifications
where client_id = (
  select id from public.clients where lower(email) = lower('joaopaulorochass@icloud.com') limit 1
)
order by created_at desc
limit 5;
