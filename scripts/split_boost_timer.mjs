import fs from "node:fs/promises";
import path from "node:path";
import decodeAudio from "audio-decode";
import audioBufferToWav from "audiobuffer-to-wav";

const sourcePath = path.resolve("public/audio/boost-timer.mp3");
const outputDir = path.resolve("public/audio");

function sliceAudioBuffer(audioBuffer, durationSeconds) {
  const frameCount = Math.min(
    audioBuffer.channelData[0].length,
    Math.floor(audioBuffer.sampleRate * durationSeconds),
  );
  const channelData = Array.from(
    { length: audioBuffer.channelData.length },
    () => new Float32Array(frameCount),
  );

  for (let channel = 0; channel < audioBuffer.channelData.length; channel += 1) {
    const source = audioBuffer.channelData[channel];
    channelData[channel].set(source.subarray(0, frameCount));
  }

  return {
    length: frameCount,
    numberOfChannels: audioBuffer.channelData.length,
    sampleRate: audioBuffer.sampleRate,
    getChannelData(channel) {
      return channelData[channel];
    },
  };
}

async function writeClip(audioBuffer, fileName, durationSeconds) {
  const clippedBuffer = sliceAudioBuffer(audioBuffer, durationSeconds);
  const wavBuffer = audioBufferToWav(clippedBuffer);
  const outputPath = path.join(outputDir, fileName);
  await fs.writeFile(outputPath, Buffer.from(wavBuffer));
  console.log(`Wrote ${fileName}`);
}

async function main() {
  const sourceData = await fs.readFile(sourcePath);
  const audioBuffer = await decodeAudio(sourceData);
  await writeClip(audioBuffer, "boost-timer-4s.wav", 4);
  await writeClip(audioBuffer, "boost-timer-7s.wav", 7);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
