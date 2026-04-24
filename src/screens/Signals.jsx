import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalysisOverlay from "../components/AnalysisOverlay";
import NextStepBar from "../components/NextStepBar";
import TransactionTable from "../components/TransactionTable";
import { generateRiskExplanation } from "../lib/generateRiskExplanation";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

const analysisState = { completed: false };

function BnplTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[16px] border border-[#E6E8EC] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-2 text-[14px] font-semibold text-[#C53030]">RM{payload[0]?.value}/month</p>
    </div>
  );
}

function Signals({ setScreen }) {
  const signalAnalysisLines = [
    "Scanning behavioural patterns...",
    "Flagging BNPL frequency signals...",
    "Checking ending balance trend...",
    "Reviewing repayment history...",
    "Mapping risk contributors...",
    "Signals identified.",
  ];
  const [activeFilter, setActiveFilter] = useState("All");
  const [hasAnalysed, setHasAnalysed] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(true);
  const {
    data,
    metrics,
    transactions,
    bnplPlans,
    repaymentEvents,
    recurringCommitments,
    formatCurrency,
  } = getUserFinancialContext();
  const bnplGrowthData = metrics.snapshots.map((snapshot, index) => ({
    month: snapshot.month,
    repayments: snapshot.bnplRepayments,
    color: ["#6B7280", "#B7791F", "#C53030", "#991B1B"][index] ?? "#991B1B",
  }));
  const repaymentDates = [
    { date: "Apr 3", provider: "Atome", amount: 220, color: "#6366F1", left: "2%" },
    { date: "Apr 5", provider: "Atome (last)", amount: 220, color: "#6366F1", left: "24%" },
    { date: "Apr 9", provider: "Grab PayLater", amount: 180, color: "#0EA5E9", left: "46%" },
    { date: "Apr 11", provider: "Shopee PayLater", amount: 260, color: "#F59E0B", left: "66%" },
    { date: "May 11", provider: "SPayLater", amount: 166, color: "#EF4444", left: "86%" },
  ];
  const currentBudgetBreakdown = data.currentBudgetBreakdown.map((item) => ({
    ...item,
    pct: (item.amount / data.userProfile.monthlyIncome) * 100,
    pctLabel: `${Math.max(1, Math.round((item.amount / data.userProfile.monthlyIncome) * 100))}%`,
  }));
  const remainingCashShare = Math.max(
    1,
    Math.round((metrics.latestEndingBalance / data.userProfile.monthlyIncome) * 100),
  );
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
  const signalIntensityData = [
    { label: "Buy Now Pay Later", value: 66, tone: "#1652F0" },
    { label: "Cash trend", value: 72, tone: "#1652F0" },
    { label: "Punctuality", value: 58, tone: "#B7791F" },
    { label: "Debt ratio", value: 88, tone: "#C53030" },
    { label: "Velocity", value: 84, tone: "#C53030" },
  ];

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7 pb-24">
      {hasAnalysed ? (
        <div
          className={`mx-auto max-w-[1180px] space-y-6 transition-opacity duration-[400ms] ${contentVisible ? "opacity-100" : "opacity-0"
            }`}
        >

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
            <div>
              <h3 className="text-[20px] font-semibold text-[#111827]">
                Buy Now Pay Later repayments are growing every month
              </h3>
              <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-[#6B7280]">
                Each month, more of Aisha&apos;s RM3,000 salary is locked into installment repayments
                before she can spend it on anything else.
              </p>
            </div>

            <div className="mt-8 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bnplGrowthData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    tickFormatter={(value) => `RM${value}`}
                  />
                  <Tooltip content={<BnplTooltip />} cursor={{ fill: "rgba(17, 24, 39, 0.03)" }} />
                  <Bar dataKey="repayments" radius={[6, 6, 0, 0]}>
                    {bnplGrowthData.map((entry) => (
                      <Cell key={entry.month} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4">
              {bnplGrowthData.map((item) => (
                <div
                  key={item.month}
                  className="rounded-[16px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                    {item.month}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-[#111827]">RM{item.repayments}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[16px] border border-[#F7C7C7] bg-[#FFF8F8] px-4 py-3">
              <p className="text-[13px] font-semibold text-[#C53030]">
                April repayments alone consume 28% of Aisha&apos;s monthly income - before rent, food,
                or transport.
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <div>
              <h3 className="text-[20px] font-semibold text-[#C53030]">
                4 repayment deadlines hit in 9 days
              </h3>
              <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-[#6B7280]">
                This is why Buy Now Pay Later feels manageable until it suddenly isn&apos;t - the due dates cluster
                together against a single salary cycle.
              </p>
            </div>

            <div className="mt-10 overflow-hidden">
              <div className="relative h-[240px] w-full px-8">
                <div className="absolute left-8 right-8 top-1/2 h-[2px] -translate-y-1/2 bg-[#E6E8EC]" />
                {repaymentDates.map((item, index) => {
                  const isAbove = index % 2 === 0;
                  const positionClass =
                    index === 0
                      ? ""
                      : index === repaymentDates.length - 1
                        ? "-translate-x-[80%]"
                        : "-translate-x-1/2";

                  return (
                    <div
                      key={`${item.date}-${item.provider}`}
                      className={`absolute w-[150px] ${positionClass}`}
                      style={{ left: item.left, top: isAbove ? "12px" : "120px" }}
                    >
                      {isAbove ? (
                        <>
                          <div
                            className="mx-auto h-10 w-[2px]"
                            style={{ backgroundColor: item.color }}
                          />
                          <div
                            className="rounded-[12px] border border-[#E6E8EC] bg-white px-3 py-2 text-[12px]"
                            style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
                          >
                            <p className="font-semibold text-[#111827]">{item.date}</p>
                            <p className="mt-1 text-[#6B7280]">{item.provider}</p>
                            <p className="mt-1 font-semibold text-[#111827]">RM{item.amount}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="rounded-[12px] border border-[#E6E8EC] bg-white px-3 py-2 text-[12px]"
                            style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
                          >
                            <p className="font-semibold text-[#111827]">{item.date}</p>
                            <p className="mt-1 text-[#6B7280]">{item.provider}</p>
                            <p className="mt-1 font-semibold text-[#111827]">RM{item.amount}</p>
                          </div>
                          <div
                            className="mx-auto h-10 w-[2px]"
                            style={{ backgroundColor: item.color }}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-[20px] border border-[#F7C7C7] bg-[#FEF2F2] px-5 py-4">
              <p className="text-[15px] text-[#111827]">
                Total due between Apr 3 and Apr 11:{" "}
                <span className="font-semibold text-[#C53030]">RM880</span> across 4 repayment hits
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <div className="mb-6">
              <h3 className="text-[20px] font-semibold text-[#111827]">
                The 5 signals behind the Financial Stress Score
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                Five live signals feed the score. Red means the model sees heavy pressure.
              </p>
            </div>

            <div className="h-[260px] rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={signalIntensityData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 24, bottom: 4 }}
                >
                  <CartesianGrid stroke="#F3F4F6" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={92}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#111827" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(17, 24, 39, 0.03)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }

                      const point = payload[0]?.payload;

                      return (
                        <div className="rounded-[16px] border border-[#E6E8EC] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                            {point?.label}
                          </p>
                          <p className="mt-2 text-[15px] font-semibold text-[#111827]">
                            {point?.value}/100 pressure
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                    {signalIntensityData.map((entry) => (
                      <Cell key={entry.label} fill={entry.tone} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {signalCards.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-[18px] border border-[#EEF1F4] bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold leading-snug text-[#111827]">
                      {signal.label}
                    </p>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${signal.tone}`}
                    >
                      {signal.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-semibold text-[#111827]">{signal.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <div className="mb-6 flex items-start justify-between gap-8">
              <div>
                <h3 className="text-[20px] font-semibold text-[#111827]">What MyDuitAI is seeing right now</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                  The strongest downward signals right now.
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
            <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-8 items-center">
              <div>
                <h3 className="text-[20px] font-semibold text-[#111827]">Where April&apos;s RM3,000 goes</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                  After salary comes in, only {formatCurrency(metrics.latestEndingBalance)} remains - less than {remainingCashShare}% of income.
                </p>
                <div className="mt-6 space-y-3">
                  {currentBudgetBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[13px] font-semibold text-[#111827]">{item.label}</p>
                          <p className="text-[13px] font-semibold text-[#111827]">RM{item.amount}</p>
                        </div>
                        <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                      <p className="w-10 text-right text-[12px] text-[#6B7280]">{item.pctLabel}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 200 200" width="220" height="220">
                  {(() => {
                    const segments = currentBudgetBreakdown.map((item) => ({
                      pct: item.pct,
                      color: item.color,
                    }));
                    let cumulative = 0;
                    return segments.map((seg, i) => {
                      const start = (cumulative / 100) * 360 - 90;
                      cumulative += seg.pct;
                      const end = (cumulative / 100) * 360 - 90;
                      const r = 80; const cx = 100; const cy = 100;
                      const toRad = (deg) => (deg * Math.PI) / 180;
                      const x1 = cx + r * Math.cos(toRad(start));
                      const y1 = cy + r * Math.sin(toRad(start));
                      const x2 = cx + r * Math.cos(toRad(end));
                      const y2 = cy + r * Math.sin(toRad(end));
                      const large = seg.pct > 50 ? 1 : 0;
                      return (
                        <path
                          key={i}
                          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                          fill={seg.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    });
                  })()}
                  <circle cx="100" cy="100" r="48" fill="white" />
                  <text x="100" y="95" textAnchor="middle" fontSize="11" fill="#6B7280" fontWeight="600">Cash left</text>
                  <text x="100" y="114" textAnchor="middle" fontSize="18" fill="#0F9D73" fontWeight="800">{formatCurrency(metrics.latestEndingBalance)}</text>
                </svg>
              </div>
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
                    className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${activeFilter === filter
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
                Active commitments keeping repayment pressure high.
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
                Payment behaviour under repayment strain.
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
                          className={`mt-1 text-[13px] font-semibold ${event.status === "on_time"
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
                Recent shifts that pushed the score lower.
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

        </div>
      ) : null}
      <NextStepBar
        show={hasAnalysed && contentVisible}
        label="4 risk signals identified across your transaction history. See where this leads."
        buttonText="See Where This Leads →"
        question="What are the four risk signals MyDuitAI sees on this page?"
        fallback="Aisha, MyDuitAI sees four pressure points building together. Your BNPL repayments are clustering early in the month, your month-end cash has shrunk to RM24, your BNPL burden is already 28 percent of income, and recent spending is landing before your May 25 salary. That combination is why your score keeps weakening."
      />
    </div>
  );
}

export default Signals;

