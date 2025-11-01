# shopping-list-app

Aplicação colaborativa de lista de compras com backend (Node.js + Express + MongoDB) e frontend (React + Vite).

## 📋 Funcionalidades

- Criar e gerenciar listas de compras colaborativas
- Marcar itens como comprados (registra quem comprou e quando)
- Relatórios:
  - Compras por data
  - Compras por usuário
  - Frequência média de compra de um item
- Interface responsiva (funciona em desktop e mobile)

## 🚀 Como começar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [MongoDB](https://www.mongodb.com/) (local ou [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Clonar o repositório

```bash
git clone https://github.com/mrguerreiro/shopping-list-app.git
cd shopping-list-app
```

### Configurar Backend

1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` (copie o `.env.example`):
   ```bash
   copy .env.example .env
   ```

4. Edite o `.env` e configure a URL do MongoDB:
   ```env
   MONGO_URI=mongodb://localhost:27017/shopping-list
   PORT=5001
   ```

5. Inicie o servidor:
   ```bash
   node server.js
   ```

### Configurar Frontend

1. Entre na pasta `frontend`:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra o navegador em `http://localhost:5173`

## 📱 Deploy e Acesso via Celular

Para hospedar o app e acessá-lo de qualquer dispositivo (incluindo celular), veja o guia completo em **[DEPLOY.md](./DEPLOY.md)**.

O guia inclui:
- Como expor o backend via ngrok
- Como fazer deploy do frontend no Netlify/Vercel
- Como acessar o app pelo celular

## 📂 Estrutura do Projeto

```
shopping-list-app/
├── backend/          # API Node.js + Express + MongoDB
│   ├── models/       # Schemas do Mongoose
│   ├── routes/       # Rotas da API
│   ├── scripts/      # Scripts de teste e utilitários
│   └── server.js     # Servidor principal
├── frontend/         # Interface React + Vite
│   ├── src/          # Componentes React
│   └── public/       # Arquivos estáticos
└── DEPLOY.md         # Guia de deploy completo
```

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](./LICENSE).

## 🤝 Contribuições

Sinta-se à vontade para abrir issues e pull requests!
