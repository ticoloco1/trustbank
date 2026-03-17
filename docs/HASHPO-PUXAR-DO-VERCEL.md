# Puxar o hashpo.com do Vercel para um repositório

O projeto **hashpo-com** está só na Vercel ([vercel.com/ticoloco1s-projects/hashpo-com](https://vercel.com/ticoloco1s-projects/hashpo-com)), sem repositório Git. Abaixo, formas de tentar salvar o que estiver disponível.

---

## 1. Token da Vercel

1. Acesse [vercel.com/account/tokens](https://vercel.com/account/tokens).
2. Crie um token (ex.: "hashpo-export") com acesso ao time/projeto.
3. Guarde o token em lugar seguro; você vai usá-lo nos comandos abaixo.

---

## 2. Script neste repositório

Na pasta do projeto (esta mesma), rode:

```bash
VERCEL_TOKEN=seu_token_aqui node scripts/pull-hashpo-from-vercel.js
```

Se o projeto estiver em um **team**:

```bash
VERCEL_TOKEN=seu_token VERCEL_TEAM=ticoloco1s-projects node scripts/pull-hashpo-from-vercel.js
```

O script vai:

- Listar os deployments do projeto **hashpo-com**
- Pegar o deployment mais recente (ou o de produção)
- Listar a árvore de arquivos desse deployment
- Baixar cada arquivo para a pasta **`hashpo-vercel-export/`** na raiz do projeto

**Importante:** Se o deploy foi feito **por Git** (conexão com GitHub etc.), a Vercel às vezes não guarda a árvore de source; nesse caso o script pode falhar com "Árvore de arquivos não disponível". Ainda assim vale tentar.

---

## 3. Ferramenta alternativa (npm)

Se o script acima não conseguir listar/baixar os arquivos, use uma ferramenta que fala direto com a API da Vercel:

```bash
npx vercel-deploy-source-downloader
```

Ela é interativa: pede token, projeto e deployment. O resultado costuma ser o **build** (arquivos já compilados), não o código-fonte original, mas já serve para ter uma cópia do que está no ar.

Outras opções:

- [vercel-deployment-downloader](https://www.npmjs.com/package/vercel-deployment-downloader)
- [source-from-vercel-deployment](https://github.com/CalinaCristian/source-from-vercel-deployment)

---

## 4. Depois de baixar

1. A pasta **`hashpo-vercel-export/`** (ou a que a ferramenta gerar) terá os arquivos recuperados.
2. Crie um **novo repositório** no GitHub (ex.: `hashpo-com` ou `hashpo-website`).
3. Inicialize Git e faça o primeiro commit:

   ```bash
   cd hashpo-vercel-export
   git init
   git add .
   git commit -m "Export from Vercel hashpo-com"
   git remote add origin https://github.com/SEU_USUARIO/hashpo-com.git
   git push -u origin main
   ```

4. Se no futuro você quiser conectar esse repo ao projeto na Vercel: **Settings → Git** no projeto hashpo-com e conecte o repositório.

---

## 5. Limitações

- **Deploy por Git:** a Vercel pode não expor o source completo pela API; o que vier pode ser só o resultado do build (bundles, estáticos).
- **Deploy por CLI/upload:** as chances de ter árvore de arquivos e conteúdo são melhores.
- Mesmo com arquivos baixados, **código minificado/compilado** não vira de volta o source original; serve como backup e referência.

Se o script der erro, anote a mensagem e o comando que você usou (sem o token) para ajustar projeto/time ou tentar a ferramenta alternativa.
