import { useEffect, useRef, useState } from "react";
import RiskDriverList from "../components/RiskDriverList";
import RiskSummaryCard from "../components/RiskSummaryCard";
import ScoreGauge from "../components/ScoreGauge";
import { generateRiskExplanation } from "../lib/generateRiskExplanation";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

const timelineSnapshots = [
  { id: "week-1", label: "3 weeks ago", score: 72, zone: "Warning" },
  { id: "week-2", label: "2 weeks ago", score: 61, zone: "Warning" },
  { id: "week-3", label: "Today", score: 48, zone: "Danger" },
];
const aiAlertMessage =
  "Aisha, your Financial Stress Score has dropped 18 points in 3 weeks. Your Buy Now Pay Later usage is up 40%. At this pace, you will have only RM156 left in December.";

function Overview({ setScreen }) {
  const { data, metrics, scoreResult, peerComparison, formatCurrency } = getUserFinancialContext();
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
  const [visibleGauges, setVisibleGauges] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const alertCardRef = useRef(null);

  useEffect(() => {
    const secondGaugeTimer = window.setTimeout(() => setVisibleGauges(2), 900);
    const thirdGaugeTimer = window.setTimeout(() => setVisibleGauges(3), 1800);

    return () => {
      window.clearTimeout(secondGaugeTimer);
      window.clearTimeout(thirdGaugeTimer);
    };
  }, []);

  useEffect(() => {
    const alertNode = alertCardRef.current;

    if (!alertNode || showAlert) {
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
      { threshold: 0.3 },
    );

    observer.observe(alertNode);

    return () => {
      observer.disconnect();
    };
  }, [showAlert]);

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
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
      <div className="mx-auto max-w-[1180px] space-y-5">
        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_360px] items-center gap-8">
            <div className="max-w-[620px]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1652F0]">
                Predict layer
              </p>
              <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[#111827]">
                Predict financial distress before it becomes a crisis
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#5F6673]">
                MyDuitAI turns behavioural signals into one forward-looking Financial Stress Score,
                then guides the user through prediction, education, and intervention before a
                missed repayment happens.
              </p>
              <p className="mt-5 max-w-[520px] text-[14px] leading-relaxed text-[#111827]">
                This is not a budgeting dashboard. It is an early-warning system designed to catch
                risk while there is still time to change course.
              </p>
              <p className="mt-4 max-w-[520px] text-[13px] leading-relaxed text-[#6B7280]">
                If the Financial Stress Score falls into the critical zone, MyDuitAI can escalate
                from warning into active support by connecting the user to AKPK counselling
                resources.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#EEF1F4] bg-[#FBFCFE] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                3-layer system
              </p>
              <div className="mt-4 space-y-3">
                {[
                  {
                    title: "Predict",
                    copy: "Detect weakening financial behaviour early.",
                  },
                  {
                    title: "Educate",
                    copy: "Project where the next 60 days are heading.",
                  },
                  {
                    title: "Intervene",
                    copy: "Add friction and AKPK support when risk is critical.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-[18px] border border-[#EEF1F4] bg-white px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF3FD] text-[11px] font-semibold text-[#1652F0]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

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
                This is what makes the product predictive instead of reactive. The score is not a
                monthly summary. It is produced from a rolling stream of behavioural signals.
              </p>
            </div>
            <div className="rounded-[18px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-3">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                System status
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#111827]">Monitoring active</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Signals tracked
              </p>
              <p className="mt-3 text-[20px] font-semibold text-[#111827]">5 live signals</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                Usage frequency, cash trend, punctuality, debt ratio, and spending velocity.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Baseline learned
              </p>
              <p className="mt-3 text-[20px] font-semibold text-[#111827]">
                {trackedMonths} months of history
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                Alerts are based on drift from Aisha&apos;s normal pattern, not generic spending
                rules.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Evidence window
              </p>
              <p className="mt-3 text-[20px] font-semibold text-[#111827]">
                {monitoredTransactions} transactions
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                Bank and installment activity are combined into one rolling picture of financial
                stress.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#F7D7A7] bg-[#FFFBF4] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Protective rule
              </p>
              <p className="mt-3 text-[20px] font-semibold text-[#111827]">
                Critical score triggers friction
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                If risk worsens, checkout moves from warning into protection and can surface AKPK
                support.
              </p>
            </div>
          </div>
        </section>

        <RiskSummaryCard score={scoreResult.score} zone={scoreResult.zone} summary={scoreResult.summary} />

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[520px]">
              <h3 className="text-[20px] font-semibold text-[#111827]">
                How the Financial Stress Score escalates
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                MyDuitAI does not wait for missed payments to happen. As the score moves through
                these zones, the product shifts from prediction to warning, then to intervention
                and support.
              </p>
            </div>
            <div className="rounded-[18px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-3">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                Current zone
              </p>
              <p className="mt-2 text-[20px] font-semibold text-[#111827]">{scoreResult.zone}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            {[
              {
                title: "Stable",
                range: "80-100",
                copy: "Healthy room to absorb commitments and recover from normal spending swings.",
                tone: "border-[#D7E8D8] bg-[#F7FCF9] text-[#0F9D73]",
              },
              {
                title: "Warning",
                range: "60-79",
                copy: "Early strain is forming. This is where MyDuitAI starts surfacing stronger alerts.",
                tone: "border-[#F7D7A7] bg-[#FFFBF4] text-[#B7791F]",
              },
              {
                title: "Danger",
                range: "40-59",
                copy: "Cash buffers and repayment pressure are overlapping. Intervention becomes important.",
                tone: "border-[#F7C7C7] bg-[#FFF8F8] text-[#C53030]",
              },
              {
                title: "Critical",
                range: "0-39",
                copy: "Protective action and AKPK support can be triggered before deeper harm happens.",
                tone: "border-[#F7C7C7] bg-[#FFF4F4] text-[#991B1B]",
              },
            ].map((item) => {
              const isActive = item.title === scoreResult.zone;

              return (
                <div
                  key={item.title}
                  className={`rounded-[22px] border p-5 ${item.tone} ${
                    isActive ? "ring-2 ring-offset-2 ring-[#1652F0]/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold">{item.title}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                      {item.range}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#111827]">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <h3 className="text-[20px] font-semibold text-[#111827]">Your score over the last 3 weeks</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            MyDuitAI detected the decline before it became a crisis.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-6">
            {timelineSnapshots.map((snapshot, index) => {
              const isVisible = visibleGauges >= index + 1;
              const isCurrent = index === timelineSnapshots.length - 1 && visibleGauges >= 3;

              return (
                <div
                  key={snapshot.id}
                  className={`flex flex-col items-center rounded-[24px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-6 transition-opacity duration-700 ${
                    isVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    className={`rounded-full ${
                      isCurrent ? "ring-2 ring-red-400 ring-offset-2 animate-pulse" : ""
                    }`}
                  >
                    <ScoreGauge score={snapshot.score} />
                  </div>
                  <p className="mt-3 text-[15px] font-semibold text-[#111827]">{snapshot.label}</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">{snapshot.zone}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center px-6">
            <div className="h-[2px] flex-1 bg-[#D1D5DB]" />
            <div className="mx-2 h-3 w-3 rounded-full bg-[#9CA3AF]" />
            <div className="h-[2px] flex-1 bg-[#D1D5DB]" />
            <div className="mx-2 h-3 w-3 rounded-full bg-[#9CA3AF]" />
            <div className="h-[2px] flex-1 bg-[#FCA5A5]" />
            <div className="mx-2 h-3 w-3 rounded-full bg-[#C53030]" />
            <div className="h-[2px] flex-1 bg-[#FCA5A5]" />
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

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[560px]">
              <h3 className="text-[20px] font-semibold text-[#111827]">How you compare</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                MyDuitAI does not only look at your own trend. It also checks whether your Buy Now
                Pay Later burden is drifting away from what is typical for users with similar
                income.
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-[#111827]">
                Right now, your Buy Now Pay Later ratio is{" "}
                <span className="font-semibold text-[#C53030]">{peerComparison.userRatio}%</span>.
                Similar users average{" "}
                <span className="font-semibold text-[#1652F0]">{peerComparison.peerRatio}%</span>.
              </p>
            </div>

            <div className="grid min-w-[300px] grid-cols-2 gap-4">
              <div className="rounded-[22px] border border-[#F7C7C7] bg-[#FFF8F8] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Your ratio
                </p>
                <p className="mt-2 text-[28px] font-semibold text-[#C53030]">
                  {peerComparison.userRatio}%
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                  Already in the danger range for repayment pressure.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#DCE7FF] bg-[#FBFCFE] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Peer average
                </p>
                <p className="mt-2 text-[28px] font-semibold text-[#1652F0]">
                  {peerComparison.peerRatio}%
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                  Typical Buy Now Pay Later burden for similar income users.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={alertCardRef}
          className={`rounded-[28px] border border-[#FECACA] bg-[#FFF8F8] px-10 py-8 transition-all duration-700 ${
            showAlert ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
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
              Score drop <span className="font-semibold text-[#991B1B]">-18 pts</span>
            </span>
            <span className="mx-4 text-[#E5E7EB]">|</span>
            <span>
              Buy Now Pay Later usage <span className="font-semibold text-[#991B1B]">+40%</span>
            </span>
            <span className="mx-4 text-[#E5E7EB]">|</span>
            <span>
              December balance <span className="font-semibold text-[#991B1B]">RM156</span>
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

        <RiskDriverList contributors={explanationDrivers} title="Why your score is dropping" />

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[560px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                What should happen next
              </p>
              <h3 className="mt-2 text-[20px] font-semibold text-[#111827]">
                Decide whether to inspect the evidence or project the next 60 days
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                If you want to understand why the score is weakening, go to Signals. If you want
                to see where this pattern leads if nothing changes, go to Forecast.
              </p>
            </div>

            <div className="grid min-w-[420px] grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setScreen("signals")}
                className="rounded-[22px] border border-[#DCE7FF] bg-[#EEF3FD] p-5 text-left transition hover:border-[#1652F0]"
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                  Next step
                </p>
                <p className="mt-2 text-[17px] font-semibold text-[#111827]">See the Signals</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#5F6673]">
                  Review the behavioural evidence behind the Financial Stress Score.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScreen("forecast")}
                className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-5 text-left transition hover:border-[#1652F0]"
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  Or continue
                </p>
                <p className="mt-2 text-[17px] font-semibold text-[#111827]">See the Forecast</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#5F6673]">
                  See where the next 30, 60, and 90 days are heading if behaviour stays the same.
                </p>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Overview;
