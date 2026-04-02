import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, BlendFunction, DepthOfFieldEffect } from 'postprocessing';

class SurvivalGame {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.player = null;
    this.playerBody = null;
    this.terrain = null;
    this.water = null;
    this.trees = [];
    this.clock = new THREE.Clock();
    this.isLoaded = false;
    
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false
    };
    
    this.cameraAngle = 0;
    this.cameraPitch = 0;
    this.mouseSensitivity = 0.002;
    this.playerSpeed = 8;
    this.sprintMultiplier = 2.5;
    this.jumpForce = 12;
    
    this.world = null;
    
    this.playerParts = {
      head: null,
      torso: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null
    };
    
    this.isMoving = false;
    this.animationTime = 0;
  }
  
  async init() {
    this.updateLoadingStatus('Criando cena...');
    this.createScene();
    
    this.updateLoadingStatus('Configurando física...');
    this.createPhysics();
    
    this.updateLoadingStatus('Configurando câmera...');
    this.createCamera();
    
    this.updateLoadingStatus('Inicializando renderer...');
    this.createRenderer();
    
    this.updateLoadingStatus('Criando iluminação HDR...');
    this.createLighting();
    
    this.updateLoadingStatus('Criando skybox realista...');
    this.createSkybox();
    
    this.updateLoadingStatus('Gerando terreno PBR...');
    await this.createTerrain();
    
    this.updateLoadingStatus('Criando água ultra-realista...');
    this.createWater();
    
    this.updateLoadingStatus('Adicionando vegetação...');
    await this.createVegetation();
    
    this.updateLoadingStatus('Criando personagem 3D...');
    this.createPlayer();
    
    this.updateLoadingStatus('Adicionando partículas...');
    this.createParticles();
    
    this.updateLoadingStatus('Configurando controles...');
    this.setupControls();
    
    this.updateLoadingStatus('Iniciando jogo...');
    this.animate();
    
    this.hideLoading();
    this.isLoaded = true;
  }
  
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0006);
  }
  
  createPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -25, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 15;
  }
  
  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.set(0, 15, 30);
  }
  
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping is critical for cinematic look
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Post-Processing Pipeline Setup
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    const smaaEffect = new SMAAEffect();
    const bloomEffect = new BloomEffect({
      blendFunction: BlendFunction.SCREEN,
      mipmapBlur: true,
      luminanceThreshold: 0.9,
      luminanceSmoothing: 0.1,
      intensity: 0.8 // Reduzido de 1.5
    });
    const dofEffect = new DepthOfFieldEffect(this.camera, {
      focusDistance: 0.0,
      focalLength: 0.05,
      bokehScale: 0.5 // Reduzido de 2.0 para não cegar o jogador
    });
    // Target player slightly in front of camera
    dofEffect.target = new THREE.Vector3(0, 5, -10);
    
    const effectPass = new EffectPass(this.camera, smaaEffect, bloomEffect, dofEffect);
    this.composer.addPass(effectPass);
    
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  createLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLight.position.set(150, 200, 75);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 8192;
    sunLight.shadow.mapSize.height = 8192;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    sunLight.shadow.bias = -0.00005;
    sunLight.shadow.normalBias = 0.01;
    sunLight.shadow.radius = 8;
    this.scene.add(sunLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x2d5016, 1.2);
    this.scene.add(hemisphereLight);
    
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    fillLight.position.set(-100, 50, -100);
    this.scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0x6688ff, 0.3);
    rimLight.position.set(-50, 100, 50);
    this.scene.add(rimLight);
  }
  
  createSkybox() {
    const skyGeometry = new THREE.SphereGeometry(1500, 64, 64);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0055aa) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 20 },
        exponent: { value: 0.5 },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        uniform float time;
        varying vec3 vWorldPosition;
        
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
          
          vec2 cloudUV = vWorldPosition.xz * 0.002 + time * 0.02;
          float cloud1 = sin(cloudUV.x * 5.0 + cloudUV.y * 3.0) * 0.5 + 0.5;
          float cloud2 = cos(cloudUV.x * 3.0 - cloudUV.y * 5.0) * 0.5 + 0.5;
          float cloud3 = sin((cloudUV.x + cloudUV.y) * 8.0 + time * 0.5) * 0.5 + 0.5;
          float cloud = cloud1 * cloud2 * cloud3;
          cloud = smoothstep(0.6, 0.9, cloud);
          
          skyColor = mix(skyColor, vec3(1.0), cloud * 0.5);
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.sky);
  }
  
  createTerrain() {
    return new Promise((resolve) => {
      const geometry = new THREE.PlaneGeometry(200, 200, 200, 200);
      geometry.rotateX(-Math.PI / 2);
      
      const vertices = geometry.attributes.position.array;
      const colors = [];
      
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        const distance = Math.sqrt(x * x + z * z);
        
        let height = this.getSandboxHeight(x, z);
        vertices[i + 1] = height;
        
        const color = this.getSandboxColor(height, x, z);
        colors.push(color.r, color.g, color.b);
      }
      
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: false,
        side: THREE.DoubleSide
      });
      
      this.terrain = new THREE.Mesh(geometry, material);
      this.terrain.receiveShadow = true;
      this.terrain.castShadow = true;
      this.scene.add(this.terrain);
      
      resolve();
    });
  }
  
  getSandboxHeight(x, z) {
    // Arena limits
    if (Math.abs(x) > 95 || Math.abs(z) > 95) {
      return 10; // Paredes para prender o boneco no grid
    }
    
    // Piscina de Água profunda num Quadrante (-x, -z)
    if (x < -10 && x > -60 && z < -10 && z > -60) {
       // Borda lisa para a piscina
       let distX = Math.min(Math.abs(x + 10), Math.abs(x + 60));
       let distZ = Math.min(Math.abs(z + 10), Math.abs(z + 60));
       let borda = Math.min(distX, distZ);
       if (borda < 3) {
           return -2 + (3 - borda);
       }
       return -2;
    }
    
    return 0; // Chão 100% Plano
  }
  
  getSandboxColor(height, x, z) {
    if (height > 5) return new THREE.Color(0x333333); // Paredes
    if (height < -0.5) return new THREE.Color(0x221100); // Fundo da Piscina (Lama escura)
    
    const tileSize = 20;
    const tileX = Math.floor(x / tileSize);
    const tileZ = Math.floor(z / tileSize);
    
    // Xadrez Checkerboard para identificar Test Tiles facilmente + tons dependendo da area
    let isDark = (tileX + tileZ) % 2 === 0;
    
    // Grama (x positivo, z positivo)
    if (x >= 0 && z >= 0) {
      return isDark ? new THREE.Color(0x1a6620) : new THREE.Color(0x228B22);
    }
    // Areia (x negativo, z positivo)
    else if (x < 0 && z >= 0) {
      return isDark ? new THREE.Color(0xa39363) : new THREE.Color(0xc2b280);
    }
    // Terra Seca Padrão (x positivo, z negativo)
    else if (x >= 0 && z < 0) {
      return isDark ? new THREE.Color(0x4a3728) : new THREE.Color(0x5c4431);
    }
    // Z negativo, X negativo é transição de Piscina
    return new THREE.Color(0x3a2e24);
  }
  
  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(800, 800, 300, 300);
    waterGeometry.rotateX(-Math.PI / 2);
    
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waterColor: { value: new THREE.Color(0x0044aa) },
        foamColor: { value: new THREE.Color(0xffffff) },
        sunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        cameraPosition: { value: this.camera.position }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vWaveHeight;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          float wave1 = sin(pos.x * 0.08 + time * 1.5) * 0.8;
          float wave2 = cos(pos.z * 0.06 + time * 1.2) * 0.6;
          float wave3 = sin((pos.x + pos.z) * 0.04 + time * 0.8) * 0.4;
          float wave4 = cos(pos.x * 0.12 - pos.z * 0.1 + time * 2.0) * 0.3;
          float wave5 = sin(pos.x * 0.16 + pos.z * 0.14 + time * 1.8) * 0.25;
          
          vWaveHeight = wave1 + wave2 + wave3 + wave4 + wave5;
          pos.y += vWaveHeight;
          
          float dx = cos(pos.x * 0.08 + time * 1.5) * 0.8 * 0.08;
          float dz = -sin(pos.z * 0.06 + time * 1.2) * 0.6 * 0.06;
          
          vNormal = normalize(vec3(-dx, 1.0, -dz));
          vPosition = pos;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 waterColor;
        uniform vec3 foamColor;
        uniform vec3 sunDirection;
        uniform float time;
        uniform vec3 cameraPosition;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vWaveHeight;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 4.0);
          
          vec3 deepColor = waterColor * 0.5;
          vec3 shallowColor = waterColor * 1.5;
          
          float depth = vWaveHeight * 0.3 + 0.5;
          vec3 color = mix(deepColor, shallowColor, depth);
          
          vec3 skyReflection = mix(vec3(0.6, 0.8, 1.0), vec3(0.3, 0.5, 0.8), fresnel);
          color = mix(color, skyReflection, fresnel * 0.7);
          
          float foamPattern = sin(vPosition.x * 0.4 + time * 3.0) * sin(vPosition.z * 0.35 + time * 2.5);
          foamPattern += cos((vPosition.x + vPosition.z) * 0.3 + time * 2.0) * 0.5;
          foamPattern = smoothstep(0.7, 0.95, foamPattern);
          
          vec3 foam = foamColor * foamPattern * 0.5;
          color += foam;
          
          vec3 halfVector = normalize(sunDirection + viewDir);
          float specular = pow(max(dot(vNormal, halfVector), 0.0), 128.0);
          color += vec3(1.0, 0.95, 0.8) * specular * 1.2;
          
          float caustic = sin(vPosition.x * 2.0 + time * 4.0) * cos(vPosition.z * 2.0 + time * 3.5);
          caustic += sin((vPosition.x + vPosition.z) * 1.5 + time * 2.5) * 0.5;
          caustic = smoothstep(0.6, 0.9, caustic);
          color += vec3(0.0, 0.3, 0.5) * caustic * 0.3;
          
          gl_FragColor = vec4(color, 0.88);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.water.position.y = -1.5;
    this.water.receiveShadow = true;
    this.scene.add(this.water);
  }
  
  createVegetation() {
    return new Promise((resolve) => {
      // Limpeza de Vegetação Lógica para Arena de Testes
      console.log("[INOX Engine] Arena Loaded sem Propiedades Geométricas.");
      
      // Adicionar apenas UM cubo de referência vermelho para noção de profundidade
      const refGeo = new THREE.BoxGeometry(2, 2, 2);
      const refMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2 });
      const refCube = new THREE.Mesh(refGeo, refMat);
      refCube.position.set(10, 1, 10);
      refCube.castShadow = true;
      this.scene.add(refCube);
      
      resolve();
    });
  }
  
  createTree(x, y, z) {
    const tree = new THREE.Group();
    
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.85,
      metalness: 0
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = y + 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const size = 4 - i * 0.8;
      const layerGeometry = new THREE.ConeGeometry(size, 3, 12);
      const layerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.3, 0.75, 0.28 - i * 0.04),
        roughness: 0.75,
        metalness: 0
      });
      
      const layer = new THREE.Mesh(layerGeometry, layerMaterial);
      layer.position.y = y + 4 + i * 2.2;
      layer.castShadow = true;
      layer.receiveShadow = true;
      tree.add(layer);
    }
    
    const scale = 0.5 + Math.random() * 1.2;
    tree.scale.set(scale, scale, scale);
    tree.position.set(x, 0, z);
    
    this.scene.add(tree);
    this.trees.push(tree);
  }
  
  createGrass(x, y, z) {
    const grassGeometry = new THREE.ConeGeometry(0.08, 0.5, 5);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.3, 0.65, 0.42),
      roughness: 0.85,
      metalness: 0
    });
    
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.set(x, y + 0.25, z);
    grass.rotation.x = (Math.random() - 0.5) * 0.4;
    grass.rotation.z = (Math.random() - 0.5) * 0.4;
    
    const scale = 0.6 + Math.random() * 1.2;
    grass.scale.set(scale, scale, scale);
    
    this.scene.add(grass);
  }
  
  createRock(x, y, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.5, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0, 0, 0.4 + Math.random() * 0.2),
      roughness: 0.9,
      metalness: 0.1
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, y + 0.5, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    this.scene.add(rock);
  }
  
  createPlayer() {
    this.player = new THREE.Group();
    
    // Cápsula Base para testes antes do GLTF do MetaHuman
    const capsuleGeo = new THREE.CapsuleGeometry(0.5, 1.0, 4, 16);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.1, // Material brilhante para testar os reflexos PBR do Bloom e da Iluminação local
      metalness: 0.8
    });
    
    const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
    capsule.position.set(0, 1.0, 0);
    capsule.castShadow = true;
    capsule.receiveShadow = true;
    
    // Limpamos o this.playerParts para não crashar a animação (ele faz fail-safe nativamente)
    this.playerParts = {};
    
    this.player.add(capsule);
    this.player.position.set(0, 5, 0);
    this.scene.add(this.player);
    
    // Em breve o AssetManager puxará um modelo real e ancorará neste Group.
    // Inicialização da Física do Jogador
    const playerShape = new CANNON.Cylinder(0.5, 0.5, 1.0, 16); // Cilindro para englobar a cápsula
    this.playerBody = new CANNON.Body({
      mass: 75,
      shape: playerShape,
      position: new CANNON.Vec3(0, 10, 0),
      linearDamping: 0.95,
      angularDamping: 0.95,
      fixedRotation: true
    });
    this.world.addBody(this.playerBody);
  }
  
  createParticles() {
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 350;
      positions[i * 3 + 1] = Math.random() * 70 + 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350;
      
      const colorType = Math.random();
      let color;
      if (colorType < 0.6) {
        color = new THREE.Color().setHSL(0.3, 0.5, 0.65);
      } else if (colorType < 0.8) {
        color = new THREE.Color().setHSL(0.08, 0.6, 0.8);
      } else {
        color = new THREE.Color().setHSL(0.5, 0.4, 0.7);
      }
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.15,
        y: -Math.random() * 0.1 - 0.03,
        z: (Math.random() - 0.5) * 0.15
      });
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
      blending: THREE.NormalBlending
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.userData = { velocities: velocities };
    this.scene.add(this.particles);
  }
  
  setupControls() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('click', () => this.lockPointer());
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
  }
  
  onKeyDown(e) {
    switch(e.code) {
      case 'KeyW': 
        this.keys.forward = true; 
        break;
      case 'KeyS': 
        this.keys.backward = true; 
        break;
      case 'KeyA': 
        this.keys.left = true; 
        break;
      case 'KeyD': 
        this.keys.right = true; 
        break;
      case 'Space': 
        if (this.playerBody.velocity.y < 1) {
          this.playerBody.velocity.y = this.jumpForce;
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
      default:
        break;
    }
  }
  
  onKeyUp(e) {
    switch(e.code) {
      case 'KeyW': 
        this.keys.forward = false; 
        break;
      case 'KeyS': 
        this.keys.backward = false; 
        break;
      case 'KeyA': 
        this.keys.left = false; 
        break;
      case 'KeyD': 
        this.keys.right = false; 
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
      default:
        break;
    }
  }
  
  onMouseMove(e) {
    if (document.pointerLockElement !== document.body) return;
    
    this.cameraAngle -= e.movementX * this.mouseSensitivity;
    this.cameraPitch -= e.movementY * this.mouseSensitivity;
    this.cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraPitch));
  }
  
  lockPointer() {
    document.body.requestPointerLock();
  }
  
  onPointerLockChange() {
    const crosshair = document.getElementById('crosshair');
    if (document.pointerLockElement === document.body) {
      crosshair.style.opacity = '1';
    } else {
      crosshair.style.opacity = '0.3';
    }
  }
  
  updatePlayer(delta) {
    const speed = this.playerSpeed * (this.keys.sprint ? this.sprintMultiplier : 1);
    
    const moveDirection = new THREE.Vector3();
    
    if (this.keys.forward || this.keys.backward) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngle);
      moveDirection.add(forward.multiplyScalar(this.keys.forward ? 1 : -1));
    }
    
    if (this.keys.left || this.keys.right) {
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngle);
      moveDirection.add(right.multiplyScalar(this.keys.right ? 1 : -1));
    }
    
    moveDirection.normalize();
    
    this.playerBody.velocity.x = moveDirection.x * speed;
    this.playerBody.velocity.z = moveDirection.z * speed;
    
    const terrainHeight = this.getTerrainHeightAt(this.playerBody.position.x, this.playerBody.position.z);
    
    if (this.playerBody.position.y < terrainHeight + 1.7) {
      this.playerBody.position.y = terrainHeight + 1.7;
      this.playerBody.velocity.y = 0;
    }
    
    this.playerBody.position.y = Math.max(this.playerBody.position.y, -3);
    
    this.isMoving = moveDirection.length() > 0.1;
  }
  
  updatePlayerAnimation(delta, time) {
    if (!this.player) return;
    
    const animationSpeed = this.keys.sprint ? 12 : 8;
    const moveAmount = this.isMoving ? delta * animationSpeed : 0;
    this.animationTime += moveAmount;
    
    const legSwing = Math.sin(this.animationTime) * 0.5;
    const armSwing = Math.sin(this.animationTime) * 0.4;
    const bodyBob = Math.abs(Math.sin(this.animationTime * 2)) * 0.05;
    
    if (this.playerParts.leftLeg) {
      this.playerParts.leftLeg.rotation.x = legSwing;
    }
    if (this.playerParts.rightLeg) {
      this.playerParts.rightLeg.rotation.x = -legSwing;
    }
    if (this.playerParts.leftArm) {
      this.playerParts.leftArm.rotation.x = -armSwing;
    }
    if (this.playerParts.rightArm) {
      this.playerParts.rightArm.rotation.x = armSwing;
    }
    if (this.playerParts.torso) {
      this.playerParts.torso.position.y = 1.7 + bodyBob;
    }
    if (this.playerParts.head) {
      this.playerParts.head.position.y = 2.8 + bodyBob;
    }
    
    if (this.isMoving) {
      this.player.rotation.y = this.cameraAngle;
    }
  }
  
  getTerrainHeightAt(x, z) {
    return this.getSandboxHeight(x, z);
  }
  
  updateCamera() {
    const cameraDistance = 12;
    const cameraHeight = 5;
    
    const targetX = this.playerBody.position.x + Math.sin(this.cameraAngle) * cameraDistance;
    const targetZ = this.playerBody.position.z + Math.cos(this.cameraAngle) * cameraDistance;
    const targetY = this.playerBody.position.y + cameraHeight + Math.sin(this.cameraPitch) * cameraHeight * 0.5;
    
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    
    const lookAtY = this.playerBody.position.y + 1.7;
    this.camera.lookAt(this.playerBody.position.x, lookAtY, this.playerBody.position.z);
  }
  
  updateWater(time) {
    if (this.water) {
      this.water.material.uniforms.time.value = time;
      this.water.material.uniforms.cameraPosition.value.copy(this.camera.position);
    }
  }
  
  updateSky(time) {
    if (this.sky) {
      this.sky.material.uniforms.time.value = time;
    }
  }
  
  updateParticles(time) {
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;
        
        positions[i] += velocities[idx].x;
        positions[i + 1] += velocities[idx].y;
        positions[i + 2] += velocities[idx].z;
        
        velocities[idx].x += (Math.random() - 0.5) * 0.015;
        velocities[idx].z += (Math.random() - 0.5) * 0.015;
        
        if (positions[i + 1] < 0) {
          positions[i + 1] = 70;
          positions[i] = (Math.random() - 0.5) * 350;
          positions[i + 2] = (Math.random() - 0.5) * 350;
          
          velocities[idx].y = -Math.random() * 0.1 - 0.03;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  updateLoadingStatus(status) {
    document.getElementById('loading-status').textContent = status;
  }
  
  hideLoading() {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    setTimeout(() => loading.style.display = 'none', 500);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if(this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();
    
    this.world.step(1/60, delta, 3);
    
    this.player.position.copy(this.playerBody.position);
    
    this.updatePlayer(delta);
    this.updatePlayerAnimation(delta, time);
    this.updateCamera();
    this.updateWater(time);
    this.updateSky(time);
    this.updateParticles(time);
    
    // Atualiza DoF Target pro personagem
    if(this.composer && this.composer.passes[1]) {
        // Encontra o pass que tem DoF (Pode requerer ajuste para buscar especifico, mas ok para v1)
    }
    
    if(this.composer) {
      this.composer.render(delta);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
    const fps = Math.round(1 / delta);
    document.getElementById('fps').textContent = fps;
  }
}

const game = new SurvivalGame();
game.init();
