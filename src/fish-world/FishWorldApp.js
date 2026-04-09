import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FISH_WORLD_MODEL_ASSETS } from "./assetManifest.js";

const PHASES = [
  { name: "Tiny", growthMax: 100, hp: 24, evoTarget: 1, speed: 6.4, turnSpeed: 2.6, biteRange: 2.1, biteDamage: 12 },
  { name: "Small", growthMax: 180, hp: 38, evoTarget: 2, speed: 5.9, turnSpeed: 2.2, biteRange: 2.5, biteDamage: 18 },
  { name: "Medium", growthMax: 260, hp: 54, evoTarget: 3, speed: 5.35, turnSpeed: 1.95, biteRange: 2.9, biteDamage: 24 },
  { name: "Large", growthMax: 360, hp: 72, evoTarget: 4, speed: 4.85, turnSpeed: 1.7, biteRange: 3.3, biteDamage: 30 },
];

const REGIONS = [
  "Shallow Reef",
  "Open Blue Zone",
  "Kelp Forest",
  "Rocky Depth",
  "Predator Trench",
];

function createFallbackFish({ bodyColor, emissiveColor, scale = 1 }) {
  const root = new THREE.Group();
  root.name = "fish-root";

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor,
    emissive: emissiveColor,
    emissiveIntensity: 0.35,
    roughness: 0.58,
    metalness: 0.03,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 18), bodyMaterial);
  body.name = "body";
  body.scale.set(1.46, 0.84, 0.7);
  root.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.82, 4), bodyMaterial.clone());
  tail.name = "tail";
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-1.02, 0, 0);
  tail.scale.set(1, 0.62, 1);
  root.add(tail);

  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.46, 3), bodyMaterial.clone());
  dorsal.name = "dorsal";
  dorsal.position.set(0, 0.34, 0);
  dorsal.rotation.z = Math.PI;
  root.add(dorsal);

  const finLeft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 3), bodyMaterial.clone());
  finLeft.name = "fin-left";
  finLeft.position.set(0.14, -0.1, 0.26);
  finLeft.rotation.z = -Math.PI / 2.2;
  finLeft.rotation.x = Math.PI / 7;
  root.add(finLeft);

  const finRight = finLeft.clone();
  finRight.name = "fin-right";
  finRight.position.z *= -1;
  finRight.rotation.x *= -1;
  root.add(finRight);

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5fcff,
    emissive: 0x0b1b27,
    emissiveIntensity: 0.15,
    roughness: 0.28,
  });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), eyeMaterial);
  eye.name = "eye";
  eye.position.set(0.62, 0.14, 0.28);
  root.add(eye);

  root.scale.setScalar(scale);
  return root;
}

function createFallbackCorpse() {
  const root = new THREE.Group();
  root.name = "corpse-root";
  const material = new THREE.MeshStandardMaterial({
    color: 0xc7a372,
    emissive: 0x382712,
    emissiveIntensity: 0.2,
    roughness: 0.88,
  });
  const meat = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 14), material);
  meat.name = "meat";
  meat.scale.set(1.3, 0.72, 0.9);
  root.add(meat);
  return root;
}

function createFallbackRock() {
  const root = new THREE.Group();
  root.name = "rock-root";
  const material = new THREE.MeshStandardMaterial({ color: 0x315363, roughness: 0.95 });
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), material);
  rock.name = "rock";
  rock.scale.set(1.2, 1.7, 1);
  root.add(rock);
  return root;
}

function createFallbackKelp() {
  const root = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const stem = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 4 + i * 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x2f7d59,
        emissive: 0x0d2a1c,
        emissiveIntensity: 0.16,
        roughness: 0.92,
        side: THREE.DoubleSide,
      }),
    );
    stem.position.set((i - 2) * 0.35, 1.8 + i * 0.08, (i % 2 === 0 ? 0.18 : -0.12));
    stem.rotation.y = (i - 2) * 0.22;
    stem.rotation.z = (i - 2) * 0.06;
    root.add(stem);
  }
  return root;
}

function createFallbackCoral() {
  const root = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x7f55b8,
    emissive: 0x2c1848,
    emissiveIntensity: 0.2,
    roughness: 0.84,
  });
  for (let i = 0; i < 6; i += 1) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 1.4 + i * 0.18, 7), material);
    branch.position.set(Math.cos(i) * 0.55, 0.7 + i * 0.08, Math.sin(i) * 0.55);
    branch.rotation.z = (i - 2.5) * 0.18;
    branch.rotation.x = (i % 2 === 0 ? 0.22 : -0.18);
    root.add(branch);
  }
  return root;
}

function createFallbackReefArch() {
  const root = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x416877, roughness: 0.95 });
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 5.5, 7), material);
  left.position.set(-2.2, 2.6, 0);
  left.rotation.z = 0.14;
  root.add(left);
  const right = left.clone();
  right.position.x = 2.2;
  right.rotation.z = -0.14;
  root.add(right);
  const top = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.72, 8, 18, Math.PI), material);
  top.rotation.z = Math.PI;
  top.position.y = 5.1;
  root.add(top);
  return root;
}

function createFallbackSeafloorChunk() {
  const root = new THREE.Group();
  const sand = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 6.4, 1.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x8b7450, roughness: 1 }),
  );
  sand.scale.set(1.4, 0.28, 1.2);
  root.add(sand);
  return root;
}

function cloneTemplate(template, fallbackFactory) {
  return (template || fallbackFactory()).clone(true);
}

export class FishWorldApp {
  constructor(options) {
    this.container = options.container;
    this.uiRoot = options.uiRoot;
    this.radarScope = options.radarScope;
    this.phaseNode = options.phaseNode;
    this.hpNode = options.hpNode;
    this.growthNode = options.growthNode;
    this.evolutionNode = options.evolutionNode;
    this.regionNode = options.regionNode;
    this.messageNode = document.getElementById("fish-world-message");
    this.lobbyButton = options.lobbyButton;
    this.username = (options.username || "Player").slice(0, 16);
    this.onBackToLobby = options.onBackToLobby;
    this.running = false;
    this.phaseIndex = 0;
    this.growth = 0;
    this.evolution = 0;
    this.hp = PHASES[0].hp;
    this.maxHp = PHASES[0].hp;
    this.attackCooldown = 0;
    this.damageFlash = 0;
    this.messageUntil = 0;
    this.lastTime = 0;
    this.entities = [];
    this.radarDots = [];
    this.pointerDown = false;
    this.pause = false;
    this.playerVelocity = new THREE.Vector3();
    this.playerYawVelocity = 0;
    this.modelTemplates = {};
    this.ambientBubbles = [];
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      ascend: false,
      descend: false,
      bite: false,
    };
  }

  async start() {
    this.setupRenderer();
    this.setupScene();
    await this.loadModels();
    this.setupWorld();
    this.bindEvents();
    this.uiRoot?.classList.remove("hidden");
    this.container?.classList.remove("hidden");
    this.running = true;
    this.setMessage("Hunt prey, avoid predators, press E or click to bite.");
    this.updateUi();
    this.loop(0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.48;
    this.renderer.setClearColor(0x5ea5a3, 1);
    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x4a8c8a, 0.022);
    this.camera = new THREE.PerspectiveCamera(54, this.container.clientWidth / this.container.clientHeight, 0.1, 250);
    this.camera.position.set(0, 2.4, 6.2);
  }

  setupScene() {
    const hemi = new THREE.HemisphereLight(0xdbffff, 0x275d57, 2.75);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xf8fffe, 2.95);
    dir.position.set(10, 26, 8);
    this.scene.add(dir);

    const ambient = new THREE.AmbientLight(0x8dd6d0, 1.45);
    this.scene.add(ambient);

    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(9, 24, 18),
      new THREE.MeshBasicMaterial({
        color: 0xe6fffb,
        transparent: true,
        opacity: 0.22,
      }),
    );
    sunGlow.position.set(0, 24, -18);
    this.scene.add(sunGlow);

    const lightShaftMaterial = new THREE.MeshBasicMaterial({
      color: 0xd4fff8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (let index = 0; index < 6; index += 1) {
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(18, 46), lightShaftMaterial.clone());
      shaft.position.set(-18 + index * 7, 10.5, -12 - index * 2.5);
      shaft.rotation.x = -Math.PI / 2.58;
      shaft.rotation.z = -0.2 + index * 0.05;
      this.scene.add(shaft);
    }
  }

  async loadModels() {
    const loader = new GLTFLoader();
    const loadTemplate = async (key, fallbackFactory) => {
      try {
        const gltf = await loader.loadAsync(FISH_WORLD_MODEL_ASSETS[key]);
        this.modelTemplates[key] = gltf.scene;
      } catch {
        this.modelTemplates[key] = fallbackFactory();
      }
    };

    await Promise.all([
      loadTemplate("player", () => createFallbackFish({ bodyColor: 0xffb24c, emissiveColor: 0x145d7a, scale: 1.05 })),
      loadTemplate("prey", () => createFallbackFish({ bodyColor: 0x74f0ff, emissiveColor: 0x0f4d62, scale: 0.6 })),
      loadTemplate("neutral", () => createFallbackFish({ bodyColor: 0x94c7ff, emissiveColor: 0x18425a, scale: 0.9 })),
      loadTemplate("predator", () => createFallbackFish({ bodyColor: 0xff7886, emissiveColor: 0x5b1620, scale: 1.32 })),
      loadTemplate("corpse", createFallbackCorpse),
      loadTemplate("rock", createFallbackRock),
      loadTemplate("kelp", createFallbackKelp),
      loadTemplate("coral", createFallbackCoral),
      loadTemplate("reefArch", createFallbackReefArch),
      loadTemplate("seafloor", createFallbackSeafloorChunk),
    ]);
  }

  setupWorld() {
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(120, 60, 120),
      new THREE.MeshPhongMaterial({
        color: 0x91d9cb,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      }),
    );
    water.position.y = 12;
    this.scene.add(water);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0xb6a16d,
        emissive: 0x1f3b33,
        emissiveIntensity: 0.18,
        roughness: 1,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    this.scene.add(floor);

    this.spawnEnvironment();
    this.spawnNearPlayerSet();

    this.spawnParticles();

    this.player = cloneTemplate(this.modelTemplates.player, () => createFallbackFish({ bodyColor: 0xffb24c, emissiveColor: 0x145d7a, scale: 1.05 }));
    this.playerTail = this.player.getObjectByName("tail");
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);
    this.createPlayerShadow();

    for (let i = 0; i < 14; i += 1) {
      this.spawnEntity("prey");
    }
    for (let i = 0; i < 6; i += 1) {
      this.spawnEntity("neutral");
    }
    for (let i = 0; i < 6; i += 1) {
      this.spawnEntity("predator");
    }
    for (let i = 0; i < 3; i += 1) {
      this.spawnEntity("corpse");
    }
  }

  spawnEntity(type) {
    const config = {
      prey: { radius: 0.26, speed: 1.85, hp: 14, damage: 4, growth: 18, factory: () => cloneTemplate(this.modelTemplates.prey, () => createFallbackFish({ bodyColor: 0x74f0ff, emissiveColor: 0x0f4d62, scale: 0.6 })) },
      neutral: { radius: 0.38, speed: 1.45, hp: 26, damage: 7, growth: 28, factory: () => cloneTemplate(this.modelTemplates.neutral, () => createFallbackFish({ bodyColor: 0x94c7ff, emissiveColor: 0x18425a, scale: 0.9 })) },
      predator: { radius: 0.6, speed: 2.15, hp: 42, damage: 9, growth: 50, factory: () => cloneTemplate(this.modelTemplates.predator, () => createFallbackFish({ bodyColor: 0xff7886, emissiveColor: 0x5b1620, scale: 1.32 })) },
      corpse: { radius: 0.34, speed: 0, hp: 1, damage: 0, growth: 24, factory: () => cloneTemplate(this.modelTemplates.corpse, createFallbackCorpse) },
    }[type];

    const mesh = config.factory();
    mesh.position.set(
      THREE.MathUtils.randFloatSpread(56),
      THREE.MathUtils.randFloat(-2.2, 4.2),
      THREE.MathUtils.randFloatSpread(56),
    );
    this.scene.add(mesh);
    this.entities.push({
      type,
      mesh,
      tail: mesh.getObjectByName("tail"),
      radius: config.radius,
      hp: config.hp,
      maxHp: config.hp,
      damage: config.damage,
      growth: config.growth,
      corpseDecay: type === "corpse" ? THREE.MathUtils.randFloat(16, 24) : 0,
      attackCooldown: 0,
      velocity: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(0.2),
        THREE.MathUtils.randFloatSpread(1),
      ).normalize().multiplyScalar(config.speed),
      speed: config.speed,
    });
  }

  spawnEnvironment() {
    for (let i = 0; i < 12; i += 1) {
      const chunk = cloneTemplate(this.modelTemplates.seafloor, createFallbackSeafloorChunk);
      chunk.position.set(
        THREE.MathUtils.randFloatSpread(90),
        -2.8,
        THREE.MathUtils.randFloatSpread(90),
      );
      chunk.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
      chunk.scale.multiplyScalar(THREE.MathUtils.randFloat(0.8, 1.6));
      this.scene.add(chunk);
    }

    for (let i = 0; i < 18; i += 1) {
      const rock = cloneTemplate(this.modelTemplates.rock, createFallbackRock);
      rock.position.set(
        THREE.MathUtils.randFloatSpread(80),
        THREE.MathUtils.randFloat(-2.6, 1.8),
        THREE.MathUtils.randFloatSpread(80),
      );
      rock.scale.multiplyScalar(THREE.MathUtils.randFloat(0.5, 1.3));
      rock.scale.y *= THREE.MathUtils.randFloat(0.7, 1.8);
      this.scene.add(rock);
    }

    for (let i = 0; i < 16; i += 1) {
      const kelp = cloneTemplate(this.modelTemplates.kelp, createFallbackKelp);
      kelp.position.set(
        THREE.MathUtils.randFloatSpread(84),
        -2.8,
        THREE.MathUtils.randFloatSpread(84),
      );
      kelp.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
      kelp.scale.multiplyScalar(THREE.MathUtils.randFloat(0.85, 1.5));
      this.scene.add(kelp);
    }

    for (let i = 0; i < 14; i += 1) {
      const coral = cloneTemplate(this.modelTemplates.coral, createFallbackCoral);
      coral.position.set(
        THREE.MathUtils.randFloatSpread(84),
        -2.8,
        THREE.MathUtils.randFloatSpread(84),
      );
      coral.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
      coral.scale.multiplyScalar(THREE.MathUtils.randFloat(0.7, 1.4));
      this.scene.add(coral);
    }

    for (let i = 0; i < 4; i += 1) {
      const arch = cloneTemplate(this.modelTemplates.reefArch, createFallbackReefArch);
      arch.position.set(
        THREE.MathUtils.randFloatSpread(70),
        -2.2,
        THREE.MathUtils.randFloatSpread(70),
      );
      arch.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
      arch.scale.multiplyScalar(THREE.MathUtils.randFloat(0.9, 1.35));
      this.scene.add(arch);
    }
  }

  spawnNearPlayerSet() {
    const frontRock = cloneTemplate(this.modelTemplates.rock, createFallbackRock);
    frontRock.position.set(2.8, -2.15, -6.4);
    frontRock.scale.setScalar(2.35);
    frontRock.scale.y *= 1.4;
    this.scene.add(frontRock);

    const leftRock = cloneTemplate(this.modelTemplates.rock, createFallbackRock);
    leftRock.position.set(-6.4, -1.9, -10.8);
    leftRock.scale.setScalar(2.9);
    leftRock.scale.y *= 1.85;
    this.scene.add(leftRock);

    const nearCoral = cloneTemplate(this.modelTemplates.coral, createFallbackCoral);
    nearCoral.position.set(4.8, -2.55, -1.8);
    nearCoral.scale.setScalar(1.4);
    this.scene.add(nearCoral);

    const nearKelp = cloneTemplate(this.modelTemplates.kelp, createFallbackKelp);
    nearKelp.position.set(-4.5, -2.6, -2.4);
    nearKelp.scale.setScalar(1.45);
    this.scene.add(nearKelp);

    const nearArch = cloneTemplate(this.modelTemplates.reefArch, createFallbackReefArch);
    nearArch.position.set(0, -1.8, -18);
    nearArch.scale.setScalar(1.55);
    this.scene.add(nearArch);

    const nearRock = cloneTemplate(this.modelTemplates.rock, createFallbackRock);
    nearRock.position.set(-2.4, -2.1, 5.4);
    nearRock.scale.setScalar(1.55);
    this.scene.add(nearRock);

    this.spawnBubbleColumn(new THREE.Vector3(-3.8, -2.25, -8.6), 16, 4.4);
    this.spawnBubbleColumn(new THREE.Vector3(5.4, -1.9, -13.4), 12, 3.4);
  }

  spawnParticles() {
    const particleCount = 460;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = THREE.MathUtils.randFloatSpread(120);
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(-1.5, 16);
      positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(120);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xdbfffb,
      size: 0.14,
      transparent: true,
      opacity: 0.76,
    });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createPlayerShadow() {
    this.playerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 24),
      new THREE.MeshBasicMaterial({
        color: 0x15312d,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.set(0, -2.92, 0);
    this.scene.add(this.playerShadow);
  }

  spawnBubbleColumn(origin, count, height) {
    const bubbleMaterial = new THREE.MeshBasicMaterial({
      color: 0xf3ffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    for (let index = 0; index < count; index += 1) {
      const bubble = new THREE.Mesh(
        new THREE.RingGeometry(0.045, 0.08 + Math.random() * 0.05, 18),
        bubbleMaterial.clone(),
      );
      bubble.position.set(
        origin.x + THREE.MathUtils.randFloatSpread(1.1),
        origin.y + Math.random() * height,
        origin.z + THREE.MathUtils.randFloatSpread(1.1),
      );
      bubble.userData.floatBaseY = bubble.position.y;
      bubble.userData.floatHeight = height;
      bubble.userData.floatSpeed = 0.35 + Math.random() * 0.35;
      bubble.userData.floatOffset = Math.random() * Math.PI * 2;
      this.scene.add(bubble);
      this.ambientBubbles.push(bubble);
    }
  }

  updateAmbientBubbles(delta) {
    for (const bubble of this.ambientBubbles) {
      bubble.position.y += bubble.userData.floatSpeed * delta;
      bubble.position.x += Math.sin((this.lastTime * 0.0015) + bubble.userData.floatOffset) * delta * 0.18;
      bubble.position.z += Math.cos((this.lastTime * 0.0012) + bubble.userData.floatOffset) * delta * 0.12;
      bubble.rotation.z += delta * 0.65;

      if (bubble.position.y >= bubble.userData.floatBaseY + bubble.userData.floatHeight) {
        bubble.position.y = bubble.userData.floatBaseY;
      }
    }
  }

  bindEvents() {
    this.handleResize = () => {
      if (!this.renderer || !this.camera || !this.container) {
        return;
      }
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };

    this.handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }
      this.mapKey(event.code, true);
    };

    this.handleKeyUp = (event) => {
      this.mapKey(event.code, false);
    };

    this.handlePointerDown = () => {
      this.input.bite = true;
      this.pointerDown = true;
    };

    this.handlePointerUp = () => {
      this.pointerDown = false;
    };

    this.lobbyButton?.addEventListener("click", this.onBackToLobby);
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointerup", this.handlePointerUp);
  }

  mapKey(code, isDown) {
    if (code === "KeyW" || code === "ArrowUp") this.input.forward = isDown;
    if (code === "KeyS" || code === "ArrowDown") this.input.backward = isDown;
    if (code === "KeyA" || code === "ArrowLeft") this.input.left = isDown;
    if (code === "KeyD" || code === "ArrowRight") this.input.right = isDown;
    if (code === "Space") this.input.ascend = isDown;
    if (code === "ShiftLeft" || code === "ShiftRight") this.input.descend = isDown;
    if (code === "KeyE") this.input.bite = isDown;
  }

  loop = (time) => {
    if (!this.running) {
      return;
    }
    const delta = Math.min(0.033, (time - this.lastTime || 16) / 1000);
    this.lastTime = time;
    if (this.pause) {
      this.renderer.render(this.scene, this.camera);
      window.requestAnimationFrame(this.loop);
      return;
    }
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.damageFlash = Math.max(0, this.damageFlash - delta);
    this.updatePlayer(delta);
    this.updateEntities(delta);
    this.updateCombat();
    this.updateCamera(delta);
    this.updateAmbientBubbles(delta);
    this.updateRadar();
    this.updateUi();
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.loop);
  };

  updatePlayer(delta) {
    const phase = PHASES[this.phaseIndex];
    const turnInput = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const swimInput = (this.input.forward ? 1 : 0) - (this.input.backward ? 1 : 0);
    const verticalInput = (this.input.ascend ? 1 : 0) - (this.input.descend ? 1 : 0);
    const targetYawVelocity = turnInput * phase.turnSpeed;
    this.playerYawVelocity = THREE.MathUtils.lerp(this.playerYawVelocity, targetYawVelocity, 1 - Math.exp(-7.5 * delta));
    this.player.rotation.y -= this.playerYawVelocity * delta;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    const targetForwardSpeed = swimInput >= 0 ? (swimInput === 0 ? phase.speed * 0.42 : swimInput * phase.speed) : swimInput * phase.speed * 0.55;
    const currentForwardSpeed = this.playerVelocity.dot(forward);
    const nextForwardSpeed = THREE.MathUtils.lerp(currentForwardSpeed, targetForwardSpeed, 1 - Math.exp(-4.8 * delta));
    const verticalSpeed = THREE.MathUtils.lerp(this.playerVelocity.y, verticalInput * phase.speed * 0.72, 1 - Math.exp(-3.8 * delta));

    this.playerVelocity.copy(forward.multiplyScalar(nextForwardSpeed));
    this.playerVelocity.y = verticalSpeed + Math.sin(this.lastTime * 0.0032) * 0.14;

    this.player.position.addScaledVector(this.playerVelocity, delta);
    this.player.position.y = THREE.MathUtils.clamp(this.player.position.y, -2.5, 9.5);
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -44, 44);
    this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -44, 44);

    if (this.playerShadow) {
      this.playerShadow.position.x = this.player.position.x;
      this.playerShadow.position.z = this.player.position.z;
      this.playerShadow.scale.setScalar(1.15 + this.phaseIndex * 0.2 + Math.abs(nextForwardSpeed) * 0.03);
      this.playerShadow.material.opacity = 0.18 + Math.max(0, 0.12 - this.player.position.y * 0.01);
    }

    if (this.playerTail) {
      this.playerTail.rotation.y = Math.sin(this.lastTime * 0.018) * (0.5 + Math.abs(nextForwardSpeed) * 0.08) + this.playerYawVelocity * 0.18;
    }

    this.player.rotation.z = THREE.MathUtils.lerp(this.player.rotation.z, -this.playerYawVelocity * 0.18, 1 - Math.exp(-5.5 * delta));
    this.player.rotation.x = THREE.MathUtils.lerp(this.player.rotation.x, -verticalInput * 0.22, 1 - Math.exp(-4.2 * delta));

    this.tryEvolve();
    this.player.traverse((child) => {
      if (child.material?.emissiveIntensity !== undefined) {
        child.material.emissiveIntensity = this.damageFlash > 0 ? 1.0 : 0.35;
      }
    });
  }

  updateEntities(delta) {
    const playerPos = this.player.position;
    const playerRadius = 0.95 + this.phaseIndex * 0.28;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    const nextEntities = [];

    for (const entity of this.entities) {
      if (entity.type === "corpse") {
        entity.mesh.rotation.y += delta * 0.35;
        entity.corpseDecay -= delta;
        if (entity.corpseDecay <= 0) {
          this.scene.remove(entity.mesh);
          continue;
        }
        const eatDistance = entity.radius + playerRadius + 0.9;
        if (entity.mesh.position.distanceTo(playerPos) <= eatDistance) {
          this.applyGrowth(entity.growth, entity.type);
          this.healPlayer(entity.growth * 0.14);
          this.scene.remove(entity.mesh);
          continue;
        }
        nextEntities.push(entity);
        continue;
      }

      const toPlayer = playerPos.clone().sub(entity.mesh.position);
      const distanceToPlayer = toPlayer.length();
      const playerLooksAtEntity = forward.dot(toPlayer.clone().normalize());

      if (entity.type === "prey") {
        if (distanceToPlayer < 11) {
          entity.velocity.addScaledVector(toPlayer.normalize().negate(), delta * 5.3);
        } else {
          entity.velocity.add(new THREE.Vector3(
            Math.sin(this.lastTime * 0.001 + entity.mesh.position.z),
            Math.sin(this.lastTime * 0.0013 + entity.mesh.position.x) * 0.08,
            Math.cos(this.lastTime * 0.0011 + entity.mesh.position.x),
          ).multiplyScalar(delta * 0.8));
        }
      } else if (entity.type === "neutral") {
        const playerThreat = this.phaseIndex >= 2 && this.hp > entity.hp;
        if (distanceToPlayer < 8) {
          const responseDirection = toPlayer.normalize();
          if (playerThreat) {
            entity.velocity.addScaledVector(responseDirection.negate(), delta * 3.2);
          } else {
            entity.velocity.addScaledVector(responseDirection, delta * 2.2);
          }
        } else {
          entity.velocity.add(new THREE.Vector3(
            Math.sin(this.lastTime * 0.001 + entity.mesh.position.z),
            Math.sin(this.lastTime * 0.0012 + entity.mesh.position.x) * 0.05,
            Math.cos(this.lastTime * 0.0011 + entity.mesh.position.x),
          ).multiplyScalar(delta * 0.55));
        }
      } else if (entity.type === "predator") {
        const playerThreat = this.phaseIndex >= 2 && this.hp > entity.hp * 0.7;
        const shouldChase = distanceToPlayer < 18 && !playerThreat;
        if (shouldChase) {
          entity.velocity.addScaledVector(toPlayer.normalize(), delta * 4.1);
        } else {
          entity.velocity.addScaledVector(toPlayer.normalize().negate(), delta * 1.5);
          entity.velocity.add(new THREE.Vector3(
            Math.cos(this.lastTime * 0.0012 + entity.mesh.position.z),
            Math.sin(this.lastTime * 0.0013 + entity.mesh.position.x) * 0.05,
            Math.sin(this.lastTime * 0.0011 + entity.mesh.position.x),
          ).multiplyScalar(delta * 0.45));
        }
      }

      entity.velocity.clampLength(0.2, entity.speed);
      entity.mesh.position.addScaledVector(entity.velocity, delta);
      if (Math.abs(entity.mesh.position.x) > 48 || Math.abs(entity.mesh.position.z) > 48) {
        entity.velocity.x *= -1;
        entity.velocity.z *= -1;
      }
      if (entity.mesh.position.y < -2.3 || entity.mesh.position.y > 9) {
        entity.velocity.y *= -1;
      }

      entity.mesh.rotation.y = Math.atan2(entity.velocity.x, entity.velocity.z);
      entity.mesh.rotation.z = THREE.MathUtils.lerp(entity.mesh.rotation.z, -entity.velocity.x * 0.03, 1 - Math.exp(-4.2 * delta));
      entity.mesh.position.y += Math.sin((this.lastTime * 0.001) + entity.mesh.position.x) * delta * 0.4;
      if (entity.tail) {
        entity.tail.rotation.y = Math.sin(this.lastTime * 0.016 + entity.mesh.position.x) * 0.46;
      }

      entity.attackCooldown = Math.max(0, entity.attackCooldown - delta);
      if ((entity.type === "predator" || entity.type === "neutral") && distanceToPlayer < entity.radius + playerRadius + 0.95 && entity.attackCooldown <= 0) {
        const pressure = playerLooksAtEntity < 0 ? 1.14 : 1;
        this.takeDamage(entity.damage * pressure * (entity.type === "neutral" ? 0.65 : 1));
        entity.attackCooldown = entity.type === "neutral" ? 1.45 : 1.1;
      }

      nextEntities.push(entity);
    }

    this.entities = nextEntities;
  }

  updateCombat() {
    if (!this.input.bite || this.attackCooldown > 0) {
      if (!this.pointerDown) {
        this.input.bite = false;
      }
      return;
    }

    this.attackCooldown = 0.55;
    this.input.bite = this.pointerDown;
    const phase = PHASES[this.phaseIndex];
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    let hitSomething = false;

    for (const entity of [...this.entities]) {
      if (entity.type === "corpse") {
        continue;
      }

      const toEntity = entity.mesh.position.clone().sub(this.player.position);
      const distance = toEntity.length();
      if (distance > phase.biteRange + entity.radius) {
        continue;
      }

      const directionDot = forward.dot(toEntity.clone().normalize());
      if (directionDot < 0.25) {
        continue;
      }

      const surpriseBonus = directionDot > 0.82 ? 1.16 : 1;
      const variance = 0.94 + Math.random() * 0.12;
      const damage = phase.biteDamage * surpriseBonus * variance;
      entity.hp -= damage;
      hitSomething = true;

      if (entity.hp <= 0) {
        const corpseGrowth = entity.growth + (entity.type === "predator" ? 20 : 0);
        const corpsePosition = entity.mesh.position.clone();
        const corpseScale = entity.mesh.scale.clone();
        this.scene.remove(entity.mesh);
        this.entities = this.entities.filter((candidate) => candidate !== entity);
        this.spawnCorpseAt(corpsePosition, corpseGrowth, entity.radius * 1.25, corpseScale);
        this.applyGrowth(entity.growth, entity.type);
        if (entity.type === "predator") {
          this.evolution += 1;
          this.setMessage("Predator down. Evolution progress increased.");
        } else {
          this.setMessage("Prey hunted. Eat corpses to heal and grow.");
        }
      }
    }

    if (!hitSomething) {
      this.setMessage("Bite missed.");
    }
  }

  spawnCorpseAt(position, growth, radius, scale = new THREE.Vector3(1, 1, 1)) {
    const corpseMesh = cloneTemplate(this.modelTemplates.corpse, createFallbackCorpse);
    corpseMesh.position.copy(position);
    corpseMesh.scale.copy(scale).multiplyScalar(0.72);
    this.scene.add(corpseMesh);
    this.entities.push({
      type: "corpse",
      mesh: corpseMesh,
      tail: null,
      radius: Math.max(0.28, radius * 0.75),
      hp: 1,
      maxHp: 1,
      damage: 0,
      growth: Math.round(growth * 0.7),
      corpseDecay: THREE.MathUtils.randFloat(14, 22),
      attackCooldown: 0,
      velocity: new THREE.Vector3(),
      speed: 0,
    });
  }

  applyGrowth(amount, sourceType) {
    this.growth += amount;
    if (sourceType === "predator") {
      this.growth += 12;
    }
    this.tryEvolve();
  }

  tryEvolve() {
    while (this.phaseIndex < PHASES.length - 1 && this.growth >= PHASES[this.phaseIndex].growthMax) {
      this.growth -= PHASES[this.phaseIndex].growthMax;
      this.phaseIndex += 1;
      this.evolution += 1;
      const next = PHASES[this.phaseIndex];
      this.maxHp = next.hp;
      this.hp = Math.min(this.maxHp, this.hp + next.hp * 0.35);
      const scale = 1 + this.phaseIndex * 0.35;
      this.player.scale.setScalar(scale);
      this.setMessage(`Evolved to ${next.name}. Camera and bite range increased.`);
      for (let i = 0; i < 2; i += 1) {
        this.spawnEntity("prey");
      }
      if (this.phaseIndex >= 2) {
        this.spawnEntity("predator");
      }
    }
  }

  healPlayer(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.damageFlash = 0.24;
    this.setMessage("Predator bite. Find prey or corpse to recover.");
    if (this.hp <= 0) {
      this.pause = true;
      this.setMessage("You died in the open sea. Return to lobby and try again.");
      window.setTimeout(() => {
        if (this.running) {
          this.onBackToLobby?.();
        }
      }, 1400);
    }
  }

  updateCamera(delta) {
    const targetDistance = 4.4 + this.phaseIndex * 1.2;
    const targetHeight = 1.55 + this.phaseIndex * 0.42;
    const lateralOffset = this.playerYawVelocity * 0.26;
    const behind = new THREE.Vector3(lateralOffset, targetHeight, targetDistance).applyQuaternion(this.player.quaternion);
    const targetPosition = this.player.position.clone().add(behind);
    this.camera.position.lerp(targetPosition, 1 - Math.exp(-4.8 * delta));
    const lookAtTarget = this.player.position.clone().add(new THREE.Vector3(0, 0.42 + this.phaseIndex * 0.08, -0.8));
    this.camera.lookAt(lookAtTarget);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 52 + this.phaseIndex * 2.1, 1 - Math.exp(-3 * delta));
    this.camera.updateProjectionMatrix();
  }

  updateRadar() {
    if (!this.radarScope) {
      return;
    }

    this.radarDots.forEach((dot) => dot.remove());
    this.radarDots = [];

    const scopeRadius = 62;
    const radarRange = 28;

    const addDot = (x, z, className) => {
      const dot = document.createElement("span");
      dot.className = `radar-object ${className}`;
      dot.style.transform = `translate(${x}px, ${z}px)`;
      this.radarScope.appendChild(dot);
      this.radarDots.push(dot);
    };

    addDot(0, 0, "radar-player");

    for (const entity of this.entities) {
      const offsetX = entity.mesh.position.x - this.player.position.x;
      const offsetZ = entity.mesh.position.z - this.player.position.z;
      const length = Math.hypot(offsetX, offsetZ);
      if (length > radarRange) {
        continue;
      }

      const nx = (offsetX / radarRange) * scopeRadius;
      const nz = (offsetZ / radarRange) * scopeRadius;
      addDot(
        THREE.MathUtils.clamp(nx, -scopeRadius, scopeRadius),
        THREE.MathUtils.clamp(nz, -scopeRadius, scopeRadius),
        entity.type === "predator"
          ? "radar-predator"
          : entity.type === "corpse"
            ? "radar-corpse"
            : "radar-prey",
      );
    }
  }

  updateUi() {
    const phase = PHASES[this.phaseIndex];
    const regionIndex = Math.min(REGIONS.length - 1, Math.floor((this.phaseIndex + this.player.position.length() / 26) % REGIONS.length));
    this.phaseNode.textContent = phase.name;
    this.hpNode.textContent = `${Math.round(this.hp)} / ${this.maxHp}`;
    this.growthNode.textContent = `${Math.floor(this.growth)} / ${phase.growthMax}`;
    this.evolutionNode.textContent = `${this.evolution} / ${phase.evoTarget}`;
    this.regionNode.textContent = REGIONS[regionIndex];
    if (this.messageNode && this.messageUntil > 0 && this.lastTime > this.messageUntil) {
      this.messageNode.textContent = "Swim, hunt prey, avoid predators, press E or click to bite.";
      this.messageUntil = 0;
    }
    if (this.particles) {
      this.particles.position.x = this.player.position.x * 0.14;
      this.particles.position.z = this.player.position.z * 0.14;
      this.particles.position.y = 1.2;
    }
  }

  setMessage(message, durationMs = 2400) {
    if (!this.messageNode) {
      return;
    }
    this.messageNode.textContent = message;
    this.messageUntil = this.lastTime + durationMs;
  }

  destroy() {
    this.running = false;
    this.lobbyButton?.removeEventListener("click", this.onBackToLobby);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointerup", this.handlePointerUp);
    this.radarDots.forEach((dot) => dot.remove());
    this.radarDots = [];
    this.ambientBubbles = [];
    this.uiRoot?.classList.add("hidden");
    this.container?.classList.add("hidden");

    if (this.renderer) {
      this.renderer.dispose();
      this.container.innerHTML = "";
    }
  }
}
