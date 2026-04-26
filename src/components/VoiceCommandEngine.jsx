import { useCallback, useEffect, useRef, useState } from "react";
import { mockUserData } from "../data/mockUserData";

const DEBT_SUMMARY_SCRIPT =
  "Aisha, you owe one thousand eight hundred fifty eight ringgit Malaysia. Eight hundred twenty six ringgit Malaysia is due this month.";
const BROWSER_VOICE_HINTS = [
  "natural",
  "neural",
  "online",
  "aria",
  "jenny",
  "sara",
  "samantha",
  "libby",
  "zira",
  "google",
  "microsoft",
];

let humanVoiceAudio = null;
let humanVoiceUrl = "";

// ─── Deep links for each BNPL provider ───────────────────────────────────────
const BNPL_DEEP_LINKS = {
  "Shopee PayLater": "https://shopee.com.my/payment/spaylater",
  SPayLater: "https://shopee.com.my/payment/spaylater",
  "Grab PayLater": "https://consumer.grab.com/my/paylater",
  Atome: "https://www.atome.my/my/account/payment-due",
};

// ─── Intent definitions ───────────────────────────────────────────────────────
const INTENTS = [
  {
    id: "pay_shopee",
    patterns: [/shope/i, /shopee/i, /shoppie/i, /spaylater/i, /s\s?pay/i],
    provider: "Shopee PayLater",
    action: "pay",
  },
  {
    id: "pay_grab",
    patterns: [/grab/i, /paylater/i],
    provider: "Grab PayLater",
    action: "pay",
  },
  {
    id: "pay_atome",
    patterns: [/atome/i],
    provider: "Atome",
    action: "pay",
  },
  {
    id: "pay_all",
    patterns: [/pay.*all|all.*debt|all.*bnpl|clear.*debt/i],
    action: "pay_all",
  },
  {
    id: "nav_overview",
    patterns: [/overview|home|dashboard|score/i],
    action: "navigate",
    screen: "overview",
  },
  {
    id: "nav_signals",
    patterns: [/signal|transaction|spending|history/i],
    action: "navigate",
    screen: "signals",
  },
  {
    id: "nav_forecast",
    patterns: [/forecast|future|predict|what.*happen|next month/i],
    action: "navigate",
    screen: "forecast",
  },
  {
    id: "nav_checkout",
    patterns: [/checkout|buy|purchase|intervention/i],
    action: "navigate",
    screen: "checkout",
  },
  {
    id: "nav_recovery",
    patterns: [/recovery|recover|plan|roadmap|exit|how.*get.*out|debt.*free/i],
    action: "navigate",
    screen: "recovery",
  },
  {
    id: "summary_debt",
    patterns: [/^check\s+my\b|check.*debt|debt.*check|how much.*owe|total.*debt|debt.*total|owe.*total|what.*owe/i],
    action: "summary_debt",
  },
  {
    id: "summary_next",
    patterns: [/next.*payment|when.*due|due.*when|upcoming|what.*pay/i],
    action: "summary_next",
  },
  {
    id: "generate_plan",
    patterns: [/generate.*plan|create.*plan|make.*plan|recovery.*plan|show.*plan/i],
    action: "generate_plan",
  },
];

// ─── Match transcript to intent ───────────────────────────────────────────────
function matchIntent(transcript) {
  const lower = transcript.toLowerCase();

  // Check pay_all first (multi-word)
  if (/pay.*all|all.*debt|all.*bnpl|clear.*debt/.test(lower)) {
    return INTENTS.find((i) => i.id === "pay_all");
  }

  for (const intent of INTENTS) {
    if (intent.patterns.some((p) => p.test(lower))) {
      // For pay intents, also require a pay/debt/clear keyword
      if (intent.action === "pay") {
        if (!/pay|debt|clear|settle|due/i.test(lower)) continue;
      }
      return intent;
    }
  }
  return null;
}

// ─── Build spoken response for each action ────────────────────────────────────
function buildResponse(intent, setScreen, speak) {
  const plans = mockUserData.bnplPlans;

  if (intent.action === "pay") {
    const plan = plans.find((p) => p.provider === intent.provider);
    if (!plan) {
      speak(`No active ${intent.provider} debt found.`);
      return null;
    }
    const url = BNPL_DEEP_LINKS[plan.provider];
    speak(
      `Opening ${plan.provider}. RM${plan.installmentAmount} is due ${formatDate(plan.nextDueDate)}.`
    );
    return { type: "deeplink", url, plan };
  }

  if (intent.action === "pay_all") {
    const total = plans.reduce((s, p) => s + p.installmentAmount, 0);
    speak(
      `${plans.length} active plans. RM${total} is due this month.`
    );
    return { type: "pay_all", plans };
  }

  if (intent.action === "navigate") {
    const labels = {
      overview: "Overview",
      signals: "Signals",
      forecast: "Forecast",
      checkout: "Checkout",
      recovery: "Recovery",
    };
    speak(`Opening ${labels[intent.screen]}.`);
    setScreen(intent.screen);
    return { type: "navigate" };
  }

  if (intent.action === "summary_debt") {
    speak(DEBT_SUMMARY_SCRIPT);
    return { type: "spoken", message: DEBT_SUMMARY_SCRIPT };
  }

  if (intent.action === "summary_next") {
    const sorted = [...plans].sort(
      (a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate)
    );
    const next = sorted[0];
    speak(
      `Next is ${next.provider}, RM${next.installmentAmount}, due ${formatDate(next.nextDueDate)}.`
    );
    return { type: "spoken" };
  }

  if (intent.action === "generate_plan") {
    speak("Opening Recovery.");
    setScreen("recovery");
    return { type: "navigate" };
  }

  return null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "long" });
}

function stopHumanVoice() {
  if (humanVoiceAudio) {
    humanVoiceAudio.pause();
    humanVoiceAudio.currentTime = 0;
  }

  if (humanVoiceUrl) {
    URL.revokeObjectURL(humanVoiceUrl);
    humanVoiceUrl = "";
  }
}

function speakWithBrowserVoice(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.02;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  const preferredVoice = englishVoices
    .map((voice) => {
      const name = `${voice.name} ${voice.lang}`.toLowerCase();
      const score = BROWSER_VOICE_HINTS.reduce(
        (total, hint) => total + (name.includes(hint) ? 1 : 0),
        0,
      );

      return { voice, score };
    })
    .sort((left, right) => right.score - left.score)[0]?.voice;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  }

  window.speechSynthesis.speak(utterance);
}

async function speak(text) {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    speakWithBrowserVoice(text);
    return;
  }

  stopHumanVoice();

  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      throw new Error(`Human voice request failed (${response.status})`);
    }

    const audioBlob = await response.blob();

    if (!audioBlob.size) {
      throw new Error("Human voice response was empty");
    }

    humanVoiceUrl = URL.createObjectURL(audioBlob);
    humanVoiceAudio = new Audio(humanVoiceUrl);
    humanVoiceAudio.onended = stopHumanVoice;
    humanVoiceAudio.onerror = stopHumanVoice;
    await humanVoiceAudio.play();
  } catch (error) {
    console.warn("Human voice playback failed:", error);
    speakWithBrowserVoice(text);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
function VoiceCommandEngine({ setScreen }) {
  const [state, setState] = useState("idle"); // idle | listening | processing | result | error
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null); // { type, message, action }
  const [payAllLinks, setPayAllLinks] = useState([]);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    clearTimeout(timeoutRef.current);
  }, []);

  const handleResult = useCallback(
    (rawTranscript) => {
      setState("processing");
      setTranscript(rawTranscript);

      const intent = matchIntent(rawTranscript);

      const resetEngine = () => {
        resetTimeoutRef.current = setTimeout(() => {
          setState("idle");
          setResult(null);
          setPayAllLinks([]);
          setTranscript("");
        }, 6000);
      };

      if (!intent) {
        setState("error");
        setResult({ message: "I didn't understand that. Try: \"Check my debt\" or \"Go to Recovery\"." });
        speak("Try saying check my debt, or go to recovery.");
        resetEngine();
        return;
      }

      const actionResult = buildResponse(intent, setScreen, speak);

      if (!actionResult) {
        setState("error");
        setResult({ message: "Something went wrong." });
        resetEngine();
        return;
      }

      if (actionResult.type === "deeplink") {
        setState("result");
        setResult({
          type: "deeplink",
          message: `Opening ${actionResult.plan.provider} — RM${actionResult.plan.installmentAmount} due ${formatDate(actionResult.plan.nextDueDate)}`,
          url: actionResult.url,
          plan: actionResult.plan,
        });
        setTimeout(() => window.open(actionResult.url, "_blank", "noopener,noreferrer"), 1200);
      } else if (actionResult.type === "pay_all") {
        setState("result");
        const links = actionResult.plans.map((p) => ({
          provider: p.provider,
          amount: p.installmentAmount,
          due: formatDate(p.nextDueDate),
          url: BNPL_DEEP_LINKS[p.provider],
        }));
        setPayAllLinks(links);
        setResult({ type: "pay_all", message: "Here are all your payment links:" });
      } else {
        setState("result");
        setResult({ type: "spoken", message: actionResult.message || "Done." });
      }

      resetEngine();
    },
    [setScreen]
  );

  const startListening = useCallback(() => {
    clearTimeout(resetTimeoutRef.current);
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setState("error");
      setResult({ message: "Speech recognition is not supported in this browser. Try Chrome." });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-MY";
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState("listening");
      setTranscript("");
      setResult(null);
    };

    recognition.onresult = (e) => {
      let currentTranscript = "";
      let isFinal = false;
      for (let i = 0; i < e.results.length; i++) {
        currentTranscript += e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          isFinal = true;
        }
      }

      setTranscript(currentTranscript);

      if (isFinal) {
        stopListening();
        handleResult(currentTranscript);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech") {
        setState("error");
        setResult({ message: "No speech detected. Try again." });
      } else if (e.error !== "aborted") {
        setState("error");
        setResult({ message: `Mic error: ${e.error}` });
      }
      resetTimeoutRef.current = setTimeout(() => { setState("idle"); setResult(null); }, 3000);
    };

    recognition.onend = () => {
      if (state === "listening") setState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();

    // Auto-stop after 7 seconds
    timeoutRef.current = setTimeout(() => {
      recognition.stop();
    }, 7000);
  }, [handleResult, state, stopListening]);

  const handleMicClick = () => {
    if (state === "listening") {
      stopListening();
      setState("idle");
    } else if (state !== "processing") {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
      stopHumanVoice();
    };
  }, [stopListening]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isActive = isListening || isProcessing;

  return (
    <div className="mt-4 rounded-[16px] border border-[#E6E8EC] bg-white overflow-hidden">
      {/* Mic button */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={isProcessing}
        className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all ${
          isListening
            ? "bg-[#FFF0F0]"
            : isProcessing
            ? "bg-[#F0F4FF]"
            : "hover:bg-[#F8F9FB]"
        } disabled:cursor-not-allowed`}
      >
        {/* Mic icon / waveform */}
        <div
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
            isListening
              ? "bg-[#FEE2E2]"
              : isProcessing
              ? "bg-[#EEF3FD]"
              : "bg-[#F3F4F6]"
          }`}
        >
          {isListening ? (
            <span className="flex items-end gap-[2px] h-4">
              {[1, 1.6, 1, 0.7, 1.3].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-[#C53030]"
                  style={{
                    height: `${h * 8}px`,
                    animation: `voice-bar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                  }}
                />
              ))}
            </span>
          ) : isProcessing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#1652F0" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" stroke="#6B7280" strokeWidth="2"/>
              <path d="M5 10a7 7 0 0 0 14 0" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 19v3" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className={`text-[13px] font-semibold ${
            isListening ? "text-[#C53030]" : isProcessing ? "text-[#1652F0]" : "text-[#111827]"
          }`}>
            {isListening ? "Listening…" : isProcessing ? "Processing…" : "Voice command"}
          </p>
          <p className="mt-0.5 whitespace-normal break-words text-[11px] text-[#9CA3AF]">
            {isListening
              ? transcript || "Speak now"
              : isProcessing
              ? transcript
              : 'Say "Check my debt"'}
          </p>
        </div>

        {isListening && (
          <span className="shrink-0 text-[11px] font-semibold text-[#C53030]">Tap to stop</span>
        )}
      </button>

      {/* Result panel */}
      {(state === "result" || state === "error") && result && (
        <div className={`border-t px-4 py-3 ${
          state === "error" ? "border-[#FEE2E2] bg-[#FFF8F8]" : "border-[#E6E8EC] bg-[#F8FAFF]"
        }`}>
          <p className={`text-[12px] font-semibold ${
            state === "error" ? "text-[#C53030]" : "text-[#1652F0]"
          }`}>
            {result.message}
          </p>

          {/* Pay single — open link button */}
          {result.type === "deeplink" && result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#1652F0] px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Open {result.plan.provider}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}

          {/* Pay all — list of links */}
          {result.type === "pay_all" && payAllLinks.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {payAllLinks.map((link) => (
                <a
                  key={link.provider}
                  href={link.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between rounded-[10px] px-3 py-2 text-[12px] font-semibold ${
                    link.url ? "bg-[#EEF3FD] text-[#1652F0]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                  }`}
                >
                  <span>{link.provider}</span>
                  <span className="flex items-center gap-1">
                    RM{link.amount} · {link.due}
                    {link.url && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hint chips (idle only) */}
      {state === "idle" && (
        <div className="border-t border-[#F3F4F6] px-4 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {[
              "Check my debt",
              "Pay all debts",
              "Next payment",
              "Go to Recovery",
              "How much do I owe",
            ].map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => handleResult(hint)}
                className="rounded-full border border-[#E6E8EC] bg-[#F8F9FB] px-2.5 py-1 text-[11px] font-medium text-[#6B7280] transition hover:border-[#1652F0] hover:text-[#1652F0]"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes voice-bar {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

export default VoiceCommandEngine;
