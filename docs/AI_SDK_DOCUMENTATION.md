# INOX AI SDK - Documentação de Uso para IAs

## 🤖 O que é o INOX AI SDK?

O INOX AI SDK é uma biblioteca JavaScript/TypeScript projetada especificamente para que **agentes de IA** possam criar, editar e fazer deploy de jogos automaticamente através da plataforma INOX Game Creator.

## 🚀 Início Rápido

### Instalação

```bash
npm install @inoxgamecreator/ai-sdk
```

### Configuração Básica

```typescript
import { createInoxAiSdk } from '@inoxgamecreator/ai-sdk';

const sdk = createInoxAiSdk({
  apiKey: 'sua-api-key-aqui',
  baseUrl: 'https://api.inoxgamecreator.com',
});
```

## 📚 Uso Básico

### 1. Criar um Jogo Completo

A maneira mais simples de criar um jogo:

```typescript
const game = await sdk.createGameFromDescription(
  'Quero um jogo de plataforma 2D com um personagem que pula entre plataformas, coleta moedas e evita espinhos',
  {
    platform: 'web',
    genre: 'platformer',
    name: 'Meu Jogo de Plataforma',
  }
);

console.log('Projeto criado:', game.project);
console.log('Código gerado:', game.code);
```

### 2. Criar Projeto e Gerar Código Separadamente

Para mais controle sobre o processo:

```typescript
const project = await sdk.createProject({
  name: 'Sobrevivência na Ilha',
  description: 'Jogo de sobrevivência 3D em uma ilha tropical',
  platform: 'web',
  genre: 'survival',
  features: ['day-night cycle', 'crafting', 'exploration'],
});

const code = await sdk.generateCode({
  projectId: project.projectId,
  prompt: 'Cria um mapa de ilha de 2km² com floresta densa, montanha no centro, praia ao norte, e 3 cavernas no oeste',
  model: 'gpt-4',
});

console.log('Código:', code.code);
console.log('Assets:', code.assets);
console.log('Explicação:', code.explanation);
```

### 3. Modificar Código Existente

Para fazer alterações incrementais:

```typescript
const modified = await sdk.modifyCode({
  projectId: project.projectId,
  currentCode: code.code,
  modificationRequest: 'Adiciona uma ponte de madeira sobre o rio perto da praia',
});

console.log('Código modificado:', modified.modifiedCode);
console.log('Alterações:', modified.changes);
```

### 4. Chat com Assistente de IA

Para tirar dúvidas ou fazer perguntas específicas:

```typescript
const response = await sdk.chat({
  projectId: project.projectId,
  message: 'Como implemento um sistema de crafting no meu jogo?',
  conversationHistory: [
    { role: 'user', content: 'Quero adicionar crafting' },
    { role: 'assistant', content: 'Vou te ajudar...' },
  ],
});

console.log('Resposta:', response.response);
console.log('Snippets de código:', response.codeSnippets);
console.log('Ações sugeridas:', response.suggestedActions);
```

### 5. Upload de Assets

Para adicionar assets personalizados:

```typescript
const asset = await sdk.uploadAsset({
  projectId: project.projectId,
  file: playerSpriteFile,
  type: 'sprite',
  tags: ['player', 'character', 'animation'],
});

console.log('Asset URL:', asset.url);
console.log('Thumbnail:', asset.thumbnailUrl);
```

### 6. Deploy do Jogo

Para fazer deploy do jogo:

```typescript
const deploy = await sdk.deploy({
  projectId: project.projectId,
  platform: 'web',
  environment: 'production',
});

console.log('Build ID:', deploy.buildId);
console.log('Status:', deploy.status);
console.log('Tempo estimado:', deploy.estimatedTime);

const status = await sdk.waitForBuild(deploy.buildId);
console.log('URL do jogo:', status.deployUrl);
```

## 🎮 Exemplos Avançados

### Exemplo 1: Criar Jogo de Sobrevivência Completo

```typescript
async function createSurvivalGame() {
  const sdk = createInoxAiSdk({
    apiKey: process.env.INOX_API_KEY,
  });

  const game = await sdk.createGameFromDescription(
    `Jogo de sobrevivência em mundo aberto 3D onde um jogador está em uma ilha quando um meteoro atinge o centro.
    
    Características:
    - Mapa de 2km² com biomas variados (floresta, praia, montanha, cavernas)
    - Sistema de sobrevivência (fome, sede, energia, temperatura)
    - Dia/noite com ciclo de 24 minutos
    - Clima dinâmico (sol, nublado, chuva, tempestade)
    - Sistema de crafting básico (faca, machado, fogueira)
    - Inventário de 32 slots
    - Escola abandonada no oeste como ponto inicial
    - Vegetação densa de palmeiras
    - Rio principal com 2 cachoeiras
    - Sistema de save/load
    
    O jogo deve ser responsivo e funcionar em navegadores modernos.`,
    {
      platform: 'web',
      genre: 'survival',
      name: 'Survival Island',
    }
  );

  const deploy = await sdk.deploy({
    projectId: game.project.projectId,
    platform: 'web',
    environment: 'production',
  });

  const status = await sdk.waitForBuild(deploy.buildId);
  console.log('Jogo publicado em:', status.deployUrl);
  
  return status.deployUrl;
}

createSurvivalGame();
```

### Exemplo 2: Jogo de Plataforma Iterativo

```typescript
async function createPlatformerWithIteractions() {
  const sdk = createInoxAiSdk({
    apiKey: process.env.INOX_API_KEY,
  });

  const project = await sdk.createProject({
    name: 'Super Jump Adventure',
    description: 'Jogo de plataforma 2D colorido',
    platform: 'web',
    genre: 'platformer',
  });

  const baseCode = await sdk.generateCode({
    projectId: project.projectId,
    prompt: 'Cria um jogo de plataforma básico com personagem que pula, plataformas, e coleta de moedas',
  });

  const modified1 = await sdk.modifyCode({
    projectId: project.projectId,
    currentCode: baseCode.code,
    modificationRequest: 'Adiciona inimigos que patrulham as plataformas',
  });

  const modified2 = await sdk.modifyCode({
    projectId: project.projectId,
    currentCode: modified1.modifiedCode,
    modificationRequest: 'Cria power-ups que dão pulo duplo e velocidade temporária',
  });

  const modified3 = await sdk.modifyCode({
    projectId: project.projectId,
    currentCode: modified2.modifiedCode,
    modificationRequest: 'Adiciona 5 níveis diferentes com dificuldade progressiva',
  });

  const deploy = await sdk.deploy({
    projectId: project.projectId,
    platform: 'web',
  });

  const status = await sdk.waitForBuild(deploy.buildId);
  console.log('Jogo completo:', status.deployUrl);
}

createPlatformerWithIteractions();
```

### Exemplo 3: Jogo de Puzzle com Chat Assistido

```typescript
async function createPuzzleWithAIAssistance() {
  const sdk = createInoxAiSdk({
    apiKey: process.env.INOX_API_KEY,
  });

  const project = await sdk.createProject({
    name: 'Puzzle Master',
    description: 'Jogo de puzzle com 20 níveis',
    platform: 'web',
    genre: 'puzzle',
  });

  const code = await sdk.generateCode({
    projectId: project.projectId,
    prompt: 'Cria um jogo de puzzle com blocos que devem ser movidos para o lugar correto',
  });

  const question1 = await sdk.chat({
    projectId: project.projectId,
    message: 'Como implemento um sistema de pontuação que dá mais pontos por tempo menor?',
  });

  const question2 = await sdk.chat({
    projectId: project.projectId,
    message: 'Adiciona um timer regressivo para cada nível',
  });

  const finalCode = await sdk.modifyCode({
    projectId: project.projectId,
    currentCode: code.code,
    modificationRequest: 'Implementa os sistemas de pontuação e timer discutidos anteriormente',
  });

  const deploy = await sdk.deploy({
    projectId: project.projectId,
    platform: 'web',
  });

  const status = await sdk.waitForBuild(deploy.buildId);
  console.log('Puzzle Master:', status.deployUrl);
}

createPuzzleWithAIAssistance();
```

## 🔧 Referência da API

### Métodos do SDK

#### `createProject(config)`
Cria um novo projeto vazio.

**Parâmetros:**
- `name` (string, obrigatório): Nome do projeto
- `description` (string, opcional): Descrição do projeto
- `platform` ('web' | 'desktop' | 'mobile' | 'all', obrigatório): Plataforma alvo
- `genre` (string, opcional): Gênero do jogo
- `features` (string[], opcional): Lista de funcionalidades
- `aiPrompt` (string, opcional): Prompt inicial para IA
- `templateId` (string, opcional): ID do template base

**Retorna:** `Promise<ProjectResponse>`

#### `generateCode(request)`
Gera código de jogo via IA.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto
- `prompt` (string, obrigatório): Descrição do que gerar
- `model` (string, opcional): Modelo de IA ('gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet')
- `templateId` (string, opcional): ID do template

**Retorna:** `Promise<CodeGenerationResponse>`

#### `modifyCode(request)`
Modifica código existente via IA.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto
- `currentCode` (object, obrigatório): Código atual do projeto
- `modificationRequest` (string, obrigatório): Solicitação de modificação
- `filePath` (string, opcional): Caminho do arquivo específico

**Retorna:** `Promise<ModifyCodeResponse>`

#### `chat(request)`
Conversa com assistente de IA.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto
- `message` (string, obrigatório): Mensagem do usuário
- `conversationHistory` (array, opcional): Histórico da conversa

**Retorna:** `Promise<ChatResponse>`

#### `uploadAsset(request)`
Faz upload de asset.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto
- `file` (File, obrigatório): Arquivo para upload
- `type` (string, obrigatório): Tipo do asset ('sprite', 'model', 'sound', 'music', 'font', 'other')
- `tags` (string[], opcional): Tags para categorização

**Retorna:** `Promise<AssetUploadResponse>`

#### `deploy(request)`
Inicia deployment do projeto.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto
- `platform` ('web' | 'desktop' | 'mobile', obrigatório): Plataforma de deploy
- `buildConfig` (object, opcional): Configurações específicas do build
- `environment` ('development' | 'production', opcional): Ambiente

**Retorna:** `Promise<DeployResponse>`

#### `getBuildStatus(buildId)`
Obtém status do build.

**Parâmetros:**
- `buildId` (string, obrigatório): ID do build

**Retorna:** `Promise<BuildStatusResponse>`

#### `waitForBuild(buildId, pollInterval, maxAttempts)`
Aguarda até o build ser concluído.

**Parâmetros:**
- `buildId` (string, obrigatório): ID do build
- `pollInterval` (number, opcional): Intervalo de polling em ms (default: 2000)
- `maxAttempts` (number, opcional): Máximo de tentativas (default: 60)

**Retorna:** `Promise<BuildStatusResponse>`

#### `getProject(projectId)`
Obtém detalhes do projeto.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto

**Retorna:** `Promise<ProjectResponse>`

#### `deleteProject(projectId)`
Deleta um projeto.

**Parâmetros:**
- `projectId` (string, obrigatório): ID do projeto

**Retorna:** `Promise<{ success: boolean; message: string }>`

## ⚠️ Tratamento de Erros

```typescript
try {
  const game = await sdk.createGameFromDescription('Jogo incrível');
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Chave de API inválida');
  } else if (error.message.includes('quota')) {
    console.error('Limite de uso atingido');
  } else if (error.message.includes('timeout')) {
    console.error('Timeout na geração de código');
  } else {
    console.error('Erro desconhecido:', error.message);
  }
}
```

## 🔐 Autenticação

### Obter API Key

1. Vá para https://inoxgamecreator.com/developers
2. Faça login ou crie uma conta
3. Vá para "API Keys"
4. Clique em "Generate New Key"
5. Copie a chave

### Variáveis de Ambiente

```env
INOX_API_KEY=sk_live_xxxxxxxxxxxxxxxxx
INOX_BASE_URL=https://api.inoxgamecreator.com
```

## 📊 Exemplo Completo de IA Agent

```typescript
import { createInoxAiSdk } from '@inoxgamecreator/ai-sdk';

class GameCreatorAI {
  private sdk: ReturnType<typeof createInoxAiSdk>;

  constructor(apiKey: string) {
    this.sdk = createInoxAiSdk({ apiKey });
  }

  async createGameFromUserPrompt(userPrompt: string): Promise<string> {
    try {
      console.log('🎮 Criando jogo:', userPrompt);

      const game = await this.sdk.createGameFromDescription(userPrompt, {
        platform: 'web',
      });

      console.log('✅ Projeto criado:', game.project.name);

      const deploy = await this.sdk.deploy({
        projectId: game.project.projectId,
        platform: 'web',
      });

      console.log('🚀 Iniciando deploy...');

      const status = await this.sdk.waitForBuild(deploy.buildId);

      if (status.status === 'succeeded') {
        console.log('✨ Jogo publicado:', status.deployUrl);
        return status.deployUrl;
      } else {
        throw new Error('Deploy falhou');
      }
    } catch (error) {
      console.error('❌ Erro:', error.message);
      throw error;
    }
  }

  async iterativeGameCreation(initialPrompt: string, modifications: string[]): Promise<string> {
    try {
      const project = await this.sdk.createProject({
        name: 'AI Generated Game',
        description: initialPrompt,
        platform: 'web',
      });

      let currentCode = await this.sdk.generateCode({
        projectId: project.projectId,
        prompt: initialPrompt,
      });

      for (const mod of modifications) {
        console.log('🔄 Aplicando modificação:', mod);
        
        const result = await this.sdk.modifyCode({
          projectId: project.projectId,
          currentCode: currentCode.code,
          modificationRequest: mod,
        });

        currentCode = result.modifiedCode;
      }

      const deploy = await this.sdk.deploy({
        projectId: project.projectId,
        platform: 'web',
      });

      const status = await this.sdk.waitForBuild(deploy.buildId);
      return status.deployUrl;
    } catch (error) {
      console.error('❌ Erro:', error.message);
      throw error;
    }
  }
}

const ai = new GameCreatorAI(process.env.INOX_API_KEY);

const gameUrl = await ai.createGameFromUserPrompt(
  'Quero um jogo de corrida de carros em perspectiva top-down com 5 pistas diferentes'
);

console.log('Jogo criado:', gameUrl);
```

## 📈 Limites e Quotas

- **Plano Free**: 50 jogos por dia, 1000 tokens por hora
- **Plano Pro**: 500 jogos por dia, 10000 tokens por hora
- **Plano Enterprise**: Ilimitado, tokens sob consulta

## 🆘 Suporte

- **Documentação**: https://docs.inoxgamecreator.com
- **Email**: support@inoxgamecreator.com
- **Discord**: https://discord.gg/inox
- **Issues**: https://github.com/inoxgamecreator/sdk/issues

## 📄 Licença

MIT License - Veja o arquivo LICENSE para mais detalhes.
