import { useEffect, useMemo, useState } from "react";

function AnalysisOverlay({
  lines = [],
  onComplete,
  inline = false,
  containerClassName = "",
  cardClassName = "",
}) {
  const safeLines = useMemo(() => lines.filter(Boolean), [lines]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setVisibleCount(0);
    setIsExiting(false);

    if (!safeLines.length) {
      const emptyTimer = window.setTimeout(() => {
        setIsExiting(true);
      }, 600);
      const finishTimer = window.setTimeout(() => {
        onComplete?.();
      }, 900);

      return () => {
        window.clearTimeout(emptyTimer);
        window.clearTimeout(finishTimer);
      };
    }

    let lineIndex = 0;
    let interval;

    const startTimer = window.setTimeout(() => {
      setVisibleCount(1);

      interval = window.setInterval(() => {
        lineIndex += 1;

        if (lineIndex >= safeLines.length) {
          window.clearInterval(interval);
          return;
        }

        setVisibleCount(lineIndex + 1);
      }, 700);
    }, 300);

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, 300 + 700 * safeLines.length + 600);

    const finishTimer = window.setTimeout(() => {
      onComplete?.();
    }, 300 + 700 * safeLines.length + 900);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) {
        window.clearInterval(interval);
      }
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onComplete, safeLines]);

  const activeIndex = isExiting ? -1 : Math.min(visibleCount - 1, safeLines.length - 1);

  return (
    <>
      <style>
        {`
          @keyframes analysis-overlay-pulse {
            0%, 100% {
              transform: scale(0.9);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.15);
              opacity: 1;
            }
          }

          @keyframes analysis-overlay-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        className={`${
          inline
            ? `transition-opacity duration-300 ${containerClassName}`
            : "fixed inset-0 z-[2147483000] flex items-center justify-center bg-[#F7F9FC]/88 px-6 py-10 transition-opacity duration-300"
        } ${isExiting ? "opacity-0" : "opacity-100"}`}
      >
        <div
          className={`w-full rounded-[20px] border border-[#E6E8EC] bg-white p-7 shadow-sm ${
            cardClassName || "max-w-[680px]"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                MyDuitAI Analysis Engine
              </p>
              <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#111827]">
                Processing your financial signals
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#EEF3FD] p-2.5">
              <div
                className="h-full w-full rounded-full border-2 border-[#BFDBFE] border-t-[#1652F0]"
                style={{ animation: "analysis-overlay-spin 0.9s linear infinite" }}
              />
            </div>
          </div>

          <div className="mt-6 h-[6px] overflow-hidden rounded-full bg-[#EEF1F4]">
            <div
              className="h-full rounded-full bg-[#1652F0] transition-all duration-500"
              style={{
                width: `${safeLines.length ? (visibleCount / safeLines.length) * 100 : 100}%`,
              }}
            />
          </div>

          <div className="mt-6 space-y-3">
            {safeLines.slice(0, visibleCount).map((line, index) => {
              const isActive = index === activeIndex;

              return (
                <div
                  key={`${line}-${index}`}
                  className="flex items-start gap-3 transition-opacity duration-300"
                  style={{ opacity: 1 }}
                >
                  <div className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center">
                    {isActive ? (
                      <span
                        className="block h-2.5 w-2.5 rounded-full bg-[#1652F0]"
                        style={{ animation: "analysis-overlay-pulse 1s ease-in-out infinite" }}
                      />
                    ) : (
                      <span className="text-[14px] font-semibold text-[#1652F0]">✓</span>
                    )}
                  </div>
                  <p
                    className={`text-[15px] leading-relaxed transition-colors duration-300 ${
                      isActive ? "text-[#1652F0]" : "text-[#111827]"
                    }`}
                  >
                    {line}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default AnalysisOverlay;
