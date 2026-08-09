# Espaço Elaine Vaz — App de Agendamento

Monorepo com o app de agendamento do salão: web (React) e mobile (React Native),
compartilhando dados e regras de negócio pela pasta `shared/`.

## Estrutura

```
elaine-vaz-agendamento/
├── shared/              # dados e helpers usados por web e mobile
│   ├── firebaseConfig.js
│   ├── services.js      # lista de serviços (bronzeamento etc.)
│   └── whatsapp.js       # gera o link de confirmação
├── web/                 # app React (Vite)
│   └── src/
│       ├── firebase.js
│       ├── hooks/useAuth.js      # login Google (web)
│       ├── hooks/useBooking.js   # criar agendamento / checar horários ocupados
│       └── App.jsx               # wiring do fluxo (ver protótipo visual)
├── mobile/               # app React Native
│   ├── firebase.js
│   └── hooks/useAuth.js  # login Google nativo
├── functions/            # Cloud Functions
│   └── index.js          # gatilho ao criar agendamento
└── firestore.rules       # regras de segurança
```

## Coleções no Firestore

- `usuarios/{uid}` — nome, email, fotoUrl
- `servicos/{id}` — nome, duração, profissional (sem valor — combinado direto com a Carol)
- `agendamentos/{id}` — usuarioId, servicoId, dataKey, horario, status (`pendente` | `confirmado` | `cancelado`)

## Passo a passo para colocar no ar

1. **Criar o projeto no Firebase Console** e ativar:
   - Authentication → método Google
   - Firestore Database (modo produção)
   - Cloud Functions (plano Blaze, necessário para functions)

2. **Web (local)**: copiar `web/.env.example` para `web/.env` e preencher com as chaves do Firebase. Rodar `npm install && npm run dev` dentro de `web/`.

3. **Web (Vercel)**: como este é um monorepo, o **Root Directory** do projeto na Vercel precisa apontar para `web` (Project Settings → Build and Deployment → Root Directory). Sem isso, a Vercel tenta buildar a partir da raiz — que não tem `package.json` nem `index.html` — e o deploy fica em 404. Framework Preset: **Vite**. Também é preciso cadastrar as mesmas variáveis do `.env` em Project Settings → Environment Variables (com o prefixo `VITE_`).

4. **Mobile**: baixar `google-services.json` (Android) e `GoogleService-Info.plist` (iOS) do Firebase Console e colocar nas pastas nativas do projeto React Native. Configurar o `webClientId` do Google Sign-In (também vem do Firebase Console).

5. **Publicar as regras**: `firebase deploy --only firestore:rules`

6. **Publicar as functions**: `cd functions && npm install && firebase deploy --only functions`

## Próximos passos sugeridos

- Portar a UI (já validada e conectada no `web/src/App.jsx`) para as telas do mobile em `mobile/screens/`, reaproveitando a mesma lógica dos hooks.
- Decidir se a confirmação continua manual (link `wa.me`) ou se em algum momento vale automatizar com a API oficial do WhatsApp (Twilio ou Meta Cloud API) — o ponto de extensão já está marcado em `functions/index.js`.
- Cadastrar os serviços também como documentos em `servicos/` no Firestore (hoje estão fixos em `shared/services.js`), caso a Elaine/Carol queiram editar sem precisar de deploy.
