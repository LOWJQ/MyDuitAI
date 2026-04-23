import { useMemo, useState } from "react";
import TransactionTable from "../components/TransactionTable";
import { generateRiskExplanation } from "../lib/generateRiskExplanation";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

function Signals({ setScreen }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const {
    data,
    metrics,
    transactions,
    bnplPlans,
    repaymentEvents,
    recurringCommitments,
    formatCurrency,
  } = getUserFinancialContext();
  const explanations = generateRiskExplanation(metrics);
  const activeProviderCount = new Set(
    bnplPlans.filter((plan) => plan.status === "active").map((plan) => plan.provider),
  ).size;

  const sortedTransactions = useMemo(() => transactions, [transactions]);
  const sortedBnplPlans = useMemo(() => bnplPlans, [bnplPlans]);
  const sortedRepaymentEvents = useMemo(() => repaymentEvents, [repaymentEvents]);

  const categoryFilters = useMemo(() => {
    const categories = Array.from(
      new Set(data.transactions.map((transaction) => transaction.category)),
    );
    return ["All", ...categories];
  }, [data.transactions]);

  const recentChanges = [
    `Non-essential spending changed ${metrics.nonEssentialSpendingChange}% compared to the previous month.`,
    `Buy Now Pay Later repayments changed ${metrics.recentTrendChanges.bnplRepaymentChange}% month over month.`,
    `Month-end balance changed by ${formatCurrency(
      Math.abs(metrics.recentTrendChanges.endingBalanceChange),
    )} from last month.`,
  ];
  const signalCards = [
    {
      label: "Buy Now Pay Later usage frequency",
      status: "Monitored",
      tone: "text-[#1652F0] bg-[#EEF3FD]",
      value: `${metrics.bnplFrequency} recent related transactions`,
      detail: "Usage frequency shows how often installment-based spending is entering the monthly cash cycle.",
    },
    {
      label: "End-of-month balance trend",
      status: "Monitored",
      tone: "text-[#1652F0] bg-[#EEF3FD]",
      value: `${metrics.endMonthBalanceTrend.consecutiveDeclines + 1} months declining`,
      detail: "Shrinking month-end cash makes future repayments harder to absorb even before a missed payment appears.",
    },
    {
      label: "Repayment punctuality",
      status: "Elevated",
      tone: "text-[#92400E] bg-[#FFFBEB]",
      value: `${metrics.lateRepaymentCount} late repayment events`,
      detail: "Repayment delays suggest that pressure is already starting to affect payment behaviour.",
    },
    {
      label: "Debt-to-income ratio",
      status: "High risk",
      tone: "text-[#991B1B] bg-[#FEF2F2]",
      value: `${metrics.bnplRatioPercent}% of income`,
      detail: "This shows how much monthly income is already being consumed by Buy Now Pay Later commitments.",
    },
    {
      label: "Spending velocity",
      status: "High risk",
      tone: "text-[#991B1B] bg-[#FEF2F2]",
      value: `${metrics.spendingRatioPercent}% of income`,
      detail: "Spending velocity captures how quickly normal spending is closing the gap between salary and remaining cash.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1652F0]">
                Predict layer
              </p>
              <h2 className="mt-4 text-[31px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
                What evidence is the system using?
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#5F6673]">
                This is the evidence layer behind the Financial Stress Score. MyDuitAI is not
                guessing. It is reading real transaction behaviour, Buy Now Pay Later activity,
                repayment timing, and month-end cash pressure.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen("overview")}
                className="rounded-full border border-[#E6E8EC] px-5 py-3 text-[14px] font-semibold text-[#6B7280]"
              >
                Back to Overview
              </button>
              <button
                type="button"
                onClick={() => setScreen("forecast")}
                className="rounded-full border border-[#1652F0] px-6 py-3.5 text-[15px] font-semibold text-[#1652F0]"
              >
                Continue to Forecast
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                Evidence synthesis
              </p>
              <h3 className="mt-2 text-[20px] font-semibold text-[#111827]">
                MyDuitAI combines fragmented repayment signals into one risk view
              </h3>
              <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-[#6B7280]">
                Aisha&apos;s financial pressure is not coming from one bad transaction. It is
                building across separate providers, repayment dates, and spending categories that
                usually sit in different apps and never speak to each other.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                What the system is doing
              </p>
              <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-[#111827]">
                <p>1. Pulls signals across bank activity and Buy Now Pay Later plans</p>
                <p>2. Detects overlapping repayment pressure before the user feels it fully</p>
                <p>3. Turns those signals into one Financial Stress Score</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[620px]">
              <h3 className="text-[20px] font-semibold text-[#111827]">
                The full picture across providers
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                This is the problem most users never see clearly. Repayments are split across
                multiple Buy Now Pay Later apps, but the financial pressure lands in one place:
                the same monthly income.
              </p>
            </div>

            <div className="grid min-w-[360px] grid-cols-3 gap-4">
              <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Providers
                </p>
                <p className="mt-2 text-[24px] font-semibold text-[#111827]">
                  {activeProviderCount}
                </p>
              </div>
              <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Active plans
                </p>
                <p className="mt-2 text-[24px] font-semibold text-[#111827]">
                  {bnplPlans.filter((plan) => plan.status === "active").length}
                </p>
              </div>
              <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Monthly load
                </p>
                <p className="mt-2 text-[24px] font-semibold text-[#C53030]">
                  {formatCurrency(metrics.totalBnplCommitments)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="mb-6">
            <h3 className="text-[20px] font-semibold text-[#111827]">
              The 5 signals behind the Financial Stress Score
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
              MyDuitAI continuously monitors five behavioural signals together. These are the core
              inputs behind the score, not separate dashboard widgets.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {signalCards.map((signal) => (
              <div
                key={signal.label}
                className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-4"
              >
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${signal.tone}`}
                >
                  {signal.status}
                </span>
                <p className="mt-3 text-[14px] leading-relaxed text-[#111827]">{signal.label}</p>
                <p className="mt-3 text-[18px] font-semibold text-[#111827]">{signal.value}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#6B7280]">{signal.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="mb-6 flex items-start justify-between gap-8">
            <div>
              <h3 className="text-[20px] font-semibold text-[#111827]">What MyDuitAI is seeing right now</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                These are the clearest signals currently pulling the score downward.
              </p>
            </div>
            <div className="rounded-[20px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-3">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                Risk signals detected
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#111827]">
                {metrics.recentRiskSignals.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {metrics.recentRiskSignals.slice(0, 3).map((signal) => (
              <div
                key={signal.type}
                className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-5"
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                  {signal.severity} signal
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#111827]">{signal.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">{signal.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <h3 className="text-[20px] font-semibold text-[#111827]">Why the score is dropping</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            These explanations connect the score to the underlying behaviour across spending,
            repayment timing, and a shrinking cash buffer.
          </p>

          <div className="mt-6 space-y-4">
            {explanations.map((explanation) => (
              <div key={explanation} className="rounded-[22px] border border-[#EEF1F4] px-5 py-4">
                <p className="text-[14px] leading-relaxed text-[#111827]">{explanation}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="mb-6 flex items-center justify-between gap-6">
            <div>
              <h3 className="text-[20px] font-semibold text-[#111827]">Transaction history</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                These statement records are the raw inputs behind the score, forecast, and
                intervention logic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categoryFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                    activeFilter === filter
                      ? "bg-[#EEF3FD] text-[#1652F0]"
                      : "bg-[#F5F7FA] text-[#6B7280]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <TransactionTable
            transactions={sortedTransactions}
            activeFilter={activeFilter}
            formatCurrency={formatCurrency}
          />
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <h3 className="text-[20px] font-semibold text-[#111827]">Buy Now Pay Later plans</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
              These active installment commitments show why repayment pressure is staying elevated.
            </p>

            <div className="mt-6 space-y-4">
              {sortedBnplPlans.map((plan) => (
                <div key={plan.id} className="rounded-[22px] border border-[#EEF1F4] px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[15px] font-semibold text-[#111827]">{plan.merchant}</p>
                      <p className="mt-1 text-[13px] text-[#6B7280]">{plan.purchaseName}</p>
                    </div>
                    <span className="rounded-full border border-[#DCE7FF] px-3 py-1 text-[11px] font-semibold text-[#1652F0]">
                      {plan.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-[13px] text-[#6B7280]">
                    <span>Total amount: {formatCurrency(plan.purchaseAmount)}</span>
                    <span>Installment: {formatCurrency(plan.installmentAmount)}</span>
                    <span>Remaining payments: {plan.installmentsRemaining}</span>
                    <span>Due date: {plan.nextDueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <h3 className="text-[20px] font-semibold text-[#111827]">Repayment events</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
              This shows whether repayment strain is already affecting payment behaviour.
            </p>

            <div className="mt-6 space-y-4">
              {sortedRepaymentEvents.map((event) => {
                const matchingPlan = data.bnplPlans.find((plan) => plan.id === event.planId);
                const repaymentTitle = matchingPlan
                  ? `${matchingPlan.provider} - ${matchingPlan.purchaseName}`
                  : event.planId;

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-[22px] border border-[#EEF1F4] px-5 py-4"
                  >
                    <div>
                      <p className="text-[15px] font-semibold text-[#111827]">{repaymentTitle}</p>
                      <p className="mt-1 text-[13px] text-[#6B7280]">
                        Due {event.dueDate}
                        {event.paidDate ? `, paid ${event.paidDate}` : ", not yet paid"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold text-[#111827]">
                        {formatCurrency(event.amount)}
                      </p>
                      <p
                        className={`mt-1 text-[13px] font-semibold ${
                          event.status === "on_time"
                            ? "text-[#0F9D73]"
                            : event.status === "late"
                              ? "text-[#B7791F]"
                              : "text-[#C53030]"
                        }`}
                      >
                        {event.status.replace("_", " ")}
                        {event.daysLate ? ` | ${event.daysLate} days late` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-8">
          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <h3 className="text-[20px] font-semibold text-[#111827]">Recurring commitments</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
              These repeating obligations reduce how much flexibility you have before any new
              purchase is added.
            </p>

            <div className="mt-6 space-y-4">
              {recurringCommitments.map((commitment) => (
                <div
                  key={commitment.id}
                  className="flex items-center justify-between rounded-[20px] border border-[#EEF1F4] px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-[#111827]">
                      {commitment.merchant}
                    </p>
                    <p className="mt-1 text-[12px] text-[#9CA3AF]">
                      {commitment.category} | {commitment.date}
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold text-[#111827]">
                    {formatCurrency(commitment.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <h3 className="text-[20px] font-semibold text-[#111827]">What changed recently</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
              These changes over the last 30 days help explain why your score is weakening.
            </p>

            <div className="mt-6 space-y-4">
              {recentChanges.map((change) => (
                <div key={change} className="rounded-[20px] border border-[#EEF1F4] px-4 py-3">
                  <p className="text-[14px] leading-relaxed text-[#111827]">{change}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[620px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                What this means next
              </p>
              <h3 className="mt-2 text-[20px] font-semibold text-[#111827]">
                The evidence is already pointing toward tighter cash and heavier repayment overlap
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                Signals explains why the score is weakening. Forecast shows what happens if the
                same pattern continues through the next 30, 60, and 90 days.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setScreen("forecast")}
              className="rounded-full bg-[#1652F0] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1446CC]"
            >
              Continue to Forecast
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Signals;
