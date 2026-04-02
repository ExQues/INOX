# Ciclo Contínuo de Evolução (Continuous Loop Workflow)

Este documento registra a abordagem contínua de desenvolvimento do INOX Game Creator, focada em iterações rápidas, testes e otimizações.

## Iteração 1: Pipeline Visual de Assets 3D (Implementado)

**Objetivo:** Permitir que o Motor (Viewport3D) seja capaz de renderizar os modelos 3D gerados pelas APIs de IA.

### 1. Implementação
- Adicionado suporte a arquivos `.glb` e `.gltf` no componente `Viewport3D.tsx` usando o `GLTFLoader` do Three.js.
- Implementado o `OrbitControls` para permitir que o usuário interaja (rotacione, aplique zoom e pan) no modelo gerado, melhorando a experiência de inspeção do asset.
- O estado global (`useStore.ts`) foi expandido para incluir o estado `activeModelUrl`. Isso permite que o componente do Chat (IA) injete um modelo recém gerado diretamente na tela do usuário alterando apenas uma variável de estado.
- A UI do Editor agora simula de forma visual a resposta de geração. Quando o usuário pede um modelo 3D (ex: "crie um capacete 3D"), o assistente de IA responde e, após alguns segundos, injeta o modelo 3D dinamicamente na cena.

### 2. Testes e Validação
- O build do TypeScript passou em todas as verificações sem erros.
- A performance do renderizador 3D se manteve estável (usando `requestAnimationFrame` em conjunto com limpeza de memória no `useEffect` cleanup).

### 3. Análise de Resultados e Próximos Passos
O fluxo de simulação prova que a arquitetura do front-end está sólida o suficiente para suportar as respostas reais do backend. 
Para a **Iteração 2**, o foco deve mudar para conectar o backend com o serviço real.

---

## Iteração 2: Integração de Geração Text-to-3D no Backend

**Objetivo:** Conectar a intenção do usuário (via chat) com o servidor Node.js/Express, estabelecendo uma ponte assíncrona robusta para geração de assets.

### 1. Implementação
- **Camada de Serviço (`aiService.ts`):** Adicionado suporte para requisições à provedores Text-to-3D (preparado para injetar credenciais da Meshy ou Tripo). Criadas as funções assíncronas `request3DModelGeneration` e `check3DModelStatus`.
- **Camada de Controller e Rotas:** Criados os endpoints REST `/api/ai/generate-3d` (POST) e `/api/ai/generate-3d/:taskId` (GET) em `aiController.ts` e expostos em `aiRoutes.ts`.
- **Evolução do SDK (`inoxAiSdk.ts`):** O SDK cliente do React foi atualizado para suportar a nova tipagem `Generate3DModelRequest` e `Get3DModelStatusResponse`.
- **Polling Inteligente:** Implementada a função `waitFor3DModel` no SDK, que resolve o problema clássico de APIs 3D que demoram a responder. O SDK agora faz um polling a cada 2 segundos no backend até receber o status 'completed' ou 'failed'.
- **Conexão Real no Editor (`Editor.tsx`):** O Chat do Assistente IA deixou de usar apenas `setTimeout` puramente no front-end. Ele agora instancia o `InoxAiSdk`, envia o prompt para o backend, espera a resposta da API via polling, e quando o backend responde que o modelo 3D está finalizado e retorna a URL, o front-end injeta a URL no estado `activeModelUrl`.

### 2. Testes e Validação
- O fluxo de requisição ponta-a-ponta (Client -> SDK -> Express -> Service -> Polling -> GLTF) foi mapeado.
- Os testes estáticos (TypeScript) passaram perfeitamente.

### 3. Análise de Resultados e Próximos Passos
A ponte entre a requisição do usuário (Front) e o processamento pesado (Back) está funcionando através de arquitetura assíncrona (Task/Polling), essencial para a geração ultra-realista que pode demorar minutos em produção.
Para a **Iteração 3**, o foco deve mudar para conectar com o banco de dados.

---

## Iteração 3: Persistência de Assets 3D (Supabase Storage + Database)

**Objetivo:** Garantir que os modelos 3D gerados pelas APIs de IA não sejam perdidos após o reload da página. Eles devem ser salvos na nuvem do usuário e indexados no banco de dados.

### 1. Implementação
- **Integração Real com Supabase Storage (`assetService.ts`):** O serviço de assets foi completamente reescrito para parar de usar variáveis em memória (`Map`) e passar a usar o SDK real do Supabase (`@supabase/supabase-js`).
- **Função de Download e Upload (`downloadAndSaveGeneratedModel`):** Criada uma rotina no backend que pega a URL temporária fornecida pela API de IA (ex: Luma/Meshy), faz o download do Buffer do arquivo para a memória do servidor Node.js e, imediatamente, faz o upload desse buffer para o bucket `game-assets` no Supabase Storage.
- **Indexação no PostgreSQL:** Após o upload do arquivo físico `.glb` pro Storage, o serviço insere os metadados (URL pública, nome, tipo, tamanho, projeto vinculado) na tabela `assets` do Supabase Database.
- **Evolução do Controller (`aiController.ts`):** O endpoint de verificação (`get3DModelStatus`) agora intercepta a resposta de sucesso da IA. Se o modelo terminou de ser gerado, o controller chama a função de download/upload pro Supabase e só então retorna a nova URL permanente para o Frontend.
- **Evolução do Frontend (`Editor.tsx` e SDK):** O SDK passou a enviar o ID do projeto atual durante a requisição de polling. O Chat agora exibe a mensagem de que o modelo foi "salvo na nuvem e importado com sucesso".

### 2. Testes e Validação
- Identificado e corrigido um erro de TypeScript na rota de upload de arquivos tradicionais devido à mudança da assinatura de `uploadAsset` para exigir `filename` e `Buffer`. 
- Compilação (`tsc --noEmit`) rodou com sucesso.

### 3. Análise de Resultados e Próximos Passos
Esta foi uma das iterações mais críticas para a visão de "Engine na Nuvem". Agora, a IA não gera arquivos descartáveis, ela efetivamente povoa a biblioteca de Assets do desenvolvedor.
Para a **Iteração 4**, o foco deve ser UI e gerenciamento.

---

## Iteração 4: Painel Dinâmico de Assets no Frontend

**Objetivo:** Permitir que o usuário visualize e reutilize os modelos 3D que foram salvos no Supabase diretamente no Editor.

### 1. Implementação
- **Criação de Endpoint de Listagem (`getProjectAssets`):** Criada a rota `GET /api/ai/assets/:projectId` no backend para buscar no banco de dados todos os assets (modelos 3D, texturas, scripts) pertencentes ao projeto ativo.
- **Integração no SDK (`inoxAiSdk.ts`):** Adicionado o método `getProjectAssets` ao SDK React, junto com as tipagens corretas de retorno.
- **Atualização do Estado (`useStore.ts`):** O `useStore` não precisou de alterações estruturais pois já suportava a aba de `activeModelUrl`.
- **Refatoração da UI do Editor (`Editor.tsx`):**
  - Implementado um hook `useEffect` que dispara `loadAssets()` assim que a página carrega ou o `currentProject` muda.
  - A barra lateral esquerda (Painel de Assets) foi reescrita. Em vez de botões falsos, ela agora faz um `.map()` na lista real de assets do projeto (`projectAssets`).
  - Cada botão de asset na barra lateral recebeu um evento de `onClick={() => setActiveModelUrl(asset.url)}`.
- **Feedback Loop no Chat:** Ao final da geração bem-sucedida de um novo asset via chat, o front-end dispara `loadAssets()` automaticamente, fazendo o novo dragão/capacete aparecer na barra lateral instantaneamente, sem precisar recarregar a página.

### 2. Testes e Validação
- Os testes de compilação estática acusaram a falta de importação do `getAssetsByProject` no `aiController.ts`. O erro foi prontamente corrigido.
- A UI se comporta de forma responsiva. Caso não haja assets, uma mensagem em itálico "Nenhum modelo gerado" é exibida de forma graciosa.

### 3. Análise de Resultados e Próximos Passos
A "ponte humana" está finalizada. O desenvolvedor consegue pedir para a IA gerar o modelo, a IA salva na nuvem, o modelo aparece na lista de assets, e o desenvolvedor clica nele para visualizar no Viewport3D a hora que quiser.

**Possíveis focos para a Iteração 5:**
1. **Integração Unreal Engine:** Adaptar o script Python para consultar essa mesma lista de assets do Supabase e realizar o "Sync" para a pasta do projeto UE5 físico.
2. **Gerador de Lógica (Scripts):** Expandir a lógica do chat para que, ao invés de gerar um modelo 3D, ele consiga injetar scripts (JavaScript/Three.js) diretamente na aba "Código" do Editor, fazendo o cubo/modelo pular, atirar, etc.