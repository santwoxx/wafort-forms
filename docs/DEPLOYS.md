# Guia de Implantação Wafort: Frontend (Vercel) & Backend (Render)

Este guia prático ensina passo a passo como realizar o deploy profissional do sistema **Wafort Integridade**, separando-o em uma arquitetura robusta de **Frontend** e **Backend**.

---

## 🎨 Parte 1: Frontend (Vercel)

O frontend é um aplicativo web rápido estruturado em **React 18** + **Vite** + **Tailwind CSS**. A Vercel é a plataforma perfeita para distribui-lo em rede global (CDN).

### Passo a Passo para Deploy:

1. **Vincular o Repositório no GitHub**:
   - Crie um repositório no seu GitHub (exemplo: `wafort-integridade`).
   - Comite os arquivos do seu projeto e faça o push.

2. **Entrar na Vercel**:
   - Acesse [Vercel](https://vercel.com) e faça login com a sua conta GitHub.
   - Clique em **"Add New..."** e selecione **"Project"**.

3. **Importar Repositório**:
   - Localize o repositório `wafort-integridade` e clique em **"Import"**.

4. **Configurar as opções do Vite**:
   - **Framework Preset**: Selecione **Vite** (geralmente detectado automaticamente).
   - **Root Directory**: `.` (a raiz do projeto).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Configurações de Redirecionamento (SPA)**:
   - O arquivo `vercel.json` já configurado na raiz encaminhará todas as rotas dinâmicas diretamente para o `index.html`, evitando qualquer erro de página 404 ao atualizar a página (F5).

6. **Implantar**:
   - Clique em **"Deploy"**. Em menos de 2 minutos seu app estará online com um link seguro HTTPS (ex: `https://wafort-forms.vercel.app`).

---

## ⚙️ Parte 2: Backend (Render)

O backend é um servidor robusto em **Node.js** + **Express** configurado em TypeScript, responsável por fornecer endpoints de metadados, relatórios de auditoria e proxy de segurança.

### Passo a Passo para Deploy:

1. **Acessar o Render**:
   - Cadastre-se ou faça login em [Render.com](https://render.com) usando sua conta GitHub.

2. **Criar um Novo "Web Service"**:
   - No painel, clique em **"New +"** e escolha **"Web Service"**.
   - Conecte o mesmo repositório do GitHub.

3. **Configurações Específicas do Web Service**:
   - **Name**: `wafort-backend-api` (ou similar).
   - **Environment**: `Node`
   - **Region**: Selecione uma região próxima aos seus clientes (ex: `Ohio` ou `Frankfurt`).
   - **Root Directory**: `backend` (isso instruirá o Render a olhar unicamente para a nossa pasta dedicada de backend!).
   - **Build Command**: `npm install && npm run build` (isso irá instalar as dependências de backend e rodar o `tsc` para transformar TypeScript em JavaScript na pasta `dist`).
   - **Start Command**: `npm start` (executará o servidor transpilado `node dist/server.js`).

4. **Plano de Cobrança**:
   - Escolha o plano **"Free"** (gratuito) para testes corporativos ou os planos pagos para produção de alto desempenho.

5. **Implantar**:
   - Clique em **"Create Web Service"**.
   - Uma vez concluído, o Render disponibilizará sua URL de API HTTPS segura (ex: `https://wafort-backend-api.onrender.com`).

---

## 🔒 Segurança do Firebase no Client-Side
O **Firebase** foi construído e arquitetado pelo Google para ser integrado **diretamente no client-side de forma totalmente segura**. Não há perigo de expor a `apiKey` ou `appId` de seu Firebase no navegador, pois o Firebase protege a infraestrutura através de **Firestore Security Rules (Regras de Segurança)**.

Nossos dados de Ouvidoria estão fortificados pelas regras contidas no arquivo `firebase/firestore.rules` que você deve carregar no console do seu Firebase:

- **Denúncias Anônimas** só podem ser escritas (`create`). É impossível listar, ler ou modificar outros registros sem autorização devida.
- **Consultas de Rastreamento (`get`)** só permitem visualizar a denúncia específica se possuir o token de ID correspondente (ID de documento randômico e imprevisível de 20 caracteres).
- **Acesso Administrativo (`list` e `update`)** é de uso restrito do e-mail corporativo autenticado correspondente ao de administração.

Para implantar as regras de segurança no console do Firebase:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Vá em **Firestore Database** -> **Regras** (Rules).
3. Copie as regras do arquivo `firestore.rules` local e salve-as lá, depois clique em **"Publicar"**.
