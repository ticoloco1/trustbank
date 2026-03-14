# TrustBank — O que não deu e onde estava

## O que aconteceu

As melhorias que vocês fizeram (colunas 1/2/3, drag and drop, mensagens, marcação de consultas, online, calendário, cores tipo alumínio anodizado) estavam em **outro projeto** e em **outro servidor/stack**. Por isso no **trustbank.xyz** (que usa este repositório + Prisma) essas coisas **não apareciam ou não funcionavam**.

---

## Onde estava o código que “não deu”

| Local | Stack | O que tinha |
|-------|--------|-------------|
| **trustbank-v2-2** (ex.: em `Downloads/trustbank-v2-2`) | Next.js + **Drizzle** + **MySQL** (outro servidor/DB) | Layout 1/2/3 colunas, cores (principal, destaque, fundo), dashboard Mini-Site/Vídeos/CV/Ganhos, mini site público com `layout-1` / `layout-2` / `layout-3`, tema escuro |
| **trustbank-minisite-builder** | SKILL/doc (referência) | Descrição de **drag and drop** de blocos, templates (PROFILE, NETFLIX, CV_PRO, etc.), mensagens, formulários |
| **trustbank.xyz em produção** | Este repo (**royal-fintech-hub**) + **Prisma** + Postgres (Vercel) | Só o que está neste repositório; não tinha as telas/features do v2-2 |

Ou seja: o que “não deu” no trustbank.xyz era porque **o código que tinha colunas, cores, etc. estava no projeto v2-2 (outro servidor/banco)**, e não neste projeto que sobe no domínio trustbank.xyz.

---

## O que este repositório passa a ter (Prisma, mesmo servidor do trustbank.xyz)

Tudo em **Prisma** (Postgres), no mesmo app que deploya no **trustbank.xyz**:

1. **Colunas 1, 2, 3**  
   - Campo `layout_columns` (1, 2 ou 3) no mini site.  
   - No dashboard: botões “1 coluna”, “2 colunas”, “3 colunas”.  
   - Na página pública do mini site: classes CSS `layout-1`, `layout-2`, `layout-3` (bloco / grid 2fr 1fr / grid 3 colunas).

2. **Cores (principal, destaque, fundo)**  
   - Campos no Prisma: `primary_color`, `accent_color`, `bg_color` (hex).  
   - No dashboard: seção “Cores” com color picker para cada um.  
   - Preset **“Alumínio anodizado”**: tema cinza/prateado aplicado quando o usuário escolhe esse tema.

3. **Mini site público**  
   - Página `/s/[slug]` usando `layout_columns` e as cores salvas no Prisma (e cotação/ideias que já existem).

4. **Documentado como “próximos passos” (a implementar)**  
   - Drag and drop de blocos no mini site.  
   - Mensagens.  
   - Marcação de consultas (agendamento).  
   - Indicador “online”.  
   - Calendário.  

Assim fica claro: o que “não deu” era porque estava no outro servidor (v2-2); o que está neste doc é o que está (ou será) neste projeto, no Prisma, no mesmo servidor do trustbank.xyz.
