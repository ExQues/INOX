import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class AssetManager {
  constructor() {
    this.models = new Map();
    this.textures = new Map();
    this.loadingManager = new THREE.LoadingManager();
    
    // Configura o GLTFLoader
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    
    // Configura o DRACOLoader para modelos altamente compactados (Alta Fidelidade)
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    this.setupLoadingManager();
  }

  setupLoadingManager() {
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      // Aqui podemos despachar eventos pro DOM customizados pelo React.
      console.log(`[INOX Engine] Carregando Asset High-End: ${itemsLoaded} de ${itemsTotal}. Arquivo: ${url}`);
    };
    
    this.loadingManager.onError = (url) => {
      console.error(`[INOX Engine] Erro crasso ao baixar Malha 3D Realista de: ${url}`);
    };
  }

  /**
   * Puxa modelos .glb ou .gltf complexos e faz cache.
   * Usado para Folhagem Quixel e MetaHumans.
   */
  async loadModel(key, path) {
    if (this.models.has(key)) {
      return this.models.get(key).clone(); // Retorna clone para Instancing imediato
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          // Força sombras cinematográficas estourando sobre todas as meshes do modelo
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Se tiver material, certifique-se de que responde bem ao Ambiente
              if (child.material) {
                child.material.envMapIntensity = 1.0;
                // child.material.needsUpdate = true;
              }
            }
          });
          
          this.models.set(key, gltf.scene);
          resolve(gltf.scene.clone());
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Baixa texturas 4k/8k para PBR.
   */
  async loadTexture(key, path) {
    if (this.textures.has(key)) return this.textures.get(key);

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          this.textures.set(key, texture);
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
}

export const instance = new AssetManager();
export default instance;
