-- Modalidades que também podem ser compradas individualmente.
insert into public.plans(code,name,frequency_per_week,price_cents,description,active,sort_order)
values
 ('jiujitsu-comercial','Jiu-Jitsu Comercial',5,10000,'BTT Medeiros · horário comercial',true,110),
 ('jiujitsu-iniciantes','Jiu-Jitsu Iniciantes',5,13000,'BTT Medeiros · turma de iniciantes',true,120),
 ('jiujitsu-competicao','Jiu-Jitsu Competição',5,13000,'BTT Medeiros · turma de competição',true,130),
 ('lpo-cross-1x','LPO Cross',1,15000,'Lift Hard · 1x por semana',true,140),
 ('forca-2x','Força',2,15000,'Lift Hard · 2x por semana',true,150)
on conflict(code) do update set name=excluded.name,frequency_per_week=excluded.frequency_per_week,price_cents=excluded.price_cents,description=excluded.description,active=true,sort_order=excluded.sort_order;
