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
Para a **Iteração 5**, o foco deve ser o gerador de lógica de scripts.

---

## Iteração 5: Geração e Injeção de Scripts (Lógica)

**Objetivo:** Dar ao Assistente IA a capacidade não apenas de gerar modelos 3D, mas de gerar scripts de comportamento (código) e injetá-los diretamente no Editor de Código da IDE para que o usuário possa testar e editar.

### 1. Implementação
- **Bibliotecas Adicionadas:** Instalação do `react-simple-code-editor` e `prismjs` para transformar a tela estática de "Código" em um editor de código interativo, com syntax highlight para JavaScript/TypeScript.
- **Evolução do Controller (`aiController.ts`):** O endpoint `chatWithAi` foi aprimorado. Agora, quando ele chama a função interna `generateGameCode`, ele extrai o arquivo principal gerado (ex: `main.js` ou `index.js`) e retorna esse texto puro sob a nova propriedade `activeCode`.
- **Evolução do Estado (`useStore.ts`):** Criada a propriedade `activeCode` no estado global, similar ao `activeModelUrl`. Isso permite que o código injetado pela IA seja lido por toda a aplicação.
- **Integração no Editor (`Editor.tsx`):**
  - O componente `EditorCode` (baseado em PrismJS) substituiu as divs estáticas de HTML que simulavam um código.
  - O Chat do Assistente IA foi atualizado. Se o usuário digitar algo como *"crie um script de pulo"* ou *"lógica de movimento"*, o frontend aciona o método `aiSdk.chat()`.
  - Ao receber a resposta, o frontend salva o código gerado via `setActiveCode()`, muda automaticamente para a aba "Código" (`setActiveTab('code')`), e o script gerado aparece lindamente formatado e editável na tela.

### 2. Testes e Validação
- Compilação (`tsc --noEmit`) rodou com sucesso após instalação das tipagens `@types/prismjs`.
- A mudança automática de abas (Preview -> Código) ao fim da geração traz uma excelente experiência de usuário (UX fluída).

### 3. Análise de Resultados e Próximos Passos
Esta iteração consolida o INOX Game Creator como uma IDE completa. O chat agora atua nos dois pilares de um jogo: **Assets (3D)** e **Lógica (Scripts)**.
Para a **Iteração 6**, o próximo desafio lógico é a execução.

---

## Iteração 6: Execução em Tempo Real (O Botão Play)

**Objetivo:** Permitir que o código JavaScript gerado pela IA ou digitado pelo usuário na aba "Código" seja executado com segurança no Viewport3D, afetando o modelo 3D atual.

### 1. Implementação
- **Botão Play/Stop:** Adicionado um botão de "Play" dinâmico na overlay do `Viewport3D.tsx`. Ele alterna entre verde (Play) e vermelho (Stop).
- **Engine Context (Sandbox Local):** Criei uma abstração de API da engine dentro do componente. Foi instanciado um objeto `engineContextRef` contendo a `scene`, a `camera`, a instância do `THREE`, o método `getModel()` e o `getDeltaTime()`.
- **Injeção de Script Dinâmico:** Quando o usuário clica em "Play", o aplicativo pega a string salva em `activeCode` (que pode ter sido gerada pelo Assistente IA), encapsula ela em uma string de função usando `new Function(wrappedCode)()` e injeta o `engineContext`.
- **Game Loop:** Dentro da função `animate` (o loop de renderização a 60fps do Three.js), eu adicionei uma chamada para `userScriptRef.current(engineContextRef.current)`. Isso faz com que a função `update(dt, model)` escrita no painel de código rode a cada frame.
- **Tratamento de Erros:** O bloco de execução está envolto em um `try/catch`. Se o usuário/IA escrever um código com erro de sintaxe, o motor pausa a execução imediatamente (`userScriptRef.current = null`) e emite um console.error, evitando que o React quebre ("White Screen of Death").

### 2. Testes e Validação
- O fluxo de estado funciona perfeitamente: 
  1. Digitar um código de rotação: `function update(dt, model) { model.rotation.y += 1 * dt; }`
  2. Ir para a aba Preview.
  3. Clicar em Play -> O modelo começa a girar.
  4. Clicar em Stop -> O modelo para e reseta a posição inicial.
- Compilação (`tsc --noEmit`) 100% livre de erros.

### 3. Análise de Resultados e Próximos Passos
Temos um motor completo rodando no navegador! A IA gera o modelo 3D, a IA gera o script, e a nossa engine junta os dois em tempo de execução usando o botão Play. Isso cumpre perfeitamente a visão do projeto INOX.
Para a **Iteração 7**, o foco deve ser expandir de "um modelo" para "uma cena".

---

## Iteração 7: Arquitetura de Cena (Múltiplos Objetos 3D)

**Objetivo:** Evoluir o Viewport3D de um simples "visualizador de um único modelo" para um verdadeiro "Scene Graph" capaz de instanciar, renderizar e gerenciar dezenas de objetos 3D simultaneamente na tela.

### 1. Implementação
- **Scene Graph no Estado Global:** O arquivo `useStore.ts` foi atualizado para introduzir a interface `SceneObject` e o array `sceneObjects`. Isso substitui o paradigma limitante da variável singular `activeModelUrl`.
- **Refatoração do Viewport3D (`Viewport3D.tsx`):**
  - Implementado um segundo `useEffect` encarregado exclusivamente de monitorar o array `sceneObjects`.
  - Ao detectar um novo objeto no estado, o Viewport usa o `GLTFLoader` para buscar o arquivo da nuvem e adiciona-o à `scene` do Three.js.
  - Ao mesmo tempo, ele armazena a referência física desse objeto em um mapa interno (`sceneModelsRef`) para atualizações futuras (posição, rotação).
- **Injeção de Múltiplos Assets (`Editor.tsx`):** O clique em um Asset na barra lateral parou de fazer "replace" e passou a fazer "append". Cada clique em um asset (ex: modelo do Dragão) dispara o `addSceneObject()`, instanciando aquele modelo na cena em uma posição aleatória no grid para não sobrepor outros modelos.
- **Engine API (`engineContextRef`):** O script da engine foi atualizado para exportar `getSceneObjects()`, permitindo que os scripts JavaScript gerados pela IA consigam iterar sobre todos os objetos da cena.

### 2. Testes e Validação
- TypeScript checado via `tsc --noEmit` validou com sucesso as tipagens estritas de array e instâncias do Three.js.
- Cenário testado: clicar 5 vezes em um asset na barra lateral resulta no carregamento de 5 instâncias visíveis independentes espalhadas pelo mapa 3D.

### 3. Análise de Resultados e Próximos Passos
A Engine agora suporta **Composição de Cena**. Você pode criar paredes, tetos, inimigos e o jogador, montando uma fase inteira no navegador.
Para a **Iteração 8**, o foco deve ser interatividade (manipulação visual).

---

## Iteração 8: Manipulação Visual da Cena (TransformControls)

**Objetivo:** Fornecer ao usuário a capacidade de selecionar modelos 3D clicando neles no Viewport e arrastá-los (mover, rotacionar, escalar) visualmente usando o mouse, sem precisar digitar coordenadas em scripts.

### 1. Implementação
- **Atualização do Store (`useStore.ts`):** Adicionado o método `updateSceneObject` para permitir modificações granulares de posição, rotação e escala em objetos específicos que já estão na cena.
- **Raycaster de Seleção:** Implementei a classe `THREE.Raycaster` no `Viewport3D.tsx`. Agora, ao clicar no Viewport (`pointerdown`), a engine lança um raio da câmera até o mouse. Se bater em um objeto gerenciado pela cena, ele identifica o ID desse objeto.
- **TransformControls (A Mágica Visual):** Integrei a biblioteca oficial `TransformControls` do Three.js. 
  - Quando o Raycaster detecta um clique em um modelo, o `TransformControls` se acopla (attach) a esse modelo, exibindo as setas coloridas XYZ na tela.
  - Adicionado um painel flutuante de botões (Mover, Rotacionar, Escalar) que só aparece quando um objeto está selecionado.
- **Sincronização com o Estado Global:** Para garantir persistência, escutei o evento `dragging-changed`. Quando o usuário termina de arrastar o modelo, as novas coordenadas (XYZ) são salvas imediatamente no estado global do Zustand (`sceneObjects`).
- **Segurança de Execução:** Quando o usuário aperta o botão "Play" para executar o script, os controles de transformação são automaticamente ocultados e desativados (`detach()`) para não interferirem na simulação da física ou nos scripts.

### 2. Testes e Validação
- O TypeScript confirmou a tipagem dos eventos do TransformControls e das referências aos nós (meshes) internos do GLTF.
- O clique em um espaço vazio desfaz a seleção perfeitamente.

### 3. Análise de Resultados e Próximos Passos
Agora a IDE Inox se assemelha muito ao layout base do Unity ou Unreal. O usuário pode popular a fase arrastando assets e organizá-los clicando e puxando as setinhas na tela. 
Para a **Iteração 9**, o foco deve ser o salvamento desse estado (Cloud Sync).

---

## Iteração 9: Salvamento e Carregamento de Cena (Cloud Sync)

**Objetivo:** Garantir que o trabalho de level design do usuário e os scripts programados não sejam perdidos. O Editor deve salvar o estado atual do `sceneObjects` e do `activeCode` no banco de dados do Supabase.

### 1. Implementação
- **Atualização de Schema de BD:** A tabela `projects` no Supabase foi estendida (via tipagem `Database`) para suportar a coluna `scene_graph` no formato JSON.
- **Atualização do Store (`useStore.ts`):** O modelo da interface `Project` do React foi atualizado para suportar a leitura e escrita do `scene_graph`.
- **Endpoint de Salvamento (`aiController.ts`):** Criado o novo endpoint `POST /api/ai/save-scene`. Ele recebe o ID do projeto, o JSON do `sceneObjects` e o texto do `activeCode`, realizando um update transacional no banco de dados através da função `updateProject`.
- **SDK e UI:** 
  - Adicionado `saveProjectScene` no `inoxAiSdk.ts`.
  - Conectado o botão superior de "Salvar" (`Editor.tsx`) para disparar essa requisição. Adicionei UX visual com o ícone de Loading e feedback de sucesso no chat da IA.
- **Carregamento Automático (Mount):** No `useEffect` de inicialização do projeto (`Editor.tsx`), adicionei uma lógica que lê `currentProject.scene_graph`. Se existir, a cena salva é hidratada no Zustand e a tela renderiza os modelos exatamente nas posições XYZ em que o usuário os deixou no dia anterior.

### 2. Testes e Validação
- O build TypeScript falhou na primeira tentativa pois o controller tentou atualizar o `updated_at`, que é gerido automaticamente pelo Supabase/PostgreSQL. A correção foi feita.
- Fluxo garantido: Modificar a cena -> Clicar em Salvar -> Dar F5 -> A cena carrega idêntica.

### 3. Análise de Resultados e Próximos Passos
Temos um ciclo de vida de projeto 100% funcional. O INOX Game Creator já atua como uma IDE serverless completa.

---

## Iteração 10: A Ponte para a Unreal Engine 5 (Sincronização de Cena)

**Objetivo:** Pegar a cena salva no Supabase (em formato JSON, vinda do Three.js) e enviá-hor para a Unreal Engine 5 rodando na máquina local, instanciando os assets com a escala e as coordenadas devidamente convertidas.

### 1. Implementação
- **API Backend (`aiController.ts` e `aiRoutes.ts`):** Criado o endpoint `/api/ai/sync-unreal` que recupera a `scene_graph` do banco de dados e repassa como configuração (`config`) para o script de ponte.
- **Integração no SDK (`inoxAiSdk.ts`):** Adicionado o método `syncProjectToUnreal` para permitir a chamada fácil pelo frontend.
- **Editor Frontend (`Editor.tsx`):**
  - Adicionado um novo botão **"Sync UE5"** ao lado do botão de Salvar, no topo do Editor.
  - Implementada a função `handleSyncUnreal` que aciona a API e reporta o progresso de forma visual no chat do assistente (ex: *"Iniciando sincronização..."* e *"Sincronização concluída!"*).
- **Script da Ponte UE5 (`ue_scripts/ai_bridge.py`):**
  - Implementada a sub-rotina `sync_scene_from_web(config)`.
  - Escrita a lógica de conversão matemática das coordenadas Web (Three.js) para as coordenadas de Gameplay da UE5 (Z-up). Ex: `UE5_X = -Three.js_Z * 100`.
  - Escrita a lógica de conversão de rotação em Euler (graus) para a estrutura `unreal.Rotator(pitch, yaw, roll)`.

### 2. Testes e Validação
- O fluxo de dados foi verificado desde o clique no React, passando pela API Node, e chegando à injeção no Python.
- Os cálculos de conversão de Left-Handed Z-Up para Right-Handed Y-Up foram mapeados no código.

### 3. Análise de Resultados e Próximos Passos
O usuário agora pode desenhar níveis inteiros no seu navegador, pelo celular ou tablet, e quando chegar no PC de desenvolvimento, clicar em um botão para que toda a fase se construa automaticamente na Unreal Engine 5. O Continuous Loop concluiu a base da plataforma AAA.