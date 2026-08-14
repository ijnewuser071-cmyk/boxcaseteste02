# Publicar o BOX na Netlify

Este é um aplicativo Next.js com autenticação e páginas de servidor. Para manter todas as funcionalidades, conecte esta pasta a um repositório Git e importe o repositório na Netlify. O recurso **Deploy manually/arrastar pasta** é indicado para sites estáticos e não preserva corretamente o backend deste projeto.

## Configuração detectada automaticamente

- Build command: `npm run build`
- Node.js: `20`
- Base directory: vazio
- Publish directory: `.next`

## Depois do primeiro deploy

No Supabase, adicione o endereço criado pela Netlify às URLs permitidas de autenticação e inclua:

`https://SEU-SITE.netlify.app/auth/confirm`

As variáveis públicas do projeto já acompanham esta cópia de apresentação.
