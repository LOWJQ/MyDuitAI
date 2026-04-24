import { Buffer } from "node:buffer";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
const GEMINI_TTS_SAMPLE_RATE = 24000;
const GEMINI_TTS_CHANNELS = 1;
const GEMINI_TTS_SAMPLE_WIDTH = 2;

const pcmToWavBuffer = (pcmBuffer, sampleRate = GEMINI_TTS_SAMPLE_RATE, channels = GEMINI_TTS_CHANNELS, sampleWidth = GEMINI_TTS_SAMPLE_WIDTH) => {
  const byteRate = sampleRate * channels * sampleWidth;
  const blockAlign = channels * sampleWidth;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(sampleWidth * 8, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
};

const createGeminiSpeechProxy = () => ({
  name: "gemini-speech-proxy",
  configureServer(server) {
    server.middlewares.use("/api/voice", async (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      const env = loadEnv(server.config.mode, process.cwd(), "");
      const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;

      if (!geminiApiKey) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Gemini API key is not configured" }));
        return;
      }

      try {
        const chunks = [];

        for await (const chunk of req) {
          chunks.push(chunk);
        }

        const bodyText = Buffer.concat(chunks).toString("utf8");
        const body = bodyText ? JSON.parse(bodyText) : {};
        const input = typeof body.input === "string" ? body.input.trim() : "";

        if (!input) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing input text" }));
          return;
        }

        const ttsPrompt = [
          "Read this exactly in a soft, warm, gentle, reassuring voice with calm pacing.",
          "Sound supportive and natural, not robotic or overly dramatic.",
          "",
          input,
        ].join("\n");

        const upstreamResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`,
          {
          method: "POST",
          headers: {
            "x-goog-api-key": geminiApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: ttsPrompt }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Achernar",
                  },
                },
              },
            },
          }),
          },
        );

        if (!upstreamResponse.ok) {
          const errorText = await upstreamResponse.text();
          res.statusCode = upstreamResponse.status;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: errorText || "Gemini speech request failed",
            }),
          );
          return;
        }

        const responseData = await upstreamResponse.json();
        const audioParts = responseData?.candidates?.[0]?.content?.parts ?? [];
        const pcmChunks = audioParts
          .map((part) => part?.inlineData?.data)
          .filter((value) => typeof value === "string" && value.length > 0)
          .map((value) => Buffer.from(value, "base64"));

        if (!pcmChunks.length) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Gemini did not return audio data" }));
          return;
        }

        const pcmBuffer = Buffer.concat(pcmChunks);
        const audioBuffer = pcmToWavBuffer(pcmBuffer);
        res.statusCode = 200;
        res.setHeader("Content-Type", "audio/wav");
        res.setHeader("Cache-Control", "no-store");
        res.end(audioBuffer);
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Unable to generate Gemini speech",
          }),
        );
      }
    });
  },
  configurePreviewServer(server) {
    return this.configureServer(server);
  },
});

export default defineConfig({
  plugins: [react(), createGeminiSpeechProxy()],
});
