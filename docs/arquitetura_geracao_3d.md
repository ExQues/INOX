# Arquitetura Técnica: Geração de Assets 3D via IA

Este documento detalha o pipeline arquitetônico para integrar a geração de assets 3D ultra-realistas (personagens, ambientes, itens) diretamente no INOX Game Creator, permitindo que o usuário crie jogos AAA apenas conversando com a IA.

## Visão Geral do Pipeline

O objetivo é que o usuário não precise sair do INOX Game Creator (nem abrir Blender, Maya, ou ZBrush). O assistente de IA interpretará o prompt, decidirá o que precisa ser criado, acionará uma API especializada em Text-to-3D/Image-to-3D, fará o download do modelo, e o injetará na cena do Editor (Three.js) e na Unreal Engine.

### 1. O Motor de IA de Texto/Lógica (O "Cérebro")
Continuaremos usando **GPT-4** ou **Claude 3.5 Sonnet** como o maestro. 
Quando o usuário digita: *"Crie um dragão de fogo realista com escamas vermelhas para ser o boss da fase"*
O LLM (Cérebro) vai:
1. Criar o script de comportamento do Boss (C++ / JS).
2. Gerar um prompt otimizado para o modelo de geração 3D. Ex: `"A highly detailed 3D model of a fierce fire dragon, red scales, fantasy creature, 4k resolution, unreal engine 5 render style, photorealistic"`.
3. Disparar uma chamada para a nossa API de Geração 3D.

### 2. O Motor de Geração 3D (A "Fábrica")
Para gerar assets ultra-realistas em tempo de execução, integraremos uma API de terceiros especializada em 3D. As melhores opções para o INOX são:
- **Meshy API**: Excelente para gerar texturas PBR (Physically Based Rendering) e topologias prontas para jogos.
- **Tripo3D API**: Extrema velocidade (gera modelos em menos de 10 segundos), ideal para manter o fluxo da conversa no chat sem que o usuário fique esperando minutos.
- **Luma AI / CSM**: Para objetos digitalizados ou conversão de imagens de referência do usuário em 3D.

**Fluxo Técnico:**
1. O Backend do INOX (`aiService.ts`) envia o prompt para a API da Meshy/Tripo.
2. A API retorna um `task_id`.
3. O Backend faz polling (ou recebe um webhook) até o modelo `.glb` ou `.fbx` estar pronto.
4. O modelo é baixado e salvo no **Supabase Storage** da conta do usuário.

### 3. Integração no Frontend (O "Palco")
Uma vez que o asset está no Supabase:
1. O chat da IA responde: *"O modelo do Dragão de Fogo foi criado e adicionado aos seus assets."*
2. O Editor (`Viewport3D.tsx`) usa o `GLTFLoader` do Three.js para carregar a URL do modelo e instanciá-lo instantaneamente na cena Web.
3. O painel de Assets na lateral esquerda é atualizado com a thumbnail do dragão.

### 4. A Ponte AAA (A "Magia Negra")
Para o nível Rockstar (AAA):
1. O usuário aperta o botão "Sincronizar com Unreal Engine".
2. O INOX dispara o script `ue_scripts/ai_bridge.py`.
3. O script baixa o arquivo `.glb` gerado pela IA.
4. Usando a API Python da Unreal Engine, o modelo é importado, os materiais PBR são mapeados automaticamente para o sistema de materiais da UE5 (usando Nanite e Lumen), e o Blueprint gerado pelo GPT-4 é atachado ao modelo.

## É possível?
**Absolutamente sim.** O mercado de Text-to-3D amadureceu o suficiente em 2024/2025 para gerar assets viáveis para jogos. 

O grande diferencial do INOX Game Creator será a **orquestração** dessas IAs: O GPT-4 escreve o código, a Meshy gera o 3D, o Supabase armazena, o Three.js visualiza na web, e o script Python monta o jogo final na Unreal Engine. Tudo invisível para o usuário, que só precisa conversar com a IDE.