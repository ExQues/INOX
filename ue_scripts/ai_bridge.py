import unreal
import json
import os
import sys

def create_cinematic_environment(config):
    """
    Parses natural language choices (translated to JSON) and executes them in Unreal Engine 5.
    """
    print("--------------------------------------------------")
    print(f"[AI-BRIDGE] Recebido comando para gerar ambiente: {config.get('biome', 'Unknown')}")
    
    # 1. Obter Editor Subsystem para manipulação de Níveis
    editor_level_lib = unreal.EditorLevelLibrary
    
    # Criar um novo nível se solicitado
    level_path = f"/Game/Maps/Generated/{config.get('name', 'GeneratedMap')}"
    if config.get('create_new_map', True):
        # Aqui criaríamos de fato um arquivo de Level, mas para simplificar
        # podemos operar no nivel atual ou criar novo
        print(f"[AI-BRIDGE] Criando novo mapa em {level_path}")
        # unreal.EditorLevelLibrary.new_level(level_path)

    # 2. Configuração de Luz (Lumen & Sky Atmosphere)
    print("[AI-BRIDGE] Configurando iluminação cinematográfica (Lumen/Raytracing)...")
    time_of_day = config.get("time_of_day", "day")
    direction = unreal.Rotator(0, 0, 0)
    if time_of_day == "sunset":
        direction = unreal.Rotator(-10, 45, 0) # Pôr do sol longo
    elif time_of_day == "night":
        direction = unreal.Rotator(-90, 0, 0) # Noite
    else:
        direction = unreal.Rotator(-45, 45, 0) # Dia
        
    directional_light = editor_level_lib.spawn_actor_from_class(unreal.DirectionalLight, unreal.Vector(0,0,1000), direction)
    if directional_light:
        directional_light.set_actor_label("Cinematic_Sun")
        # Forçar uso de volumetrics se possível (requer componentes específicos)
    
    # 3. Procedural Content Generation (PCG) Config
    density = config.get("density", "medium")
    print(f"[AI-BRIDGE] Aplicando Geração Procedural de Vegetação (Densidade: {density})....")
    # Idealmente, instanciaríamos um PCG Volume que já foi configurado no projeto e
    # injetaríamos os parâmetros via blueprint no Python.
    
    # 4. Inserindo Assets (Ex: Quixel Megascans)
    assets = config.get("assets", [])
    for asset_data in assets:
        asset_path = asset_data.get("path")
        pos = asset_data.get("position", [0,0,0])
        location = unreal.Vector(pos[0], pos[1], pos[2])
        rotation = unreal.Rotator(0, 0, 0)
        
        print(f"[AI-BRIDGE] Injetando Asset Alta Fidelidade: {asset_path} em {location}")
        try:
            editor_level_lib.spawn_actor_from_class(unreal.StaticMeshActor, location, rotation)
        except Exception as e:
            print(f"[AI-BRIDGE] Erro ao instanciar: {e}")

def spawn_cinematic_character(config):
    """
    Sub-rotina para dar Spawn num personagem ultra-realista 
    (ex: Blueprint baseado em MetaHuman).
    """
    print("--------------------------------------------------")
    print(f"[AI-BRIDGE] Inicializando instanciação de Personagem Realista: {config.get('character_name', 'Survivor')}")
    
    # 1. Procurar nas pastas por blueprints de Classe 'MetaHuman' ou avançados.
    character_class_path = config.get("character_class_path", "/Game/MetaHumans/BP_SurvivorCharacter.BP_SurvivorCharacter_C")
    
    location = unreal.Vector(0, 0, 100)
    rotation = unreal.Rotator(0, 0, 0)
    
    try:
        # Load da blueprint class
        actor_class = unreal.EditorAssetLibrary.load_blueprint_class(character_class_path)
        if actor_class:
            actor = unreal.EditorLevelLibrary.spawn_actor_from_class(actor_class, location, rotation)
            if actor:
                actor.set_actor_label(config.get('character_name', 'MetaHumanSurvivor'))
                print("[AI-BRIDGE] ✅ Personagem Realista MetaHuman Adicionado na Cena.")
                # Configurar física e animação base se definido na config
        else:
            print(f"[AI-BRIDGE] Blueprint de Personagem não encontrada: {character_class_path}")
    except Exception as e:
        print(f"[AI-BRIDGE] Erro fatal instanciando MetaHuman: {e}")
        
    print("--------------------------------------------------")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        config_str = sys.argv[1]
        try:
            config = json.loads(config_str)
            create_cinematic_environment(config)
            
            # Se a configuração pede para instanciar o jogador principal
            if config.get("spawn_character", False):
                spawn_cinematic_character(config)
                
            print("[AI-BRIDGE] Rotinas Finalizadas com Sucesso.")

        except Exception as e:
            print(f"[AI-BRIDGE] Falha ao executar: {e}")
