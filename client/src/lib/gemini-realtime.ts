// Gemini Realtime WebSocket client for live speech-to-text in the browser
// NOTE: Requires VITE_GEMINI_API_KEY exposed to the frontend.
// This is a best-effort implementation of Google's Realtime protocol.

export type RealtimeClient = {
  start: () => Promise<void>
  stop: () => void
  isActive: () => boolean
}

export function createGeminiRealtimeClient(opts: {
  onTextDelta: (delta: string) => void
  onError?: (e: any) => void
  instructions?: string
}): RealtimeClient {
  const onTextDelta = opts.onTextDelta
  const onError = opts.onError ?? (() => {})
  const instructions =
    opts.instructions ??
    'Transcribe the incoming audio to plain text. Stream text deltas as you decode them. Output only the transcript.'

  let ws: WebSocket | null = null
  let audioCtx: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let processor: ScriptProcessorNode | null = null
  let active = false

  // Convert Float32 PCM [-1,1] to 16-bit PCM, then base64
  function floatTo16BitPCM(float32: Float32Array): Uint8Array {
    const buffer = new ArrayBuffer(float32.length * 2)
    const view = new DataView(buffer)
    let offset = 0
    for (let i = 0; i < float32.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return new Uint8Array(buffer)
  }

  function toBase64(u8: Uint8Array): string {
    let binary = ''
    const len = u8.byteLength
    for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i])
    return btoa(binary)
  }

  async function start() {
    if (active) return
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined
    if (!apiKey) {
      onError(new Error('Missing VITE_GEMINI_API_KEY'))
      return
    }

    // Capture mic at 16k mono
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } })
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
    sourceNode = audioCtx.createMediaStreamSource(mediaStream)
    processor = audioCtx.createScriptProcessor(4096, 1, 1)

    // Establish WS to Gemini Realtime
    const url = `wss://generativelanguage.googleapis.com/ws/models/gemini-1.5-flash?key=${apiKey}`
    ws = new WebSocket(url)

    ws.onerror = (e) => onError(e)
    ws.onclose = () => {
      active = false
    }

    ws.onopen = () => {
      active = true
      // Optional session update
      const sessionUpdate = {
        event: 'session.update',
        session: {
          modalities: ['text'],
          turn_detection: { type: 'none' },
        },
      }
      try { ws!.send(JSON.stringify(sessionUpdate)) } catch {}

      // Kick off a response; model will consume appended audio buffers
      const create = {
        event: 'response.create',
        response: {
          instructions,
          modalities: ['text'],
        },
      }
      try { ws!.send(JSON.stringify(create)) } catch {}

      // Start pumping audio chunks
      processor!.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!active || ws!.readyState !== WebSocket.OPEN) return
        const input = e.inputBuffer.getChannelData(0)
        const u8 = floatTo16BitPCM(input)
        const base64 = toBase64(u8)
        const append = {
          event: 'input_audio_buffer.append',
          audio: {
            data: base64,
            mime_type: 'audio/raw;encoding=signed-integer;bits=16;rate=16000;channels=1',
          },
        }
        try { ws!.send(JSON.stringify(append)) } catch {}

        // Commit periodically; here on every buffer for simplicity
        const commit = { event: 'input_audio_buffer.commit' }
        try { ws!.send(JSON.stringify(commit)) } catch {}
      }

      sourceNode!.connect(processor!)
      processor!.connect(audioCtx!.destination)
    }

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data as string)
        // Text delta event name as per Realtime schema
        if (data?.event === 'response.output_text.delta' && typeof data?.delta === 'string') {
          onTextDelta(data.delta)
        }
        // Some implementations send chunks under different envelope
        if (data?.response?.output_text?.delta) {
          onTextDelta(String(data.response.output_text.delta))
        }
      } catch {
        // Non-JSON frames may be ignored
      }
    }
  }

  function stop() {
    active = false
    try { processor && (processor.onaudioprocess = null as any) } catch {}
    try { sourceNode && sourceNode.disconnect() } catch {}
    try { processor && processor.disconnect() } catch {}
    try { audioCtx && audioCtx.close() } catch {}
    try { mediaStream && mediaStream.getTracks().forEach((t) => t.stop()) } catch {}
    try { ws && ws.close() } catch {}
    ws = null
    audioCtx = null
    mediaStream = null
    sourceNode = null
    processor = null
  }

  function isActive() { return active }

  return { start, stop, isActive }
}

