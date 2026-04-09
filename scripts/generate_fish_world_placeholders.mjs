import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer()
      .then((result) => {
        this.result = result;
        this.onloadend?.();
      })
      .catch((error) => {
        this.error = error;
        this.onerror?.(error);
      });
  }
}

globalThis.FileReader = globalThis.FileReader || NodeFileReader;

const outDir = path.resolve("public/fish-world-assets/models");

function createFish({ bodyColor, emissiveColor, scale = 1 }) {
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

  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.82, 4),
    bodyMaterial.clone(),
  );
  tail.name = "tail";
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-1.02, 0, 0);
  tail.scale.set(1, 0.62, 1);
  root.add(tail);

  const dorsal = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.46, 3),
    bodyMaterial.clone(),
  );
  dorsal.name = "dorsal";
  dorsal.position.set(0, 0.34, 0);
  dorsal.rotation.z = Math.PI;
  root.add(dorsal);

  const finLeft = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.38, 3),
    bodyMaterial.clone(),
  );
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

function createNeutralFish() {
  return createFish({
    bodyColor: 0x94c7ff,
    emissiveColor: 0x18425a,
    scale: 0.9,
  });
}

function createCorpse() {
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

function createRock() {
  const root = new THREE.Group();
  root.name = "rock-root";
  const material = new THREE.MeshStandardMaterial({
    color: 0x315363,
    roughness: 0.95,
  });
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), material);
  rock.name = "rock";
  rock.scale.set(1.2, 1.7, 1);
  root.add(rock);
  return root;
}

function createKelpCluster() {
  const root = new THREE.Group();
  root.name = "kelp-root";
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f7d59,
    emissive: 0x0d2a1c,
    emissiveIntensity: 0.16,
    roughness: 0.92,
  });

  for (let i = 0; i < 5; i += 1) {
    const stem = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 4 + i * 0.4), stemMaterial);
    stem.position.set((i - 2) * 0.35, 1.8 + i * 0.08, (i % 2 === 0 ? 0.18 : -0.12));
    stem.rotation.y = (i - 2) * 0.22;
    stem.rotation.z = (i - 2) * 0.06;
    root.add(stem);
  }

  return root;
}

function createCoralCluster() {
  const root = new THREE.Group();
  root.name = "coral-root";
  const coralMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f55b8,
    emissive: 0x2c1848,
    emissiveIntensity: 0.2,
    roughness: 0.84,
  });

  for (let i = 0; i < 6; i += 1) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 1.4 + i * 0.18, 7), coralMaterial);
    branch.position.set(Math.cos(i) * 0.55, 0.7 + i * 0.08, Math.sin(i) * 0.55);
    branch.rotation.z = (i - 2.5) * 0.18;
    branch.rotation.x = (i % 2 === 0 ? 0.22 : -0.18);
    root.add(branch);
  }

  return root;
}

function createReefArch() {
  const root = new THREE.Group();
  root.name = "reef-arch-root";
  const material = new THREE.MeshStandardMaterial({
    color: 0x416877,
    roughness: 0.95,
  });
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

function createSeafloorChunk() {
  const root = new THREE.Group();
  root.name = "seafloor-root";
  const sandMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7450,
    roughness: 1,
  });
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.4, 1.1, 10), sandMaterial);
  sand.scale.set(1.4, 0.28, 1.2);
  root.add(sand);

  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfb786,
    roughness: 0.9,
  });
  for (let i = 0; i < 5; i += 1) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), shellMaterial);
    shell.scale.y = 0.35;
    shell.position.set((i - 2) * 0.9, 0.18, (i % 2 === 0 ? 0.6 : -0.4));
    root.add(shell);
  }
  return root;
}

async function exportGlb(filename, object) {
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(object, { binary: true });
  await fs.writeFile(path.join(outDir, filename), Buffer.from(arrayBuffer));
}

await fs.mkdir(outDir, { recursive: true });

await exportGlb("player-fish.glb", createFish({
  bodyColor: 0xffb24c,
  emissiveColor: 0x145d7a,
  scale: 1.05,
}));

await exportGlb("prey-fish.glb", createFish({
  bodyColor: 0x74f0ff,
  emissiveColor: 0x0f4d62,
  scale: 0.6,
}));

await exportGlb("neutral-fish.glb", createNeutralFish());

await exportGlb("predator-fish.glb", createFish({
  bodyColor: 0xff7886,
  emissiveColor: 0x5b1620,
  scale: 1.32,
}));

await exportGlb("corpse-resource.glb", createCorpse());
await exportGlb("reef-rock.glb", createRock());
await exportGlb("kelp-cluster.glb", createKelpCluster());
await exportGlb("coral-cluster.glb", createCoralCluster());
await exportGlb("reef-arch.glb", createReefArch());
await exportGlb("seafloor-chunk.glb", createSeafloorChunk());
