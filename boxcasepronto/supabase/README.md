# Supabase — Box

Esta pasta contém a fundação do banco e das automações. Nenhuma função envia mensagens até que seja implantada, receba os secrets e tenha um agendamento ativado.

## Aplicação do banco

1. Abra um projeto de teste no Supabase.
2. Revise `migrations/202608130001_box_selva_core.sql` contra as tabelas existentes.
3. Execute a migration pelo Supabase CLI ou SQL Editor.
4. Confirme que RLS está ativo em `profiles`, `clients`, `subscriptions`, `notification_templates` e `notifications`.
5. Cadastre um usuário de teste e confirme que o trigger criou `profiles` e `clients`.

Depois das migrations principal e administrativa, execute também `migrations/202608130003_fix_public_plans_policy.sql` para permitir que visitantes vejam apenas planos ativos sem conceder acesso à função administrativa.

## Funções preparadas

- `queue-expiration-reminders`: coloca na fila alertas de vencimento em 7, 3, 1 e 0 dias.
- `queue-promotion`: cria notificações promocionais somente para clientes com opt-in de WhatsApp.
- `dispatch-whatsapp`: envia até 50 itens enfileirados pela API oficial do WhatsApp.

Todas exigem `x-automation-secret`. A função de envio também exige templates aprovados no WhatsApp Manager; mensagens promocionais e lembretes iniciados pela empresa não devem usar texto livre.

## Secrets das Edge Functions

Copie `functions/.env.example` apenas para desenvolvimento local. Em produção, configure pelo painel **Edge Functions → Secrets**:

- `AUTOMATION_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_TEMPLATE_LANGUAGE`
- `WHATSAPP_PROMOTION_TEMPLATE_NAME`

Nunca coloque o token do WhatsApp ou a service role em variáveis `NEXT_PUBLIC_*`.

## Agendamento futuro

Depois de implantar as funções e validar os templates, use Supabase Cron para:

- chamar `queue-expiration-reminders` diariamente;
- chamar `dispatch-whatsapp` em intervalos curtos para processar a fila.

O agendamento não é criado nesta etapa para impedir envios acidentais.
