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

2. **Web**: copiar as chaves do Firebase para `.env` (mesmas variáveis usadas em `shared/firebaseConfig.js`), rodar `npm install && npm run dev` dentro de `web/`.

3. **Mobile**: baixar `google-services.json` (Android) e `GoogleService-Info.plist` (iOS) do Firebase Console e colocar nas pastas nativas do projeto React Native. Configurar o `webClientId` do Google Sign-In (também vem do Firebase Console).

4. **Publicar as regras**: `firebase deploy --only firestore:rules`

5. **Publicar as functions**: `cd functions && npm install && firebase deploy --only functions`

## Próximos passos sugeridos

- Portar a UI validada no protótipo (`agendamento-elaine-vaz.jsx`) para os componentes em `web/src/screens/` e `mobile/screens/`, conectando aos hooks já prontos.
- Decidir se a confirmação continua manual (link `wa.me`) ou se em algum momento vale automatizar com a API oficial do WhatsApp (Twilio ou Meta Cloud API) — o ponto de extensão já está marcado em `functions/index.js`.
- Cadastrar os serviços também como documentos em `servicos/` no Firestore (hoje estão fixos em `shared/services.js`), caso a Elaine/Carol queiram editar sem precisar de deploy.
