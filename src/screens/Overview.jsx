import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RiskRound from "../components/RiskRound";
import AnalysisOverlay from "../components/AnalysisOverlay";
import NextStepBar from "../components/NextStepBar";
import RiskDriverList from "../components/RiskDriverList";
import RiskSummaryCard from "../components/RiskSummaryCard";
import { generateRiskExplanation } from "../lib/generateRiskExplanation";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

const analysisState = { completed: false };

function CustomScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  const score = point?.score ?? 0;
  const scoreColor = score < 40 ? "#C53030" : score < 60 ? "#B7791F" : "#0F9D73";

  return (
    <div className="rounded-[18px] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em]" style={{ color: scoreColor }}>
        {score}
      </p>
      <p className="mt-2 text-[13px] font-semibold text-[#6B7280]">{point?.zone}</p>
    </div>
  );
}

function Overview({ setScreen }) {
  const overviewAnalysisLines = [
    "Connecting to financial data...",
    "Reading 27 transactions across 3 months...",
    "Detecting BNPL activity...",
    "Analysing spending-to-income ratio...",
    "Evaluating repayment punctuality...",
    "Calculating Financial Stress Score...",
    "Analysis complete.",
  ];
  const { data, metrics, scoreResult, peerComparison, scoreTrendData, formatCurrency } = getUserFinancialContext();
  const totalScoreDrop = Math.max(0, scoreTrendData[0]?.score - scoreResult.score);
  const midAprilScore = scoreTrendData.find((point) => point.label === "Mid Apr")?.score ?? scoreResult.score;
  const threeWeekScoreDrop = Math.max(0, midAprilScore - scoreResult.score);
  const explanations = generateRiskExplanation(metrics).slice(0, 3);
  const explanationDrivers = explanations.map((message, index) => ({
    signal: `explanation-${index}`,
    message,
  }));
  const activeBnplPlans = data.bnplPlans.filter((plan) => plan.status === "active");
  const activeBnplInstallments = activeBnplPlans.reduce(
    (total, plan) => total + Number(plan.installmentAmount || 0),
    0,
  );
  const trackedMonths = metrics.snapshots?.length ?? 0;
  const monitoredTransactions = data.transactions?.length ?? 0;
  const [showAlert, setShowAlert] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [hasAnalysed, setHasAnalysed] = useState(analysisState.completed);
  const [contentVisible, setContentVisible] = useState(analysisState.completed);
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(!analysisState.completed);
  const alertCardRef = useRef(null);
  const aiAlertMessage = `AI warning: your score is sliding fast, Buy Now Pay Later load is now ${metrics.bnplRatioPercent}% of income, and April cash is down to ${formatCurrency(metrics.latestEndingBalance)}.`;

  useEffect(() => {
    if (analysisState.completed) {
      return undefined;
    }

    setHasAnalysed(false);
    setContentVisible(false);
    setShowAnalysisOverlay(false);

    const startTimer = window.setTimeout(() => {
      setShowAnalysisOverlay(true);
    }, 300);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, []);

  useEffect(() => {
    if (showAlert || !hasAnalysed || !contentVisible) {
      return undefined;
    }

    const alertNode = alertCardRef.current;

    if (!alertNode) {
      return undefined;
    }

    const maybeShowAlert = () => {
      const rect = alertNode.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisible = rect.top <= viewportHeight * 0.8 && rect.bottom >= viewportHeight * 0.2;

      if (isVisible) {
        setShowAlert(true);
        return true;
      }

      return false;
    };

    if (maybeShowAlert()) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          setShowAlert(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(alertNode);

    const handleScroll = () => {
      if (maybeShowAlert()) {
        observer.disconnect();
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showAlert, hasAnalysed, contentVisible]);

  useEffect(() => {
    if (!showAlert) {
      return undefined;
    }

    setDisplayedText("");
    let index = 0;
    const typewriter = window.setInterval(() => {
      index += 1;
      setDisplayedText(aiAlertMessage.slice(0, index));

      if (index >= aiAlertMessage.length) {
        window.clearInterval(typewriter);
      }
    }, 28);

    return () => {
      window.clearInterval(typewriter);
    };
  }, [showAlert]);

  const isTyping = showAlert && displayedText.length < aiAlertMessage.length;

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7 pb-32">
      {showAnalysisOverlay ? (
        <div className="flex min-h-[60vh] items-center justify-center px-8">
          <AnalysisOverlay
            inline
            containerClassName="w-full"
            cardClassName="max-w-2xl w-full mx-auto"
            lines={overviewAnalysisLines}
            onComplete={() => {
              analysisState.completed = true;
              setShowAnalysisOverlay(false);
              setHasAnalysed(true);
              window.requestAnimationFrame(() => {
                setContentVisible(true);
              });
            }}
          />
        </div>
      ) : null}
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }

          @keyframes score-pulse {
            0% {
              opacity: 0.85;
              transform: scale(1);
            }
            70% {
              opacity: 0;
              transform: scale(1.8);
            }
            100% {
              opacity: 0;
              transform: scale(1.8);
            }
          }
        `}
      </style>
      {hasAnalysed ? (
        <div
          className={`mx-auto max-w-[1180px] space-y-5 transition-opacity duration-[400ms] ${contentVisible ? "opacity-100" : "opacity-0"
            }`}
        >
          <div className="flex items-stretch gap-5">
            <div className="w-1/3 shrink-0">
              <RiskRound score={scoreResult.score} zone={scoreResult.zone} />
            </div>

            <div className="flex-1">
              <section
                ref={alertCardRef}
                className={`flex h-full flex-col justify-center rounded-[28px] border border-[#FECACA] bg-[#FFF8F8] px-10 py-8 transition-all duration-700 ${showAlert ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#991B1B]">
                    AI ALERT
                  </span>
                </div>

                <p className="mt-5 max-w-[780px] text-[22px] font-medium leading-relaxed text-[#111827]">
                  {displayedText}
                  {isTyping ? (
                    <span style={{ animation: "blink 0.5s step-end infinite" }}>|</span>
                  ) : null}
                </p>

                <div className="mt-6 flex items-center text-[14px] text-[#6B7280]">
                  <span>
                    Score drop <span className="font-semibold text-[#991B1B]">-{threeWeekScoreDrop} pts</span>
                  </span>
                  <span className="mx-4 text-[#E5E7EB]">|</span>
                  <span>
                    Buy Now Pay Later usage <span className="font-semibold text-[#991B1B]">+40%</span>
                  </span>
                  <span className="mx-4 text-[#E5E7EB]">|</span>
                  <span>
                    April balance{" "}
                    <span className="font-semibold text-[#991B1B]">
                      {formatCurrency(metrics.latestEndingBalance)}
                    </span>
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#FECACA] pt-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#991B1B]">
                      Trigger 1
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                      Buy Now Pay Later commitments are already at {peerComparison.userRatio}% of income
                      versus a {peerComparison.peerRatio}% peer average.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#991B1B]">
                      Trigger 2
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                      Month-end cash has fallen to {formatCurrency(metrics.latestEndingBalance)}, leaving
                      far less room to absorb the next repayment cycle.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#991B1B]">
                      Why now
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                      MyDuitAI escalates when spending reaches {metrics.spendingRatioPercent}% of income
                      while cash and repayment signals weaken together, not from one isolated purchase.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-6">
            <div className="flex items-start justify-between gap-8">
              <div className="max-w-[520px]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                  Monitoring engine
                </p>
                <h3 className="mt-2 text-[20px] font-semibold text-[#111827]">
                  MyDuitAI is watching for drift before the user feels the crisis
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                  The score reacts to live behaviour, not a static monthly summary.
                </p>
              </div>
              <div className="rounded-[18px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-3">
                <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                  System status
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#111827]">Monitoring active</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {[
                { label: "Buy Now Pay Later usage", intensity: 66, status: "Monitored", color: "#1652F0", bg: "#EEF3FD" },
                { label: "End-of-month balance", intensity: 72, status: "Monitored", color: "#1652F0", bg: "#EEF3FD" },
                { label: "Repayment punctuality", intensity: 58, status: "Elevated", color: "#B7791F", bg: "#FFFBEB" },
                { label: "Debt-to-income ratio", intensity: 88, status: "High risk", color: "#C53030", bg: "#FEF2F2" },
                { label: "Spending velocity", intensity: 84, status: "High risk", color: "#C53030", bg: "#FEF2F2" },
              ].map((signal) => (
                <div key={signal.label} className="flex items-center gap-4 rounded-[16px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-3">
                  <div className="w-[220px] shrink-0">
                    <p className="text-[13px] font-semibold leading-snug text-[#111827]">{signal.label}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-[8px] w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${signal.intensity}%`, backgroundColor: signal.color }}
                      />
                    </div>
                  </div>
                  <div className="w-[32px] text-right">
                    <p className="text-[12px] font-semibold text-[#6B7280]">{signal.intensity}</p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{ color: signal.color, backgroundColor: signal.bg }}
                  >
                    {signal.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <div className="max-w-[760px]">
              <h3 className="text-[20px] font-semibold text-[#111827]">
                Financial Stress Score - last 7 weeks
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                The score has dropped {totalScoreDrop} points since early March.
              </p>
            </div>

            <div className="mt-8 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrendData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C53030" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#C53030" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    domain={[30, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#B7791F"
                    strokeDasharray="6 6"
                    ifOverflow="extendDomain"
                    label={{ value: "Warning", position: "insideTopRight", fill: "#B7791F", fontSize: 12 }}
                  />
                  <ReferenceLine
                    y={40}
                    stroke="#C53030"
                    strokeDasharray="6 6"
                    ifOverflow="extendDomain"
                    label={{ value: "Intervention", position: "insideTopRight", fill: "#C53030", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomScoreTooltip />} cursor={{ stroke: "#F3F4F6", strokeWidth: 1.5 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#C53030"
                    strokeWidth={2.5}
                    fill="url(#scoreGrad)"
                    dot={(props) => {
                      const { cx, cy, index } = props;
                      const isLast = index === scoreTrendData.length - 1;

                      if (typeof cx !== "number" || typeof cy !== "number") {
                        return null;
                      }

                      if (!isLast) {
                        return <circle cx={cx} cy={cy} r={4} fill="#D1D5DB" stroke="#FFFFFF" strokeWidth={2} />;
                      }

                      return (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={8}
                            fill="none"
                            stroke="#C53030"
                            strokeWidth={2}
                            style={{ transformOrigin: `${cx}px ${cy}px`, animation: "score-pulse 1.8s ease-out infinite" }}
                          />
                          <circle cx={cx} cy={cy} r={6} fill="#C53030" stroke="#FFFFFF" strokeWidth={3} />
                        </g>
                      );
                    }}
                    activeDot={{ r: 6, fill: "#C53030", stroke: "#FFFFFF", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-4">
            <div className="flex min-h-[132px] flex-col justify-between rounded-[24px] border border-[#E6E8EC] bg-white px-6 py-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Monthly income
              </p>
              <div className="mt-3">
                <p className="text-[20px] font-semibold text-[#111827]">
                  {formatCurrency(data.userProfile.monthlyIncome)}
                </p>
                <p className="mt-1 text-[13px] text-[#6B7280]">Take-home pay this month</p>
              </div>
            </div>
            <div className="flex min-h-[132px] flex-col justify-between rounded-[24px] border border-[#E6E8EC] bg-white px-6 py-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Month-end balance
              </p>
              <div className="mt-3">
                <p className="text-[20px] font-semibold text-[#111827]">
                  {formatCurrency(metrics.latestEndingBalance)}
                </p>
                <p className="mt-1 text-[13px] text-[#6B7280]">Projected cash left after bills</p>
              </div>
            </div>
            <div className="flex min-h-[132px] flex-col justify-between rounded-[24px] border border-[#E6E8EC] bg-white px-6 py-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Active Buy Now Pay Later
              </p>
              <div className="mt-3">
                <p className="text-[20px] font-semibold text-[#111827]">
                  {activeBnplPlans.length} plans
                </p>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  {formatCurrency(activeBnplInstallments)} / month
                </p>
              </div>
            </div>
          </section>

          <RiskDriverList contributors={explanationDrivers} title="Why your score is dropping" />

        </div>
      ) : null}
      <NextStepBar
        show={hasAnalysed && contentVisible}
        label="Hear MyDuitAI explain why your score is dropping right now."
        buttonText="See What We See →"
        question="Why is my score dropping?"
        fallback={`Aisha, your score dropped ${threeWeekScoreDrop} points in three weeks because your BNPL commitments grew faster than your income. You now have four active plans taking up ${metrics.bnplRatioPercent} percent of your salary, while your peers average ${peerComparison.peerRatio} percent. Your end of month balance is down to ${formatCurrency(metrics.latestEndingBalance)}. The pattern is accelerating, and MyDuitAI caught it before it became a crisis.`}
      />
    </div>
  );
}

export default Overview;
