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
  const { data, metrics, scoreResult } = getUserFinancialContext();
  const forecast = projectFinancialForecast(data, metrics);
  const current60Day = forecast.currentBehavior.find((item) => item.days === 60);
  const safer60Day = forecast.saferBehavior.find((item) => item.days === 60);
  const comparison60Day = forecast.comparison.find((item) => item.days === 60);
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
                This is the forward-looking layer of MyDuitAI. It shows where your current
                spending and Buy Now Pay Later behaviour are likely to take you over the next 30,
                60, and 90 days.
              </p>
              <p className="mt-5 max-w-[620px] text-[14px] leading-relaxed text-[#111827]">
                If nothing changes, the pattern does not stay neutral. It pushes cash lower,
                repayment pressure higher, and recovery further away.
              </p>
              <p className="mt-4 max-w-[620px] text-[13px] leading-relaxed text-[#6B7280]">
                If the score falls below the critical threshold, MyDuitAI can move from forecast
                and warning into active AKPK support escalation.
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
              If current behaviour continues, Aisha is likely to keep drifting deeper into danger.
              In the next 60 days, remaining cash could fall to{" "}
              <span className="font-semibold text-[#C53030]">
                {formatCurrency(current60Day?.projectedRemainingCash ?? 0)}
              </span>{" "}
              while Buy Now Pay Later burden stays elevated.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#F7D7A7] bg-[#FFFBF4] p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-6">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#B7791F]">
                Escalation threshold
              </p>
              <h3 className="mt-2 text-[22px] font-semibold text-[#111827]">
                When forecast turns into protection
              </h3>
              <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-[#5F6673]">
                Forecast is the education layer. But if the Financial Stress Score keeps falling
                into the critical zone, MyDuitAI stops behaving like a passive warning system and
                starts applying protection at checkout.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-[#F7C7C7] bg-white p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  Distance to critical
                </p>
                <p className="mt-2 text-[24px] font-semibold text-[#C53030]">
                  {pointsToCritical} points
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                  Aisha is only {pointsToCritical} points away from the threshold where MyDuitAI
                  switches from warning into active protection.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#F7D7A7] bg-white p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  What changes at critical risk
                </p>
                <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-[#111827]">
                  <p>1. New Buy Now Pay Later is slowed down by default</p>
                  <p>2. Manual override is required to continue</p>
                  <p>3. AKPK support can be surfaced before more debt is added</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h3 className="text-[20px] font-semibold text-[#111827]">At your current pace</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                This is the path your finances are on if the current pattern continues through the
                next 60 days.
              </p>
            </div>
            <div className="rounded-[18px] border border-[#EEF1F4] px-5 py-4">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                Cash flow trend
              </p>
              <p className="mt-2 text-[18px] font-semibold text-[#111827] capitalize">
                {forecast.currentCashTrend}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
              60-day outlook
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#111827]">
              If current behaviour continues, your month-end cash buffer is likely to stay under
              pressure while Buy Now Pay Later repayments continue overlapping with everyday
              spending.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-5">
            {forecast.currentBehavior.map((horizon) => (
              <div key={horizon.days} className="rounded-[22px] border border-[#EEF1F4] p-5">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  {horizon.label}
                </p>
                <div className="mt-4 space-y-3 text-[14px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Projected income</span>
                    <span className="font-semibold text-[#111827]">
                      {formatCurrency(horizon.projectedIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Projected spending</span>
                    <span className="font-semibold text-[#111827]">
                      {formatCurrency(horizon.projectedSpending)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Buy Now Pay Later repayments</span>
                    <span className="font-semibold text-[#C53030]">
                      {formatCurrency(horizon.projectedBnplRepayments)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Remaining cash</span>
                    <span
                      className={`font-semibold ${
                        horizon.projectedRemainingCash < 0 ? "text-[#C53030]" : "text-[#111827]"
                      }`}
                    >
                      {formatCurrency(horizon.projectedRemainingCash)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <h3 className="text-[20px] font-semibold text-[#111827]">Scenario comparison</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Compare the likely outcome if current behaviour continues versus cutting discretionary
            spending and avoiding new Buy Now Pay Later usage.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <ForecastScenarioCard
              title="Current behavior continues"
              tone="danger"
              horizons={forecast.currentBehavior}
              formatCurrency={formatCurrency}
            />
            <ForecastScenarioCard
              title="Reduce discretionary spending"
              tone="safer"
              horizons={forecast.saferBehavior}
              comparison={forecast.comparison}
              formatCurrency={formatCurrency}
            />
          </div>

          <div className="mt-6 rounded-[22px] border border-[#D7E8D8] bg-[#F7FCF9] p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0F9D73]">
              Why acting now matters
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#111827]">
              If Aisha changes course while she is still in the warning-to-danger range, the next
              60 days look materially different. Remaining cash improves by{" "}
              <span className="font-semibold text-[#0F9D73]">
                {formatCurrency(comparison60Day?.cashImprovement ?? 0)}
              </span>{" "}
              and the outlook shifts from{" "}
              <span className="font-semibold">{current60Day?.riskOutlook?.toLowerCase()}</span> to{" "}
              <span className="font-semibold text-[#0F9D73]">
                {safer60Day?.riskOutlook?.toLowerCase()}
              </span>
              .
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
          <h3 className="text-[20px] font-semibold text-[#111827]">Where this is heading</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            This is the part that matters most: whether your cash buffer is recovering or getting
            tighter from here.
          </p>
          <div className="mt-6 space-y-4">
            {forecast.narrative.map((line) => (
              <div
                key={line}
                className="rounded-[20px] border border-[#EEF1F4] px-4 py-3"
                style={{ borderLeftWidth: 4, borderLeftColor: getNarrativeBorderColor(line) }}
              >
                <p className="text-[14px] leading-relaxed text-[#111827]">{line}</p>
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
