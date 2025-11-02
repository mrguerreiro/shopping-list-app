# Guia de Deploy - Shopping List App

Este guia mostra como hospedar o frontend (Netlify/Vercel) e expor o backend localmente via ngrok para testar no celular.

---

## Pré-requisitos

- Node.js instalado (versão 16+)
- Conta no [Netlify](https://netlify.com) ou [Vercel](https://vercel.com) (gratuita)
- [ngrok](https://ngrok.com/) instalado (ou use `npx ngrok`)
- MongoDB rodando (localmente ou MongoDB Atlas)

---

## Parte 1: Preparar o Backend

### 1.1 Configurar variáveis de ambiente

No diretório `backend/`, crie um arquivo `.env` se ainda não existir:

```bash
cd backend
```

Crie/edite o arquivo `.env`:

```env
MONGO_URI=mongodb://localhost:27017/shopping-list
PORT=5001
```

Se usar MongoDB Atlas, substitua `MONGO_URI` pela string de conexão do Atlas.

### 1.2 Instalar dependências e rodar o backend

```bash
npm install
node server.js
```

Você deve ver:
```
Servidor rodando na porta: 5001
MongoDB conectado
```

### 1.3 Expor o backend com ngrok

Com o backend rodando, abra um **novo terminal** e execute:

```bash
ngrok http 5001
```

Ou se não tiver ngrok instalado globalmente:

```bash
npx ngrok http 5001
```

O ngrok vai exibir algo como:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:5001
```

**Anote a URL `https://abc123.ngrok-free.app`** — você vai usar ela no frontend.

> **Nota:** A URL gratuita do ngrok muda toda vez que você reinicia. Para URL fixa, use a versão paga ou considere hospedar o backend em um servidor (Railway, Render, Heroku, etc.).

---

## Parte 2: Preparar o Frontend

### 2.1 Configurar a URL da API

No diretório `frontend/`, crie um arquivo `.env` (copie do `.env.example`):

```bash
cd frontend
copy .env.example .env
```

Edite o arquivo `.env` e configure a URL da API do backend (a URL do ngrok):

```env
VITE_API_URL=https://abc123.ngrok-free.app
```

**Importante:** Substitua `abc123.ngrok-free.app` pela URL que o ngrok gerou no passo 1.3.

> **Nota:** O arquivo `.env` não será commitado (está no `.gitignore`). Cada ambiente (dev, produção) terá seu próprio `.env`.

### 2.2 Fazer o build do frontend

No diretório `frontend/`:

```bash
cd frontend
npm install
npm run build
```

Isso vai gerar uma pasta `dist/` com os arquivos estáticos otimizados.

---

## Parte 3: Deploy no Netlify

### Opção A: Deploy via CLI (recomendado)

1. Instale o Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. No diretório `frontend/`, faça login e deploy:
   ```bash
   netlify login
   netlify deploy --prod --dir=dist
   ```

3. O Netlify vai perguntar se quer criar um novo site — confirme e siga as instruções.

4. Anote a URL fornecida (ex.: `https://seu-app.netlify.app`).

### Opção B: Deploy via interface web

1. Acesse [app.netlify.com](https://app.netlify.com) e faça login.
2. Clique em **"Add new site" > "Deploy manually"**.
3. Arraste a pasta `frontend/dist/` para a área de upload.
4. Aguarde o deploy finalizar e copie a URL gerada.

---

## Parte 4: Deploy no Vercel (alternativa)

### Opção A: Deploy via CLI

1. Instale o Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. No diretório `frontend/`, faça login e deploy:
   ```bash
   vercel login
   vercel --prod
   ```

3. Siga as instruções (aponte o diretório de output para `dist`).

### Opção B: Deploy via interface web

1. Acesse [vercel.com](https://vercel.com) e faça login.
2. Clique em **"Add New" > "Project"**.
3. Conecte o repositório GitHub `mrguerreiro/shopping-list-app`.
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **Deploy** e aguarde.

---

## Parte 5: Testar no Celular

1. Abra o navegador do celular (Chrome, Safari, etc.).
2. Digite a URL do frontend hospedado (ex.: `https://seu-app.netlify.app`).
3. O app deve carregar e se comunicar com o backend via ngrok.

**Importante:** Certifique-se de que:
- O backend está rodando localmente.
- O ngrok está ativo e a URL não mudou.
- Você atualizou a URL da API no código do frontend antes de fazer o build.

---

## Parte 6: Troubleshooting

### Erro de CORS
Se o frontend não conseguir se comunicar com o backend, verifique:
- O backend tem `app.use(cors())` no `server.js` (já configurado).
- A URL da API no frontend está correta.

### Página em branco no Netlify/Vercel
- Verifique se o build gerou arquivos na pasta `dist/`.
- Confira se a URL da API no código está correta (não pode ser `localhost`).

### Ngrok não funciona
- Certifique-se de que o backend está rodando na porta 5001.
- Tente reiniciar o ngrok: `Ctrl+C` e execute `ngrok http 5001` novamente.

---

## Opcional: Hospedar o Backend

Para evitar usar ngrok toda vez, considere hospedar o backend em:
- **Railway:** Deploy gratuito com MongoDB integrado
- **Render:** Plano gratuito com sleep após inatividade
- **Heroku:** Plano gratuito descontinuado, mas dyno pago é barato
- **DigitalOcean / AWS / Azure:** VPS com mais controle

Depois de hospedar, atualize a URL da API no frontend e faça novo build + deploy.

---

## Atalho no Windows: script que liga backend + ngrok e gera build

Para agilizar após reiniciar o PC, use o script pronto em `scripts/start_local_with_ngrok.ps1`:

1) Abra o PowerShell na raiz do projeto e execute:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
./scripts/start_local_with_ngrok.ps1
```

O script irá:
- Iniciar o backend em `http://127.0.0.1:5001` (com logs em `backend/logs/`)
- Iniciar o ngrok e capturar a URL pública (ex.: `https://xxxxx.ngrok-free.dev`)
- Atualizar `frontend/.env` com `VITE_API_URL=<URL_DO_NGROK>`
- Rodar `npm run build` no frontend e indicar a pasta `frontend/dist/` para deploy no Netlify

Observação:
- Se a URL do ngrok mudar, rode o script novamente e refaça o upload do `dist/` para o Netlify.
- Para URL estável, hospede o backend em Render/Railway e use essa URL no `VITE_API_URL`.

---

## Resumo dos Comandos

### Backend (local + ngrok)
```bash
cd backend
npm install
node server.js

# Novo terminal:
ngrok http 5001
```

### Frontend (build + deploy)
```bash
cd frontend
npm install
npm run build

# Netlify:
netlify deploy --prod --dir=dist

# Vercel:
vercel --prod
```

---

**Pronto!** Agora qualquer pessoa pode acessar o app pelo celular usando a URL do Netlify/Vercel. 🚀
