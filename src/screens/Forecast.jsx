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
import ForecastScenarioCard from "../components/ForecastScenarioCard";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

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
  const forecastChartData = [
    { month: "Apr (now)", current: 156, safer: 156 },
    { month: "May", current: 42, safer: 310 },
    { month: "Jun", current: -89, safer: 480 },
    { month: "Jul", current: -201, safer: 620 },
  ];

  const { data, metrics, scoreResult } = getUserFinancialContext();
  const forecast = projectFinancialForecast(data, metrics);
  const current60Day = forecast.currentBehavior.find((item) => item.days === 60);
  const pointsToCritical = Math.max(0, scoreResult.score - 40);
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
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
      <div className="mx-auto max-w-[1180px] space-y-6">
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
              while BNPL burden stays elevated.
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
                If nothing changes, cash turns negative by June. Reducing discretionary
                spending and pausing new BNPL keeps you above zero.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-[#F7C7C7] bg-[#FFF8F8] px-4 py-2 text-[12px] font-semibold text-[#C53030]">
                Current path: -RM201 by Jul
              </div>
              <div className="rounded-full border border-[#D7E8D8] bg-[#F7FCF9] px-4 py-2 text-[12px] font-semibold text-[#0F9D73]">
                Safer path: +RM620 by Jul
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
                  tickFormatter={(value) => `RM${value}`}
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
              If Aisha changes course now, she finishes July with RM620 instead of -RM201 - a RM821 difference. The window to act is still open.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <h3 className="text-[20px] font-semibold text-[#111827]">Where this is heading</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Three moments matter most over the next 90 days.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {forecast.currentBehavior.map((item) => (
              <div
                key={item.days}
                className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-5"
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  {item.label}
                </p>
                <p
                  className={`mt-3 text-[24px] font-semibold ${
                    item.projectedRemainingCash < 0 ? "text-[#C53030]" : "text-[#111827]"
                  }`}
                >
                  {formatCurrency(item.projectedRemainingCash)}
                </p>
                <p className="mt-2 text-[13px] text-[#6B7280]">
                  Cash left after bills and BNPL repayments
                </p>
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
    </div>
  );
}

export default Forecast;
