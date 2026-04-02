# Arquitetura Técnica: Orquestração de Assets AAA (O Pivot)

Este documento detalha a atualização da arquitetura do INOX Game Creator para atingir qualidade gráfica AAA (nível GTA 6 e Crimson Desert).

## A Falácia do Text-to-3D para Jogos AAA
Inicialmente, o INOX planejava usar APIs de Text-to-3D (Meshy, Tripo) para gerar os assets. No entanto, concluímos que a geração de IA atual produz malhas sem topologia adequada para animação (sem *edge loops* para dobras), sem *Blend Shapes* faciais e com materiais limitados. Para alcançar o verdadeiro fotorrealismo, a abordagem de gerar do zero foi **descartada** para produções AAA.

## O Novo Paradigma: A IA como Diretora de Arte e Orquestradora

A solução para a qualidade extrema é usar a IA (GPT-4/Claude) para **buscar, selecionar e orquestrar assets AAA que já existem**, em vez de criá-los malfeitos do zero.

### 1. O Motor de Busca (A "Biblioteca")
Quando o usuário digita: *"Crie uma floresta densa com um mercenário"*
O LLM (O Cérebro) vai:
1. Traduzir o prompt para uma lista de requerimentos de cena.
2. Fazer consultas em bibliotecas de assets de altíssima fidelidade:
   - **Quixel Megascans**: Para folhagens, pedras, texturas de solo fotorrealistas.
   - **MetaHumans**: Para o personagem do mercenário (com rigging completo e texturas de pele PBR).
3. Selecionar os IDs desses assets na biblioteca.

### 2. O Editor Web (O "Blockout / Wireframe")
O navegador web é muito limitado para renderizar gráficos de GTA 6. Portanto, o `Viewport3D.tsx` (Three.js) atua apenas como um **Mapa Tático (Blockout)**.
1. A IA instancia caixas, cilindros ou versões *low-poly* (proxy) dos assets selecionados no navegador.
2. O usuário usa o navegador apenas para posicionar os elementos, definir as escalas e testar a física básica (Cannon.js) e a lógica.

### 3. A Ponte AAA (A Execução na Unreal Engine 5)
O verdadeiro jogo roda na nuvem (ou no PC local do dev) dentro da Unreal Engine 5.
1. O usuário aperta o botão **"Sync UE5"**.
2. O script `ue_scripts/ai_bridge.py` recebe o JSON com as coordenadas.
3. O Python da UE5 faz o download automático dos assets de alta resolução do **Quixel Bridge**.
4. O script instancia os MetaHumans e aplica algoritmos de **Geração Procedural (PCG)** na engine para popular a floresta baseada nas coordenadas do Blockout.
5. O jogo final é renderizado com **Lumen (Iluminação Global)** e **Nanite (Geometria Virtualizada)**.

## Conclusão
O INOX Game Creator não tenta reinventar a modelagem 3D. Ele atua como o elo inteligente entre a intenção criativa humana e o ecossistema bilionário da Epic Games, permitindo o desenvolvimento AAA sem arrastar um único arquivo manualmente.