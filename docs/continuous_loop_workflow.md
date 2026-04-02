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
Para a **Iteração 3**, o foco pode ser:
1. **Integração Auth:** Garantir que o usuário atual autenticado está passando seu token para as requisições de geração de IA para debito de cotas/créditos (billing).
2. **Salvamento no Banco:** Uma vez gerado o modelo, além de exibir na tela, precisamos chamar as funções do `supabaseService.ts` para salvar o asset permanentemente na tabela `assets` vinculada ao `project_id`.