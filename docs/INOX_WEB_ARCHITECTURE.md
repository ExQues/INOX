# INOX Web Engine

A INOX Web Engine foi desenvolvida como uma solução autônoma para garantir fotorealismo de extrema alta fidelidade, capaz de rodar diretamente no cliente via navegador (WebGPU / WebGL2), ignorando as correntes e pesos inflados de motores tradicionais como Unreal Engine e Unity.

Isso garante que modelos de Inteligência Artificial generativos (IA) consigam construir, compilar, verter shadders e fazer playtest dos próprios mundos imediatamente após fabricá-los por linha de comando em JavaScript/TypeScript.

## Core Tecnológico

- **Renderizador Base:** `three.js`
- **Física Realista:** `cannon-es` (Gravidade constante -25)
- **Asset/Mesh Delivery:** Extensão do `GLTFLoader` combinada ao `DRACOLoader` (Draco 3D data compression pelo Google) alojados num padrão Singleton em `AssetManager.js`.
- **Efeitos Cinematográficos:** Operado através do pacote `postprocessing`, o loop de render substitui a leitura simplificada. 

## Pipeline PBR & Cinematic Rendering
O "Motor Gráfico Web" da INOX é alimentado pela classe `EffectComposer` atrelada a uma câmara. As camadas atuais que quebram o visual de "gráfico de celular" e geram Realismo são:

1. **SMAAEffect**: Filtro Antialiasing (Subpixel Morphological Antialiasing). Superior à AA padrão da API gráfica, que é desativada por default para liberar GPU.
2. **BloomEffect (God Rays e Emissão de Luz)**: Configurável a BlendFunction.SCREEN, com Limiar (Threshold) de luminância restrito em 0.9 para afetar exclusivamente highlights naturais (reflexo de chuva no chão, sol explodindo através as montanhas). Esmagadora contribuição ao feeling realista.
3. **DepthOfFieldEffect**: Adicionado FocalLength de lente real para focar precisamente numa Vector3 amarrada ao jogador. Isso destrói a visão plana "infinita" e traz cinematografia do tipo Unreal Engine 5 nativa.

*Tone mapping:* O output global obedece estritamente a `THREE.ACESFilmicToneMapping` forçando curvas de gama realistas de filmes / Hollywood. Nenhuma cor da Engine deve fugir do SRGBColorSpace.

## A Arquitetura Física e o The Grid
Durante a inicialização dos Level Tests, a Engine foca em usar instâncias do tipo `heightfield` ou blocos 100% lisos (`z=0`) segmentados com material Checkerboard PBR.

## Integração Futura com Geração por IA (Procedural JSON Injection)
As requisições de Agentes de IA passarão unicamente por este Workflow:
1. O LLM decide o mapa.
2. Formata coordenadas `{ type: "gltf", src: "megascans_tree_vol1", x: 10, y: 1 }`.
3. InoxEngine carrega isso no loop nativo e passa para o `AssetManager` que renderiza de modo assíncrono via `InstancedMesh`.
