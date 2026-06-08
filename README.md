# Wafort Integridade — Canal de Transparência & Ética

Sistema de Ouvidoria e Compliance para colaboradores da Wafort enviarem críticas, sugestões e denúncias anônimas em ambiente seguro.

## Estrutura do Projeto

```
/
├── src/               # Frontend React + Vite + Tailwind (Vercel)
├── backend/           # Backend Express + TypeScript (Render)
├── firebase/          # Configurações e regras do Firebase
│   ├── firestore.rules
│   ├── firebase-blueprint.json
│   └── metadata.json
├── docs/              # Documentação
│   ├── DEPLOYS.md
│   └── security_spec.md
├── index.html
├── package.json
├── vite.config.ts
├── vercel.json
└── tsconfig.json
```

## Deploy

- **Frontend:** Vercel (raiz do projeto)
- **Backend:** Render (pasta `backend/`)

Consulte `docs/DEPLOYS.md` para instruções detalhadas.
