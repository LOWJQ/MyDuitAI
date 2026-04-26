import { useEffect, useRef, useState } from "react";

const VOICE_PROMPT_PREFIX = `You are MyDuitAI, a calm and intelligent financial advisor speaking directly to Aisha. You have analysed her transaction data and BNPL commitments. Speak in second person, directly to her. Be specific - always reference exact Ringgit amounts, dates, and plan names from the context provided. Write one short voice script only. Keep the explanation under 100 words. Sound like a trusted advisor, not a warning system. Never say based on the data - just speak as if you already know her situation. Never use markdown, asterisks or bullet points - speak in plain natural sentences only.

Her current financial context:
- Name: Aisha
- Monthly income: RM3,000
- Financial Stress Score: 38 (Intervention zone)
- Score dropped 19 points in the last 3 weeks
- Active BNPL plans: 4
- Monthly BNPL burden: RM826
- BNPL ratio: 38% of income (peers average 22%)
- Current end of month balance: RM24
- Next purchase being evaluated: RM505 AirPods
- Projected May cash after next purchase: -RM144
- BNPL payment cluster: Atome RM220 due May 5, Grab PayLater RM180 due May 9, Shopee PayLater RM260 due May 11
- Salary arrives: May 25

Question: `;

const FEMALE_VOICE_HINTS = ["aria", "jenny", "zira", "samantha", "female", "libby", "sara", "hazel"];
const NATURAL_VOICE_HINTS = ["natural", "online", "neural"];
const MAX_CHUNK_LENGTH = 180;
const DEFAULT_SCRIPT_WORD_LIMIT = 100;

const createAudioElement = () => {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  return new Audio();
};

const getPreferredVoice = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  if (!voices.length) {
    return null;
  }

  const preferredNaturalFemaleVoice = voices.find((voice) => {
    const name = `${voice.name} ${voice.lang}`.toLowerCase();
    return (
      name.includes("en") &&
      FEMALE_VOICE_HINTS.some((hint) => name.includes(hint)) &&
      NATURAL_VOICE_HINTS.some((hint) => name.includes(hint))
    );
  });

  const preferredFemaleVoice = voices.find((voice) => {
    const name = `${voice.name} ${voice.lang}`.toLowerCase();
    return name.includes("en") && FEMALE_VOICE_HINTS.some((hint) => name.includes(hint));
  });

  const preferredNaturalEnglishVoice = voices.find((voice) => {
    const name = `${voice.name} ${voice.lang}`.toLowerCase();
    return name.includes("en") && NATURAL_VOICE_HINTS.some((hint) => name.includes(hint));
  });

  return (
    preferredNaturalFemaleVoice ??
    preferredFemaleVoice ??
    preferredNaturalEnglishVoice ??
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ??
    voices[0]
  );
};

const trimToWordLimit = (text, wordLimit) => {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= wordLimit) {
    return text.trim();
  }

  const trimmed = words.slice(0, wordLimit).join(" ").replace(/[,:;-\s]+$/g, "");
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const sanitizeVoiceScript = (text, fallback, wordLimit) => {
  const source = (text || fallback || "").replace(/\s+/g, " ").trim();

  if (!source) {
    return "";
  }

  return trimToWordLimit(source, wordLimit);
};

function AiVoiceButton({
  question,
  fallback,
  scriptWordLimit = DEFAULT_SCRIPT_WORD_LIMIT,
  variant = "inline",
  show = true,
  description = "",
  idleLabel = "Hear voice summary",
  replayLabel = "Replay voice summary",
  loadingLabel = "Generating voice summary...",
  stopLabel = "Stop voice summary",
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [hasPlayed, setHasPlayed] = useState(false);
  const [lastScript, setLastScript] = useState("");
  const utteranceRef = useRef(null);
  const speechChunksRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");

  useEffect(() => {
    audioRef.current = createAudioElement();

    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsSpeaking(false);
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setVoiceStatus("Voice playback failed.");
      };
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const handleVoicesChanged = () => {
        setVoicesReady(true);
      };

      handleVoicesChanged();
      window.speechSynthesis.addEventListener?.("voiceschanged", handleVoicesChanged);

      return () => {
        window.speechSynthesis.cancel();
        window.speechSynthesis.removeEventListener?.("voiceschanged", handleVoicesChanged);
        audioRef.current?.pause();

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = "";
        }
      };
    }

    return () => {
      audioRef.current?.pause();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
      }
    };
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    utteranceRef.current = null;
    speechChunksRef.current = [];
    chunkIndexRef.current = 0;
    setIsSpeaking(false);
    setVoiceStatus("Voice summary stopped.");
  };

  const getJsonErrorMessage = async (response) => {
    try {
      const data = await response.json();
      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
    } catch {
      // Ignore JSON parsing failures and fall through to plain text parsing.
    }

    try {
      const text = await response.text();
      if (text.trim()) {
        return text.trim();
      }
    } catch {
      // Ignore plain text parsing failures and use the default message.
    }

    return `Voice request failed (${response.status})`;
  };

  const getResponseText = (data) => {
    const parts = data?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      return "";
    }

    return parts
      .map((part) => part?.text ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const chunkTextForSpeech = (text) => {
    const sentences = text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    const chunks = [];

    sentences.forEach((sentence) => {
      if (sentence.length <= MAX_CHUNK_LENGTH) {
        chunks.push(sentence);
        return;
      }

      let remaining = sentence;

      while (remaining.length > MAX_CHUNK_LENGTH) {
        const splitAt = remaining.lastIndexOf(",", MAX_CHUNK_LENGTH);
        const boundary = splitAt > 80 ? splitAt : MAX_CHUNK_LENGTH;
        chunks.push(remaining.slice(0, boundary).trim());
        remaining = remaining.slice(boundary).trim();
      }

      if (remaining) {
        chunks.push(remaining);
      }
    });

    return chunks.length ? chunks : [text];
  };

  const speakNextChunk = (voice) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }

    const nextChunk = speechChunksRef.current[chunkIndexRef.current];

    if (!nextChunk) {
      utteranceRef.current = null;
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextChunk);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = 1.04;
    utterance.pitch = 0.98;
    utterance.volume = 1.0;
    utterance.onend = () => {
      chunkIndexRef.current += 1;
      speakNextChunk(voice);
    };
    utterance.onerror = () => {
      chunkIndexRef.current += 1;
      speakNextChunk(voice);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const playVoice = (text = lastScript) => {
    if (!text) {
      return Promise.resolve();
    }

    return (async () => {
      try {
        const response = await fetch("/api/voice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: text }),
        });

        if (!response.ok) {
          throw new Error(await getJsonErrorMessage(response));
        }

        const audioBlob = await response.blob();

        if (!audioBlob.size || !audioRef.current) {
          throw new Error("Empty Gemini audio response");
        }

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        const nextAudioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = nextAudioUrl;
        audioRef.current.src = nextAudioUrl;
        audioRef.current.currentTime = 0;
        setVoiceStatus("Soft voice is playing.");
        setIsSpeaking(true);
        await audioRef.current.play();
        return;
      } catch (error) {
        const failureMessage =
          error instanceof Error ? error.message : "Gemini voice is unavailable right now.";

        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setIsSpeaking(false);
          setVoiceStatus(failureMessage);
          return;
        }

        window.speechSynthesis.cancel();
        const voice = getPreferredVoice();
        speechChunksRef.current = chunkTextForSpeech(text);
        chunkIndexRef.current = 0;

        setVoiceStatus("AI is generating answer.");
        setIsSpeaking(true);
        window.setTimeout(() => {
          if (speechChunksRef.current.length > 0) {
            speakNextChunk(voice);
          }
        }, voicesReady ? 0 : 120);
      }
    })();
  };

  const generateAndPlay = async () => {
    setIsLoading(true);
    setVoiceStatus("Preparing voice summary.");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${VOICE_PROMPT_PREFIX}${question}` }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 90,
              temperature: 0.7,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed (${response.status})`);
      }

      const data = await response.json();
      const generatedText = getResponseText(data);
      const safeText = sanitizeVoiceScript(generatedText, fallback, scriptWordLimit);

      setLastScript(safeText);
      setHasPlayed(true);
      await playVoice(safeText);
    } catch {
      const safeFallback = sanitizeVoiceScript("", fallback, scriptWordLimit);
      setLastScript(safeFallback);
      setHasPlayed(true);
      await playVoice(safeFallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (lastScript) {
      setHasPlayed(true);
      await playVoice(lastScript);
      return;
    }

    await generateAndPlay();
  };

  if (!show) {
    return null;
  }

  const actionLabel = isLoading
    ? loadingLabel
    : isSpeaking
      ? stopLabel
      : hasPlayed
        ? replayLabel
        : idleLabel;

  if (variant === "bar") {
    return (
      <div className="fixed bottom-0 left-[260px] right-0 z-40 border-t border-[#E6E8EC] bg-white px-8 py-5">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[14px] text-[#6B7280]">{description}</p>
            {voiceStatus ? (
              <p className="mt-1 text-[12px] text-[#9CA3AF]">{voiceStatus}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              void handleClick();
            }}
            disabled={isLoading}
            className={`shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition ${
              isSpeaking
                ? "bg-[#0F9D73] hover:bg-[#0B7A59]"
                : "bg-[#1652F0] hover:bg-[#1240C0]"
            } disabled:cursor-not-allowed disabled:bg-[#7A90D9]`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-full border border-[#E6E8EC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1652F0] transition hover:bg-[#EEF3FD] disabled:cursor-not-allowed disabled:text-[#7A90D9] ${
        isSpeaking ? "ring-2 ring-[#1652F0]/20" : ""
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 14H8L13 18V6L8 10H5V14Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M16 9.5C17.3333 10.3333 18 11.1667 18 12C18 12.8333 17.3333 13.6667 16 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span>{actionLabel}</span>
    </button>
  );
}

export default AiVoiceButton;
