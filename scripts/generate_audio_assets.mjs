import fs from "node:fs/promises";
import path from "node:path";

const sampleRate = 24000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function writeWavMono(samples, outputPath) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const pcm = Math.round(clamp(samples[i], -1, 1) * 32767);
    buffer.writeInt16LE(pcm, 44 + i * 2);
  }

  return fs.writeFile(outputPath, buffer);
}

function generateSeaLoop(durationSeconds = 10) {
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(totalSamples);
  let brown = 0;
  let swellPhase = 0;
  let shimmerPhase = 0;

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    brown = (brown + (Math.random() * 2 - 1) * 0.013) * 0.995;
    shimmerPhase += 0.0011 + Math.sin(t * 0.09) * 0.00008;
    swellPhase += 0.00018 + Math.sin(t * 0.11) * 0.00004;
    const lowWave = Math.sin(t * Math.PI * 2 * 0.09) * 0.04;
    const midWave = Math.sin(t * Math.PI * 2 * 0.21 + Math.sin(t * 0.17) * 0.45) * 0.024;
    const wash = Math.sin(swellPhase) * 0.022 + Math.sin(shimmerPhase) * 0.013;
    const foam = (Math.random() * 2 - 1) * 0.012 * (0.35 + 0.65 * Math.sin(t * 0.31) ** 2);
    const envelope = 0.74 + Math.sin(t * 0.18) * 0.04;
    samples[i] = (brown * 0.6 + lowWave + midWave + wash + foam) * envelope;
  }

  const seamBlendSamples = Math.floor(sampleRate * 0.45);
  for (let i = 0; i < seamBlendSamples; i += 1) {
    const mix = i / seamBlendSamples;
    samples[totalSamples - seamBlendSamples + i] =
      samples[totalSamples - seamBlendSamples + i] * (1 - mix) + samples[i] * mix;
  }

  const fadeSamples = Math.floor(sampleRate * 0.18);
  for (let i = 0; i < fadeSamples; i += 1) {
    const fadeIn = i / fadeSamples;
    const fadeOut = (fadeSamples - i) / fadeSamples;
    samples[i] *= fadeIn;
    samples[totalSamples - 1 - i] *= fadeOut;
  }

  return samples;
}

function generateMoveClick(durationSeconds = 0.16) {
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(totalSamples);
  let wash = 0;

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 15);
    wash = (wash + (Math.random() * 2 - 1) * 0.1) * 0.86;
    const splashBody = Math.sin(2 * Math.PI * (430 - t * 900) * t) * 0.12 * Math.exp(-t * 10);
    const waterNoise = wash * 0.22 * Math.exp(-t * 13);
    const bubble = Math.sin(2 * Math.PI * 160 * t) * 0.035 * Math.exp(-t * 8);
    const flick = (Math.random() * 2 - 1) * 0.018 * Math.exp(-t * 26);
    samples[i] = (splashBody + waterNoise + bubble + flick) * env;
  }

  return samples;
}

async function main() {
  const outputDir = path.resolve("public/audio");
  await fs.mkdir(outputDir, { recursive: true });
  await writeWavMono(generateSeaLoop(8), path.join(outputDir, "sea-ambient-loop.wav"));
  await writeWavMono(generateMoveClick(0.16), path.join(outputDir, "movement-click.wav"));
  console.log("Generated sea-ambient-loop.wav and movement-click.wav");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
