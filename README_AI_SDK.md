# INOX Game Creator - AI SDK

🤖 **Ferramenta completa para que IAs criem jogos automaticamente!**

## 🚀 O que é isso?

O INOX AI SDK é uma plataforma onde **qualquer IA** (ou humano) pode criar, editar e publicar jogos apenas descrevendo o que quer em linguagem natural!

### ✨ Funcionalidades Principais

- 🎮 **Criação Automática**: Descreva o jogo e a IA gera código completo
- 🔄 **Modificação Iterativa**: Faça alterações progressivas sem precisar recriar
- 💬 **Chat com IA**: Tire dúvidas e receba sugestões de código
- 📦 **Upload de Assets**: Adicione sprites, sons, modelos 3D
- 🚀 **Deploy em 1 Clique**: Publique jogos web, desktop ou mobile
- ⚡ **Preview em Tempo Real**: Veja o jogo sendo criado enquanto a IA trabalha

## 🎯 Exemplos de Uso

### Exemplo 1: Criar Jogo Completo em uma Linha

```bash
node examples/openai-ai-agent.ts
```

A IA vai:
1. Criar o projeto automaticamente
2. Gerar todo o código do jogo
3. Fazer deploy
4. Fornecer a URL do jogo publicado

### Exemplo 2: Jogo Iterativo com Múltiplas Modificações

```bash
node examples/claude-ai-agent.ts
```

A IA vai:
1. Criar o projeto
2. Gerar código base
3. Adicionar power-ups
4. Adicionar inimigos
5. Criar 5 níveis
6. Fazer deploy

### Exemplo 3: Usar SDK no Seu Próprio Agente

```typescript
import { createInoxAiSdk } from './src/lib/ai-sdk/inoxAiSdk';

const sdk = createInoxAiSdk({
  apiKey: process.env.INOX_API_KEY,
});

const game = await sdk.createGameFromDescription(
  'Quero um jogo de corrida de carros com 5 pistas, power-ups e multiplayer'
);

const status = await sdk.waitForBuild(game.projectId);
console.log('Jogo:', status.deployUrl);
```

## 📖 Documentação Completa

Consulte `docs/AI_SDK_DOCUMENTATION.md` para:
- API completa do SDK
- Exemplos avançados
- Tratamento de erros
- Limites e quotas
- Suporte

## 🏃 Como Começar

### 1. Instalação

```bash
npm install
```

### 2. Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
INOX_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxx
```

### 3. Obter API Keys

1. Vá para https://inoxgamecreator.com/developers
2. Faça login ou crie uma conta
3. Vá para "API Keys"
4. Crie uma nova chave
5. Copie para o arquivo `.env`

### 4. Executar Exemplos

```bash
node examples/openai-ai-agent.ts
```

```bash
node examples/claude-ai-agent.ts
```

## 🎨 O Que Você Pode Criar

### Jogos de Plataforma 2D
```typescript
await sdk.createGameFromDescription(
  'Jogo de plataforma 2D com personagem que pula, coleta moedas e derrotar inimigos'
);
```

### Jogos de Sobrevivência 3D
```typescript
await sdk.createGameFromDescription(
  `Sobrevivência em mundo aberto 3D em uma ilha de 2km² com:
  - Sistema de dia/noite
  - Clima dinâmico
  - Crafting e coleta de recursos
  - Biomas variados (floresta, praia, montanha, cavernas)
  - Vegetação densa de palmeiras
  - Rio com cachoeiras`
);
```

### Jogos de Puzzle
```typescript
await sdk.createGameFromDescription(
  'Jogo de puzzle com 20 níveis progressivos, timer e sistema de estrelas'
);
```

### Jogos de RPG
```typescript
await sdk.createGameFromDescription(
  'RPG em perspectiva top-down com inventário, combate por turnos e sistema de diálogos'
);
```

### Qualquer Ideia!
A IA entende descrição em linguagem natural e cria o código automaticamente!

## 🔧 Tecnologias Utilizadas

### Frontend
- **React 18** + TypeScript
- **Vite 6** - Build tool ultra-rápido
- **TailwindCSS** - Styling moderno
- **Zustand** - State management
- **Monaco Editor** - Editor de código (mesmo do VS Code)
- **Radix UI** - Componentes acessíveis
- **Framer Motion** - Animações suaves

### Backend
- **Express.js** - API server
- **Supabase** - Database + Auth + Storage
- **OpenAI SDK** - GPT-4 integration
- **Anthropic SDK** - Claude 3 integration

### Game Tech
- **Three.js** - 3D rendering
- **React Three Fiber** - React + Three.js
- **Canvas API** - 2D rendering
- **WebGL** - High-performance graphics

## 📂 Estrutura do Projeto

```
INOX/
├── src/                        # Código frontend
│   ├── lib/
│   │   └── ai-sdk/          # SDK para IAs
│   │       └── inoxAiSdk.ts
│   ├── components/               # Componentes React
│   ├── pages/                   # Páginas do app
│   └── main.tsx                # Entry point
├── api/                        # Backend Express
│   ├── services/                # Serviços de negócio
│   │   ├── aiService.ts
│   │   ├── projectService.ts
│   │   ├── assetService.ts
│   │   └── deployService.ts
│   ├── routes/                  # Rotas da API
│   │   ├── aiRoutes.ts
│   │   └── authRoutes.ts
│   └── app.ts                  # App Express
├── examples/                    # Exemplos de uso
│   ├── openai-ai-agent.ts
│   └── claude-ai-agent.ts
├── docs/                        # Documentação
│   └── AI_SDK_DOCUMENTATION.md
└── README_AI_SDK.md            # Este arquivo
```

## 🚀 Como Fazer Deploy

### Desenvolvimento Local

```bash
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:3000

### Deploy em Produção

```bash
npm run build
```

O build otimizado será gerado em `dist/`.

## 📊 Monitoramento e Logs

### Logs da API
```bash
npm run dev
```

Você verá logs de:
- Requisições da API
- Gerações de código
- Status de builds
- Erros e warnings

### Logs do SDK
Use `console.log` nos seus agentes de IA para debug:

```typescript
console.log('🎮 Criando jogo:', prompt);
console.log('✅ Código gerado:', code);
console.log('🚀 Iniciando deploy...');
```

## 🤝 Contribuindo

Aceitamos contribuições! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para o fork
5. Abra um Pull Request

## 📄 Licença

MIT License - Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

- **Documentação**: https://docs.inoxgamecreator.com
- **GitHub Issues**: https://github.com/inoxgamecreator/inox-ai-sdk/issues
- **Email**: support@inoxgamecreator.com
- **Discord**: https://discord.gg/inox

## 🎓 Recursos de Aprendizado

- [Documentação do SDK](docs/AI_SDK_DOCUMENTATION.md)
- [Exemplos de Agentes](examples/)
- [API Reference](https://api.inoxgamecreator.com/docs)
- [Guia de Melhores Práticas](https://docs.inoxgamecreator.com/best-practices)

## ✨ O Que Diferencia Este Projeto

### 1. API Dedicada para IAs
- Endpoints otimizados para chamadas programáticas
- Suporte a múltiplas IAs simultâneas
- Rate limiting permissivo para IAs

### 2. SDK TypeScript Tipado
- Autocompleto em IDEs
- Type safety completo
- Exemplos detalhados

### 3. Integração com Múltiplos LLMs
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Extensível para novos provedores

### 4. Workflow Completo
- Criar → Modificar → Deploy
- Tudo em uma única plataforma
- Preview em tempo real

### 5. Exemplos Reais
- Agentes completos funcionais
- Cenários de uso real
- Código production-ready

## 🎯 Próximos Passos

Após configurar, você pode:

1. **Usar os exemplos** - Execute os agentes de exemplo
2. **Criar seu próprio agente** - Use o SDK
3. **Integrar com sua IA** - Chame os endpoints via HTTP
4. **Publicar jogos** - Use o sistema de deploy automático

---

**Criado com ❤️ para revolucionar o desenvolvimento de jogos com IA**

🚀 **Comece a criar jogos agora mesmo!**
