export function createTextures(scene) {
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.clear();
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillCircle(8, 8, 8);
  graphics.generateTexture("bubble-particle", 16, 16);

  graphics.clear();
  graphics.fillStyle(0xffffff, 1);
  graphics.fillRect(0, 0, 4, 4);
  graphics.generateTexture("hitbox-proxy", 4, 4);

  graphics.destroy();
}
