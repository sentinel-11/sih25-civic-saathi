import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIAnalysis {
  domain: string;
  category: string;
  urgency: string;
  priority: string;
  severity: string;
  confidence: number;
  reasoning: string;
  estimatedCost: string;
  timeToResolve: string;
  riskLevel: string;
}

// Client-side Speech-to-Text using Gemini 1.5 (requires VITE_GEMINI_API_KEY)
// Encode ArrayBuffer to base64
function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as any
    );
  }
  return btoa(binary);
}

// Convert a Blob (webm/opus) to WAV base64 (PCM 16-bit, 16k mono) for maximum compatibility
async function blobToWavBase64(blob: Blob): Promise<string> {
  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const arrayBuf = await blob.arrayBuffer();
  const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
  // Take channel 0, resample handled by AudioContext options
  const channel = audioBuf.getChannelData(0);
  // PCM 16-bit
  const buffer = new ArrayBuffer(44 + channel.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  }
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + channel.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, channel.length * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < channel.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, channel[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const b64 = arrayBufferToBase64(buffer);
  try {
    await audioCtx.close();
  } catch {}
  return b64;
}

export async function transcribeAudioWithGemini(audio: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY");
    return "";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt =
    "Transcribe the following audio to plain text (auto-detect language). Reply with text only.";

  // Attempt 1: send original blob mime (e.g., audio/webm;codecs=opus)
  try {
    const buffer = await audio.arrayBuffer();
    const base64Audio = arrayBufferToBase64(buffer);
    const mime = audio.type || "audio/webm;codecs=opus";
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: mime, data: base64Audio } },
    ]);
    const text = result.response.text().trim();
    if (text) return text;
  } catch (e) {
    console.warn("Primary Gemini STT attempt failed, retrying as WAV:", e);
  }

  // Attempt 2: convert to WAV 16k PCM for maximum compatibility
  try {
    const wavB64 = await blobToWavBase64(audio);
    const result2 = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "audio/wav", data: wavB64 } },
    ]);
    return result2.response.text().trim();
  } catch (e2) {
    console.error("Gemini STT failed (WAV fallback):", e2);
    return "";
  }
}

export async function analyzeIssue(
  description: string,
  imageBase64?: string
): Promise<AIAnalysis> {
  try {
    const response = await fetch("/api/analyze-issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing issue:", error);
    // Fallback analysis
    return {
      domain: "General Maintenance",
      category: "General Issue",
      urgency: "STANDARD",
      priority: "MEDIUM",
      severity: "MEDIUM",
      confidence: 0.5,
      reasoning:
        "Analysis failed, manual review required. Please verify the issue details and category manually.",
      estimatedCost: "$100-500",
      timeToResolve: "1-2 days",
      riskLevel: "MEDIUM",
    };
  }
}
