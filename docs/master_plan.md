
## 🚀 INOX MASTER PLAN: O Caminho para a Engine Definitiva (Iterações 24 a 35)

Para sair de um Editor Web avançado e nos consolidarmos como uma **Engine AAA baseada em IA e Web**, as próximas etapas do ciclo contínuo estão divididas em Fases de maturidade. Este é o plano mestre de implementação.

### FASE 1: Interatividade Completa na Web (Gameplay Sandbox)
O objetivo desta fase é fazer com que os modelos 3D que a IA carrega (como o *CesiumMan*) sejam jogáveis diretamente no navegador usando física real.
- **Iteração 24 (Scripting Avançado):** Ensinar a IA a gerar scripts em JavaScript/Three.js complexos que utilizem as entradas do teclado (WASD) para mover o modelo GLTF animado, trocar as animações (Idle para Walk) e aplicar forças no `cannon-es`.
- **Iteração 25 (Biblioteca de Assets Visual):** Criar um painel lateral no Editor que mostre uma galeria *Drag & Drop* de modelos 3D (Props, Characters, Terrains). O usuário arrasta para a cena e a IA gera a física instantaneamente.
- **Iteração 26 (Câmera Follow & Controles):** Implementar um script padrão de câmera em terceira pessoa (Third-Person Camera) que siga o personagem ativo pela cena.

### FASE 2: A Ponte Unreal Engine (O Verdadeiro AAA)
Onde a mágica gráfica acontece. A Web é o controle, a Unreal é o motor de renderização.
- **Iteração 27 (Exportação de Nível UMAP):** Criar a conversão do estado React `sceneObjects` para um formato JSON estruturado (`.umap` proxy) que o script Python da UE5 entenda perfeitamente (Coordenadas, Rotação, Escala, Asset ID).
- **Iteração 28 (Sincronização de Blueprints):** O script gerado pela IA no Editor Web deve ser mapeado para "Nós" de Blueprint. O script Python (`ai_bridge.py`) receberá esse mapeamento e construirá as Blueprints na Unreal usando a *Unreal Python API*.
- **Iteração 29 (Live Sync Bidirecional):** Estabelecer um servidor WebSocket entre o INOX Web e a máquina local rodando a UE5. Moveu um objeto na aba Web? Ele move na Unreal em milissegundos.

### FASE 3: Plataforma Social e Multiplayer
Jogos não se fazem sozinhos.
- **Iteração 30 (Autenticação Supabase):** Implementar Login (E-mail/GitHub), proteção de rotas no React e associar os Projetos ao ID do usuário real logado.
- **Iteração 31 (Colaboração em Tempo Real):** Duas pessoas editando o mesmo projeto ao mesmo tempo (estilo Figma). Se o Usuário A move um objeto, o Usuário B vê movendo através de *Supabase Realtime*.
- **Iteração 32 (Multiplayer Simulado de Gameplay):** Permitir que dois usuários cliquem em "Play" na aba Web e seus avatares entrem no mesmo servidor Node.js (Socket.io) para interagir na mesma cena.

### FASE 4: Ecossistema e Monetização
Tornando o INOX um negócio sustentável.
- **Iteração 33 (Marketplace de Lógicas):** Criar uma loja dentro do INOX onde usuários podem publicar "Scripts de Inventário" ou "Blueprints de Tiro" criados por IA, vendendo ou compartilhando com a comunidade.
- **Iteração 34 (Cloud Build Pipelines):** Conectar o botão "Exportar" (criado na iteração 20) a um servidor de CI/CD (ex: AWS ou GitHub Actions) que pegue o projeto e gere um `.exe` executável real para Windows, enviando o link de download pro usuário.
- **Iteração 35 (Geração Procedural de Mundos por Prompt):** A IA não só insere objetos, mas gera regras. "Crie uma cidade cyberpunk". A IA do INOX instrui o PCG da Unreal Engine a construir o quarteirão inteiro baseado em splines desenhadas na Web.