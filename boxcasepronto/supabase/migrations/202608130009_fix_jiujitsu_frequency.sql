-- Corrige a frequência da turma de Jiu-Jitsu Iniciantes já cadastrada.
update public.plans
set frequency_per_week = 5,
    updated_at = now()
where code = 'jiujitsu-iniciantes';
