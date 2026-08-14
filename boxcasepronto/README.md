# Box Case — demonstração completa

Cópia independente do projeto do Box, preparada para Next.js 16, Supabase e Netlify. A pasta original não é necessária no build e não deve ser alterada.

## Funcionalidades incluídas

- página institucional, modalidades e planos;
- cadastro, login, recuperação de senha e confirmação de e-mail;
- área do aluno e área administrativa protegidas;
- carrinho, checkout e fluxo de pagamento PIX;
- banco, RLS, RPCs, migrations e Edge Functions em `supabase/`.

## Executar e validar localmente

Requer Node.js 22.

```bash
npm ci
npm test
npm run dev
```

Crie `.env.local` a partir de `.env.example` e preencha as duas variáveis públicas do Supabase.

## Deploy na Netlify

Conecte este diretório/repositório e mantenha:

- Base directory: vazio (raiz do repositório)
- Build command: `npm run build`
- Publish directory: `.next`
- Node.js: `22`

Cadastre na Netlify as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O arquivo `netlify.toml` já configura o adaptador oficial de Next.js.

No Supabase, em **Authentication > URL Configuration**, defina a URL principal da Netlify e autorize `https://SEU-SITE.netlify.app/**`.

Leia `supabase/README.md` antes de aplicar as migrations ou ativar os disparos de WhatsApp.
