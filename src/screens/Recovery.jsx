import { useEffect, useMemo, useRef, useState } from "react";

const recoveryState = { completed: false, response: null };

const recoveryLines = [
  "Reviewing all active BNPL commitments...",
  "Calculating remaining monthly income after essentials...",
  "Prioritising plans by urgency and interest risk...",
  "Modelling month-by-month payoff trajectory...",
  "Identifying earliest possible debt-free date...",
  "Generating personalised recommendations...",
];

const prompt = `You are a financial recovery AI for MyDuitAI, a Malaysian fintech app.
Generate a concise, practical, dashboard-friendly BNPL debt exit roadmap for this user.
Do NOT write a long letter.
Do NOT include greetings, disclaimers, emotional preamble, or repeated explanations.
Keep the response compact and easy to scan.
Target 4 short sections only.
Use short bullets and short monthly entries.
Keep total length under 450 words.

USER PROFILE:
- Name: Aisha, Age: 23
- Monthly Income: RM3,000
- Employment: Junior customer support executive
- Current Financial Stress Score: 51 (Danger zone)
- Remaining cash after all obligations this month: RM24

ACTIVE BNPL PLANS:
1. Atome - Workwear capsule refresh - RM220/month - 3 installments remaining - due 5th of each month
2. Shopee PayLater - Desk chair and room storage - RM260/month - 2 installments remaining - due 11th of each month  
3. Grab PayLater - Concert ticket - RM180/month - 1 installment remaining - due 9th of each month
4. SPayLater - Samsung Galaxy Buds Pro - RM166/month - 3 installments remaining - due 11th of each month (DO NOT PROCEED - intervention active)

MONTHLY ESSENTIALS (non-negotiable):
- Rent: RM680
- Groceries: RM450
- Transport & phone: RM250
- Family support: RM120
- Utilities: RM74
- Subscriptions: RM69

Generate a recovery plan with:
1. A priority order for clearing each BNPL plan and why
2. A month-by-month breakdown for the next 4 months (May, June, July, August 2026) showing: which plans are active, total BNPL burden that month, estimated remaining cash, and one actionable tip
3. The projected debt-free date (when all BNPL plans are cleared)
4. 3 specific behavioural recommendations to prevent falling into this situation again

Format rules:
- Use exactly these 4 headers:
## Priority Order
## Monthly Roadmap
## Debt-Free Date
## Behaviour Changes
- Under "Priority Order", use 4 numbered lines only
- Under "Monthly Roadmap", use exactly 4 bullets only:
  - May 2026: ...
  - June 2026: ...
  - July 2026: ...
  - August 2026: ...
- Each monthly bullet must stay on one compact paragraph and include:
  active plans, total BNPL burden, estimated remaining cash, and one action
- Under "Debt-Free Date", give 1 short paragraph only
- Under "Behaviour Changes", give exactly 3 bullets only

Use RM for currency. Be specific with numbers. Keep the tone supportive but brief. Address Aisha directly only once if needed.`;

function Recovery() {
  const [stage, setStage] = useState(
    recoveryState.completed && recoveryState.response ? "results" : "initial",
  );
  const [responseText, setResponseText] = useState(recoveryState.response ?? "");
  const [visibleCount, setVisibleCount] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [resultsVisible, setResultsVisible] = useState(
    recoveryState.completed && Boolean(recoveryState.response),
  );
  const runIdRef = useRef(0);

  useEffect(() => {
    if (stage !== "loading") {
      return undefined;
    }

    setVisibleCount(1);
    setAnimationDone(false);
    let lineIndex = 0;

    const interval = window.setInterval(() => {
      lineIndex += 1;

      if (lineIndex >= recoveryLines.length) {
        window.clearInterval(interval);
        const doneTimer = window.setTimeout(() => {
          setAnimationDone(true);
        }, 600);

        interval._doneTimer = doneTimer;
        return;
      }

      setVisibleCount(lineIndex + 1);
    }, 700);

    return () => {
      window.clearInterval(interval);
      if (interval._doneTimer) {
        window.clearTimeout(interval._doneTimer);
      }
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "loading" || !animationDone || !requestDone) {
      return;
    }

    if (requestError) {
      setStage("error");
      return;
    }

    recoveryState.completed = true;
    recoveryState.response = responseText;
    setStage("results");
    window.requestAnimationFrame(() => {
      setResultsVisible(true);
    });
  }, [animationDone, requestDone, requestError, responseText, stage]);

  const renderInlineText = (text, keyPrefix) => {
    const segments = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

    return segments.map((segment, index) => {
      if (/^\*\*.*\*\*$/.test(segment)) {
        return (
          <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold text-[#111827]">
            {segment.slice(2, -2)}
          </strong>
        );
      }

      return <span key={`${keyPrefix}-text-${index}`}>{segment}</span>;
    });
  };

  const formattedResponse = useMemo(() => {
    return responseText.split("\n").map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={`empty-${index}`} className="mb-3" />;
      }

      if (/^#{1,2}\s/.test(trimmed)) {
        return (
          <p
            key={`heading-${index}`}
            className="mb-2 mt-6 text-[17px] font-semibold text-[#111827]"
          >
            {renderInlineText(trimmed.replace(/^#{1,2}\s*/, ""), `heading-${index}`)}
          </p>
        );
      }

      if (/^(\d+)\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^(\d+)\.\s*/, "");

        return (
          <div
            key={`number-${index}`}
            className="mb-1 mt-4 flex items-start gap-2 text-[14px] font-semibold text-[#111827]"
          >
            <span className="shrink-0">{trimmed.match(/^(\d+)\./)?.[0]}</span>
            <p className="min-w-0">{renderInlineText(content, `number-${index}`)}</p>
          </div>
        );
      }

      if (/^[-•]\s/.test(trimmed)) {
        const content = trimmed.replace(/^[-•]\s*/, "");

        return (
          <div key={`bullet-${index}`} className="my-1 ml-4 flex items-start gap-3">
            <span className="mt-[8px] text-[14px] text-[#1652F0]">•</span>
            <p className="text-[14px] leading-relaxed text-[#374151]">
              {renderInlineText(content, `bullet-${index}`)}
            </p>
          </div>
        );
      }

      return (
        <p key={`text-${index}`} className="my-1 text-[14px] leading-relaxed text-[#374151]">
          {renderInlineText(trimmed, `text-${index}`)}
        </p>
      );
    });
  }, [responseText]);

  const startGeneration = async () => {
    const runId = Date.now();
    runIdRef.current = runId;
    setStage("loading");
    setVisibleCount(0);
    setAnimationDone(false);
    setRequestDone(false);
    setRequestError("");
    setResultsVisible(false);
    setResponseText("");

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
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        let errorMessage = `Gemini request failed (${response.status})`;

        try {
          const errorData = await response.json();
          errorMessage = errorData?.error?.message || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Ignore secondary parsing failures and keep the default message.
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No recovery plan returned");
      }

      if (runIdRef.current !== runId) {
        return;
      }

      setResponseText(text);
      setRequestDone(true);
    } catch (error) {
      if (runIdRef.current !== runId) {
        return;
      }

      setRequestError(
        error instanceof Error ? error.message : "Unable to generate recovery plan",
      );
      console.error("Recovery Gemini request failed:", error);
      setRequestDone(true);
    }
  };

  const resetToInitial = () => {
    setStage("initial");
    setVisibleCount(0);
    setAnimationDone(false);
    setRequestDone(false);
    setRequestError("");
    setResultsVisible(false);
    setResponseText("");
  };

  if (stage === "initial") {
    return (
      <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
        <div className="flex min-h-[60vh] items-center justify-center px-8">
          <div className="mx-auto w-full max-w-2xl rounded-[20px] border border-[#E6E8EC] bg-white p-10 text-center">
            <p className="text-[12px] uppercase tracking-[0.2em] text-[#6B7280]">
              AI Recovery Engine
            </p>
            <h2 className="mt-3 text-[22px] font-semibold text-[#111827]">
              Generate your personalised debt exit roadmap
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
              The AI will analyse your active BNPL plans, remaining income, and stress
              trajectory to build a realistic month-by-month recovery plan.
            </p>
            <button
              type="button"
              onClick={startGeneration}
              className="mt-6 rounded-full bg-[#1652F0] px-6 py-3 font-semibold text-white transition hover:bg-[#1240C0]"
            >
              Generate Recovery Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "loading") {
    const hasFinishedLines = visibleCount >= recoveryLines.length;
    const progressWidth = requestDone
      ? 100
      : hasFinishedLines
        ? 92
        : (visibleCount / recoveryLines.length) * 92;

    return (
      <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
        <style>
          {`
            @keyframes recovery-pulse {
              0%, 100% {
                transform: scale(0.9);
                opacity: 0.5;
              }
              50% {
                transform: scale(1.15);
                opacity: 1;
              }
            }

            @keyframes recovery-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div className="flex min-h-[60vh] items-center justify-center px-8">
          <div className="mx-auto w-full max-w-2xl rounded-[20px] border border-[#E6E8EC] bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                  MyDuitAI Recovery Engine
                </p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#111827]">
                  Building your recovery roadmap
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#EEF3FD] p-2.5">
                <div
                  className="h-full w-full rounded-full border-2 border-[#BFDBFE] border-t-[#1652F0]"
                  style={{ animation: "recovery-spin 0.9s linear infinite" }}
                />
              </div>
            </div>

            <div className="mt-6 h-[6px] overflow-hidden rounded-full bg-[#EEF1F4]">
              <div
                className="h-full rounded-full bg-[#1652F0] transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <div className="mt-6 space-y-3">
              {recoveryLines.slice(0, visibleCount).map((line, index) => {
                const isLastLine = index === recoveryLines.length - 1;
                const isActive =
                  (!hasFinishedLines && index === visibleCount - 1) ||
                  (hasFinishedLines && !requestDone && isLastLine);

                return (
                  <div key={`${line}-${index}`} className="flex items-start gap-3">
                    <div className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center">
                      {isActive ? (
                        <span
                          className="block h-2.5 w-2.5 rounded-full bg-[#1652F0]"
                          style={{ animation: "recovery-pulse 1s ease-in-out infinite" }}
                        />
                      ) : (
                        <span className="text-[14px] font-semibold text-[#1652F0]">✓</span>
                      )}
                    </div>
                    <p
                      className={`text-[15px] leading-relaxed ${
                        isActive ? "text-[#1652F0]" : "text-[#111827]"
                      }`}
                    >
                      {line}
                    </p>
                  </div>
                );
              })}

              {hasFinishedLines && !requestDone ? (
                <div className="flex items-start gap-3">
                  <div className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center">
                    <span
                      className="block h-2.5 w-2.5 rounded-full bg-[#1652F0]"
                      style={{ animation: "recovery-pulse 1s ease-in-out infinite" }}
                    />
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#1652F0]">
                    Finalising Gemini response...
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
        <div className="flex min-h-[60vh] items-center justify-center px-8">
          <div className="mx-auto w-full max-w-2xl rounded-[20px] border border-[#E6E8EC] bg-white p-10 text-center">
            <p className="text-[16px] font-semibold text-[#111827]">
              Unable to generate recovery plan.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
              {requestError || "Please try again."}
            </p>
            <button
              type="button"
              onClick={resetToInitial}
              className="mt-6 rounded-full bg-[#1652F0] px-6 py-3 font-semibold text-white transition hover:bg-[#1240C0]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
      <div
        className={`mx-auto max-w-[1180px] transition-opacity duration-[400ms] ${
          resultsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="mb-6 rounded-[20px] border border-[#E6E8EC] bg-white p-6">
          <p className="text-[12px] uppercase tracking-[0.2em] text-[#6B7280]">
            AI-Generated Recovery Plan
          </p>
          <h2 className="mt-1 text-[22px] font-semibold text-[#111827]">
            Your path to financial freedom, Aisha
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Generated based on your live financial data and active BNPL commitments.
          </p>
          <span className="mt-3 inline-block rounded-full border border-[#D7E8D8] bg-[#F7FCF9] px-3 py-1 text-[12px] font-semibold text-[#0F9D73]">
            Debt-free roadmap ready
          </span>
        </div>

        <div className="rounded-[20px] border border-[#E6E8EC] bg-white p-8">
          {formattedResponse}
        </div>
      </div>
    </div>
  );
}

export default Recovery;
