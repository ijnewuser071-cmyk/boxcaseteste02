alter table public.payment_requests add column if not exists addon_codes text[] not null default '{}';
alter table public.payment_requests add column if not exists discount_cents integer not null default 0;
create or replace function public.report_pix_payment(requested_plan_id uuid, requested_txid text, requested_addon_codes text[])
returns uuid language plpgsql security definer set search_path='' as $$
declare resolved_client_id uuid; plan_amount integer; addons_amount integer:=0; resolved_discount integer:=0; resolved_total integer; safe_codes text[]; result_id uuid;
begin
 select id into resolved_client_id from public.clients where user_id=auth.uid(); if resolved_client_id is null then raise exception 'Client profile not found'; end if;
 select price_cents into plan_amount from public.plans where id=requested_plan_id and active=true; if plan_amount is null then raise exception 'Plan unavailable'; end if;
 select coalesce(array_agg(code order by code),'{}'::text[]),coalesce(sum(price),0)::integer into safe_codes,addons_amount from
 (select distinct code,case code when 'jiujitsu-comercial' then 10000 when 'jiujitsu-iniciantes' then 13000 when 'jiujitsu-competicao' then 13000 when 'lpo-cross-1x' then 15000 when 'forca-2x' then 15000 else 0 end price from unnest(coalesce(requested_addon_codes,'{}'::text[])) code) valid where price>0;
 if cardinality(safe_codes)>0 then resolved_discount:=round((plan_amount+addons_amount)*0.15); end if; resolved_total:=plan_amount+addons_amount-resolved_discount;
 insert into public.payment_requests(client_id,plan_id,amount_cents,pix_txid,status,reported_paid_at,addon_codes,discount_cents) values(resolved_client_id,requested_plan_id,resolved_total,requested_txid,'under_review',now(),safe_codes,resolved_discount)
 on conflict(pix_txid) do update set status='under_review',reported_paid_at=coalesce(public.payment_requests.reported_paid_at,now()),addon_codes=excluded.addon_codes,discount_cents=excluded.discount_cents,amount_cents=excluded.amount_cents returning id into result_id;
 return result_id;
end; $$;
revoke all on function public.report_pix_payment(uuid,text,text[]) from public,anon;
grant execute on function public.report_pix_payment(uuid,text,text[]) to authenticated;
