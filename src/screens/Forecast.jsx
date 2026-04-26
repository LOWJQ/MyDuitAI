import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalysisOverlay from "../components/AnalysisOverlay";
import NextStepBar from "../components/NextStepBar";
import ForecastScenarioCard from "../components/ForecastScenarioCard";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

const analysisState = { completed: false };

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("MYR", "RM")
    .replace(/\s/g, "");

const getRiskOutlook = (remainingCash, bnplBurdenRatio) => {
  if (remainingCash < 0 || bnplBurdenRatio >= 40) {
    return "High risk";
  }

  if (remainingCash < 250 || bnplBurdenRatio >= 30) {
    return "Elevated risk";
  }

  return "More stable";
};

const getCashTrend = (values) => {
  if (values.every((value, index) => index === 0 || value > values[index - 1])) {
    return "improving";
  }

  if (values.every((value, index) => index === 0 || value < values[index - 1])) {
    return "worsening";
  }

  return "flat";
};

const roundCurrency = (value) => Math.round(value);

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const currentValue = payload.find((item) => item.dataKey === "current")?.value ?? 0;
  const saferValue = payload.find((item) => item.dataKey === "safer")?.value ?? 0;

  return (
    <div className="rounded-[18px] border border-[#E6E8EC] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-semibold text-[#C53030]">Current path</span>
          <span className={`text-[14px] ${currentValue < 0 ? "font-bold text-[#C53030]" : "font-semibold text-[#111827]"}`}>
            RM{currentValue}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-semibold text-[#0F9D73]">Safer path</span>
          <span className="text-[14px] font-semibold text-[#111827]">RM{saferValue}</span>
        </div>
      </div>
    </div>
  );
}

const renderLegend = () => (
  <div className="flex items-center justify-center gap-3 pt-4">
    <span className="rounded-full bg-[#FFF1F2] px-4 py-2 text-[12px] font-semibold text-[#C53030]">
      Current path
    </span>
    <span className="rounded-full bg-[#F0FDF4] px-4 py-2 text-[12px] font-semibold text-[#0F9D73]">
      Safer path
    </span>
  </div>
);

const projectFinancialForecast = (data, metrics) => {
  const { userProfile } = data;
  const latestSnapshot = metrics.latestSnapshot;
  const previousSnapshot = metrics.previousSnapshot ?? latestSnapshot;

  const baseDiscretionary = Math.max(
    previousSnapshot.discretionarySpending,
    userProfile.baselineMonthlyDiscretionary * 0.6,
  );
  const baseEssential = Math.max(
    latestSnapshot.essentialSpending,
    userProfile.baselineMonthlyEssentials,
  );
  const baseBnpl = metrics.monthlyBnplRepayments;

  const buildScenario = ({ discretionaryMultiplier, bnplStepDown, newBnplPressure }) => {
    let runningCash = metrics.latestEndingBalance;

    return [30, 60, 90].map((days, index) => {
      const monthIndex = index + 1;
      const projectedIncome = userProfile.monthlyIncome * monthIndex;
      const monthlyEssential = roundCurrency(baseEssential * (1 + index * 0.01));
      const monthlyDiscretionary = roundCurrency(baseDiscretionary * discretionaryMultiplier);
      const monthlyBnpl = Math.max(
        0,
        roundCurrency(baseBnpl - bnplStepDown * index + newBnplPressure * index),
      );

      runningCash +=
        userProfile.monthlyIncome - (monthlyEssential + monthlyDiscretionary + monthlyBnpl);

      return {
        days,
        label: `${days} days`,
        projectedIncome: roundCurrency(projectedIncome),
        projectedSpending: roundCurrency(
          monthlyEssential * monthIndex + monthlyDiscretionary * monthIndex,
        ),
        projectedBnplRepayments: roundCurrency(monthlyBnpl * monthIndex),
        projectedRemainingCash: roundCurrency(runningCash),
        bnplBurdenRatio: Math.round((monthlyBnpl / userProfile.monthlyIncome) * 100),
        riskOutlook: getRiskOutlook(runningCash, (monthlyBnpl / userProfile.monthlyIncome) * 100),
      };
    });
  };

  const currentBehavior = buildScenario({
    discretionaryMultiplier: 1,
    bnplStepDown: 40,
    newBnplPressure: 50,
  });
  const saferBehavior = buildScenario({
    discretionaryMultiplier: 0.75,
    bnplStepDown: 140,
    newBnplPressure: 0,
  });

  const currentCashTrend = getCashTrend(currentBehavior.map((item) => item.projectedRemainingCash));
  const comparison = currentBehavior.map((item, index) => ({
    days: item.days,
    cashImprovement: saferBehavior[index].projectedRemainingCash - item.projectedRemainingCash,
  }));

  return {
    currentBehavior,
    saferBehavior,
    comparison,
    currentCashTrend,
    narrative: [
      `If your current behavior continues, your cash buffer is likely to ${currentCashTrend === "worsening" ? "shrink" : currentCashTrend === "improving" ? "recover slowly" : "stay tight"} over the next 60 days.`,
      `Reducing discretionary spending improves projected remaining cash by RM${comparison[2].cashImprovement} over 90 days.`,
      "Buy Now Pay Later repayment pressure stays elevated while month-end flexibility keeps narrowing.",
    ],
  };
};

function Forecast({ setScreen }) {
  const forecastAnalysisLines = [
    "Loading historical snapshots...",
    "Projecting income vs obligations...",
    "Modelling BNPL compounding effect...",
    "Simulating 3-month trajectory...",
    "Identifying intervention threshold...",
    "Forecast ready.",
  ];
  const [hasAnalysed, setHasAnalysed] = useState(analysisState.completed);
  const [contentVisible, setContentVisible] = useState(analysisState.completed);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(analysisState.completed);
  const { data, metrics, scoreResult } = getUserFinancialContext();
  const forecast = projectFinancialForecast(data, metrics);
  const current60Day = forecast.currentBehavior.find((item) => item.days === 60);
  const forecastChartData = [
    { month: "Apr (now)", current: metrics.latestEndingBalance, safer: metrics.latestEndingBalance },
    { month: "May", current: forecast.currentBehavior[0]?.projectedRemainingCash ?? metrics.latestEndingBalance, safer: forecast.saferBehavior[0]?.projectedRemainingCash ?? metrics.latestEndingBalance },
    { month: "Jun", current: forecast.currentBehavior[1]?.projectedRemainingCash ?? metrics.latestEndingBalance, safer: forecast.saferBehavior[1]?.projectedRemainingCash ?? metrics.latestEndingBalance },
    { month: "Jul", current: forecast.currentBehavior[2]?.projectedRemainingCash ?? metrics.latestEndingBalance, safer: forecast.saferBehavior[2]?.projectedRemainingCash ?? metrics.latestEndingBalance },
  ];
  const lastForecastPoint = forecastChartData[forecastChartData.length - 1];
  const getNarrativeBorderColor = (line) => {
    const normalizedLine = line.toLowerCase();

    if (normalizedLine.includes("shrink") || normalizedLine.includes("tight")) {
      return "#C53030";
    }

    if (normalizedLine.includes("improve") || normalizedLine.includes("recover")) {
      return "#0F9D73";
    }

    return "#E6E8EC";
  };

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7 pb-32">
      {!hasAnalysed && hasStartedAnalysis ? (
        <div className="flex min-h-[60vh] items-center justify-center px-8">
          <AnalysisOverlay
            inline
            containerClassName="w-full"
            cardClassName="max-w-2xl w-full mx-auto"
            lines={forecastAnalysisLines}
            onComplete={() => {
              analysisState.completed = true;
              setHasAnalysed(true);
              window.requestAnimationFrame(() => {
                setContentVisible(true);
              });
            }}
          />
        </div>
      ) : null}
      {hasAnalysed ? (
      <div
        className={`mx-auto max-w-[1180px] space-y-6 transition-opacity duration-[400ms] ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1652F0]">
                Educate layer
              </p>
              <h2 className="mt-4 text-[31px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
                Where is my current behavior taking me?
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#5F6673]">
                One chart shows the likely path if nothing changes.
              </p>
              <p className="mt-5 max-w-[620px] text-[14px] leading-relaxed text-[#111827]">
                Cash falls, repayment pressure rises, and recovery gets harder.
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
                onClick={() => setScreen("checkout")}
                className="rounded-full bg-[#1652F0] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1446CC]"
              >
                Continue to Intervention
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[#F7C7C7] bg-[#FFF8F8] px-6 py-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C53030]">
              Projected outcome
            </p>
            <p className="mt-2 max-w-[760px] text-[18px] leading-relaxed text-[#111827]">
              In the next 60 days, remaining cash could fall to{" "}
              <span className="font-semibold text-[#C53030]">
                {formatCurrency(current60Day?.projectedRemainingCash ?? 0)}
              </span>{" "}
              while Buy Now Pay Later burden stays elevated.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-[720px]">
              <h3 className="text-[20px] font-semibold text-[#111827]">
                What happens next - two paths
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                If nothing changes, cash turns negative by May. Reducing discretionary
                spending and pausing new Buy Now Pay Later plans keeps you above zero.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-[#F7C7C7] bg-[#FFF8F8] px-4 py-2 text-[12px] font-semibold text-[#C53030]">
                Current path: {formatCurrency(lastForecastPoint.current)} by Jul
              </div>
              <div className="rounded-full border border-[#D7E8D8] bg-[#F7FCF9] px-4 py-2 text-[12px] font-semibold text-[#0F9D73]">
                Safer path: {formatCurrency(lastForecastPoint.safer)} by Jul
              </div>
            </div>
          </div>

          <div className="relative mt-8 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastChartData} margin={{ top: 10, right: 12, left: 4, bottom: 14 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis
                  domain={[-250, 700]}
                  tickFormatter={(value) => value < 0 ? `-RM${Math.abs(value)}` : `RM${value}`}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                />
                <Tooltip content={<ForecastTooltip />} />
                <Legend verticalAlign="bottom" content={renderLegend} />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#C53030"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 5, fill: "#C53030" }}
                  name="Current path"
                />
                <Line
                  type="monotone"
                  dataKey="safer"
                  stroke="#0F9D73"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#0F9D73" }}
                  name="Safer path"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 rounded-[22px] border border-[#D7E8D8] bg-[#F7FCF9] p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0F9D73]">
              Why acting now matters
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#111827]">
              If Aisha changes course now, she finishes July with {formatCurrency(lastForecastPoint.safer)} instead of {formatCurrency(lastForecastPoint.current)} - a {formatCurrency(lastForecastPoint.safer - lastForecastPoint.current)} difference. The window to act is still open.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <h3 className="text-[20px] font-semibold text-[#111827]">Monthly cash breakdown - what&apos;s eating the buffer</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Each bar shows one month&apos;s RM3,000 income split into committed costs. The shrinking green slice is what&apos;s left.
          </p>
          <div className="mt-8 space-y-4">
            {metrics.snapshots.map((row) => (
              <div key={row.month} className="flex items-center gap-4">
                <p className="w-8 shrink-0 text-[13px] font-semibold text-[#6B7280]">{row.month}</p>
                <div className="flex h-[32px] flex-1 overflow-hidden rounded-[8px]">
                  <div
                    className="flex h-full items-center justify-center text-[11px] font-semibold text-white"
                    style={{ width: `${(row.essentialSpending / 3000) * 100}%`, backgroundColor: "#6366F1" }}
                    title={`Essential RM${row.essentialSpending}`}
                  />
                  <div
                    className="flex h-full items-center justify-center text-[11px] font-semibold text-white"
                    style={{ width: `${(row.bnplRepayments / 3000) * 100}%`, backgroundColor: "#C53030" }}
                    title={`Buy Now Pay Later RM${row.bnplRepayments}`}
                  />
                  <div
                    className="flex h-full items-center justify-center text-[11px] font-semibold text-white"
                    style={{ width: `${(row.discretionarySpending / 3000) * 100}%`, backgroundColor: "#F59E0B" }}
                    title={`Discretionary RM${row.discretionarySpending}`}
                  />
                  <div
                    className="flex h-full items-center justify-center text-[11px] font-semibold text-white"
                    style={{ width: `${(row.endingBalance / 3000) * 100}%`, backgroundColor: "#0F9D73" }}
                    title={`Remaining RM${row.endingBalance}`}
                  />
                </div>
                <p className={`w-16 text-right text-[13px] font-semibold ${row.endingBalance < 300 ? "text-[#C53030]" : "text-[#0F9D73]"}`}>RM{row.endingBalance}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-5 flex-wrap">
            {[
              { label: "Essential", color: "#6366F1" },
              { label: "Buy Now Pay Later repayments", color: "#C53030" },
              { label: "Discretionary", color: "#F59E0B" },
              { label: "Remaining cash", color: "#0F9D73" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-[12px] text-[#6B7280]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[620px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                Why intervention matters
              </p>
              <h3 className="mt-2 text-[20px] font-semibold text-[#111827]">
                The next risky purchase is where this forecast becomes a real decision
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                Forecast shows the direction of travel. Checkout is where MyDuitAI uses that
                forward-looking evidence to slow down risk, compare the impact, and make the safer
                action easier than the impulsive one.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setScreen("checkout")}
              className="rounded-full bg-[#1652F0] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1446CC]"
            >
              Continue to Checkout
            </button>
          </div>
        </section>
      </div>
      ) : !hasStartedAnalysis ? (
        <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-[560px] items-center justify-center">
          <div className="w-full rounded-[20px] border border-[#E6E8EC] bg-white p-8 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              MyDuitAI Analysis Engine
            </p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-[#111827]">
              Forecast
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
              The AI will simulate your financial trajectory over the next 3 months.
            </p>
            <button
              type="button"
              onClick={() => {
                setHasStartedAnalysis(true);
                setContentVisible(false);
              }}
              className="mt-6 rounded-full bg-[#1652F0] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1446CC]"
            >
              Generate Forecast
            </button>
          </div>
        </div>
      ) : null}
      <NextStepBar
        show={hasAnalysed && contentVisible}
        label="Your financial trajectory is near the intervention threshold. The AI has prepared a protective next step."
        buttonText="See the Intervention →"
        question="Why does my forecast look like this?"
        fallback="Aisha, three payments - Atome RM220, Grab PayLater RM180, and Shopee PayLater RM260 - all land between May 5th and 11th. Your salary only arrives on the 25th. That 20-day gap is what collapses your cash in May. If nothing changes, June looks worse."
      />
    </div>
  );
}

export default Forecast;
