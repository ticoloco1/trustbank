# trustbank.xyz: apontar para Vercel (não Lovable)

Se **trustbank.xyz** está igual ao **prime-fin-dash.lovable.app**, o domínio ainda está ligado ao **Lovable**. O código que você envia para o **GitHub** (e que o **Vercel** faz deploy) **não aparece** nesse domínio enquanto ele apontar para o Lovable.

---

## O que fazer

### 1. Ter o projeto no Vercel

- Acesse [vercel.com](https://vercel.com) e faça login.
- **Add New** → **Project** → importe o repositório **ticoloco1/prime-fin-dash** do GitHub.
- Configure as variáveis de ambiente (ex.: `DATABASE_URL`, etc.) em **Settings → Environment Variables**.
- Faça um deploy. Você ganha uma URL tipo: `prime-fin-dash-xxx.vercel.app`.

### 2. Apontar trustbank.xyz para o Vercel

- No **Vercel**: projeto do prime-fin-dash → **Settings** → **Domains** → **Add** → digite `trustbank.xyz` (e se quiser `www.trustbank.xyz`).
- O Vercel mostra o que configurar no **registro do domínio** (onde você comprou trustbank.xyz), por exemplo:
  - **CNAME**: `cname.vercel-dns.com` (ou o valor que o Vercel mostrar)
  - ou registros **A** para o IP do Vercel
- No **registro do domínio** (GoDaddy, Namecheap, Registro.br, etc.):
  - **Remova** ou altere qualquer CNAME/A que aponte para **Lovable** ou para **prime-fin-dash.lovable.app**.
  - Coloque o **CNAME** (ou A) que o **Vercel** indicou para `trustbank.xyz` (e `www` se usar).

### 3. Desvincular do Lovable (se o domínio estava no Lovable)

- Se você configurou trustbank.xyz dentro do **Lovable**, tire o domínio de lá (ou delete o projeto) para não haver conflito.
- O importante: no **registro do domínio**, o único destino de trustbank.xyz deve ser o **Vercel** (o valor que o Vercel dá em **Domains**).

---

## Resumo

| Onde está o domínio agora | O que você vê |
|---------------------------|----------------|
| Apontando para **Lovable** | Mesmo site do prime-fin-dash.lovable.app; pushes no GitHub não aparecem. |
| Apontando para **Vercel** (projeto prime-fin-dash) | O que foi deployado a partir do GitHub (este repositório). |

Depois de apontar trustbank.xyz para o Vercel e a propagação do DNS passar (pode levar alguns minutos), abra de novo **https://trustbank.xyz** e **https://trustbank.xyz/api/health** — deve ser o deploy do Vercel.
