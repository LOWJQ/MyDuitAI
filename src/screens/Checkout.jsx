import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CheckoutInterventionPanel from "../components/CheckoutInterventionPanel";
import RiskDriverList from "../components/RiskDriverList";
import { evaluateCheckoutImpact } from "../lib/evaluateCheckoutImpact";
import { getUserFinancialContext } from "../lib/getUserFinancialContext";

function ScoreHealthBar({ scoreBefore, scoreAfter, zoneBefore, zoneAfter }) {
  const [animatedBefore, setAnimatedBefore] = useState(0);
  const [animatedAfter, setAnimatedAfter] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnimatedBefore(scoreBefore);
      setAnimatedAfter(scoreAfter);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [scoreBefore, scoreAfter]);

  return (
    <div className="rounded-[28px] border border-[#F7C7C7] bg-[#FFF8F8] p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
        Financial Stress Score impact
      </p>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-4">
          <p className="w-16 text-[13px] font-semibold text-[#6B7280]">Before</p>
          <div className="relative h-[14px] flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-[#F59E0B] transition-all duration-700"
              style={{ width: `${animatedBefore}%` }}
            />
          </div>
          <p className="w-10 text-right text-[15px] font-semibold text-[#111827]">{scoreBefore}</p>
        </div>

        <div className="flex items-center gap-4">
          <p className="w-16 text-[13px] font-semibold text-[#6B7280]">After</p>
          <div className="relative h-[14px] flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-[#C53030] transition-all duration-700"
              style={{ width: `${animatedAfter}%` }}
            />
          </div>
          <p className="w-10 text-right text-[15px] font-semibold text-[#111827]">{scoreAfter}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="rounded-full bg-[#C53030] px-3 py-1 text-[13px] font-semibold text-white">
          ↓ {scoreBefore - scoreAfter} points
        </span>
        <span className="text-[13px] text-[#6B7280]">if you proceed with Buy Now Pay Later</span>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-[12px] text-[#6B7280]">Currently: {zoneBefore} zone</p>
        <p className="text-[12px] text-[#6B7280]">After purchase: {zoneAfter} zone</p>
      </div>
    </div>
  );
}

function PeerComparisonChart({ userRatio, peerRatio }) {
  const data = [
    { label: "Peer average", value: peerRatio, color: "#1652F0" },
    { label: "You (after)", value: userRatio, color: "#C53030" },
  ];

  const tooltipContent = ({ active, payload }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const point = payload[0]?.payload;

    return (
      <div className="rounded-[16px] border border-[#E6E8EC] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
          {point?.label}
        </p>
        <p className="mt-2 text-[14px] font-semibold text-[#111827]">
          {point?.value}% of monthly income
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-[28px] border border-[#E6E8EC] bg-white p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
        How you compare
      </p>
      <h3 className="mt-1 max-w-[240px] text-[16px] font-semibold leading-snug text-[#111827]">
        Your Buy Now Pay Later ratio vs peers with similar income
      </h3>

      <div className="mt-5 h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              domain={[0, 50]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#111827" }}
            />
            <Tooltip content={tooltipContent} cursor={{ fill: "rgba(17, 24, 39, 0.03)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 rounded-[16px] border border-[#F7C7C7] bg-[#FEF2F2] px-4 py-3">
        <p className="text-[13px] font-semibold text-[#C53030]">
          You are {userRatio - peerRatio} percentage points above the safe peer average. This is
          the danger range.
        </p>
      </div>
    </div>
  );
}

function Checkout({ setScreen }) {
  const [showModal, setShowModal] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [showSupportPath, setShowSupportPath] = useState(false);
  const [showReferralPrep, setShowReferralPrep] = useState(false);
  const { data, metrics, scoreResult, peerComparison, formatCurrency } = getUserFinancialContext();
  const [selectedOptionLabel, setSelectedOptionLabel] = useState(
    data.checkoutScenario.selectedOption,
  );
  const checkoutImpact = useMemo(
    () => evaluateCheckoutImpact(data, metrics, selectedOptionLabel),
    [data, metrics, selectedOptionLabel],
  );

  const selectedOption = checkoutImpact.selectedPaymentOption;
  const installmentCount = selectedOption.installments ?? 1;
  const scoreDeltaLabel =
    checkoutImpact.scoreDelta === 0
      ? "no score change"
      : `${checkoutImpact.scoreDelta > 0 ? "+" : ""}${checkoutImpact.scoreDelta} points`;
  const entersWorseZone =
    checkoutImpact.worseRiskZone && checkoutImpact.projectedZone !== checkoutImpact.currentZone;
  const isCritical = checkoutImpact.criticalIntervention;
  const supportNeeded =
    isCritical || (selectedOption.type === "bnpl" && checkoutImpact.addedBnplBurden >= 6);
  const protectiveLock = supportNeeded && selectedOption.type === "bnpl";

  const checkoutReasons = [
    selectedOption.type === "bnpl"
      ? `This purchase raises your Buy Now Pay Later commitments to ${checkoutImpact.projectedBnplDebtToIncomeRatio}% of your income.`
      : `Paying now reduces your remaining cash immediately to ${formatCurrency(checkoutImpact.projectedEndingBalance)}.`,
    `Your remaining cash buffer would fall to ${formatCurrency(checkoutImpact.projectedEndingBalance)}.`,
    entersWorseZone
      ? `This pushes your score from ${checkoutImpact.currentZone} to ${checkoutImpact.projectedZone}.`
      : `Your score moves from ${checkoutImpact.currentScore} to ${checkoutImpact.projectedScore}.`,
    `Repayment pressure is already elevated in the next 30 days.`,
  ].map((message, index) => ({
    signal: `checkout-reason-${index}`,
    message,
  }));

  return (
    <>
      <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7">
        <div className="mx-auto max-w-[1180px] space-y-6">
          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1652F0]">
                  Intervene layer
                </p>
                <h2 className="mt-4 text-[31px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
                  Should I do this right now?
                </h2>
                <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#5F6673]">
                  This is the intervention moment. MyDuitAI steps in before the purchase is
                  completed, shows the impact clearly, and makes the safer choice the default
                  choice.
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
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
            <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
              <div>
                <h3 className="text-[20px] font-semibold text-[#111827]">Before you proceed</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                  MyDuitAI is designed to interrupt risky spending at the exact moment it matters.
                  The safer choice is the default, and critical cases can escalate into AKPK
                  counselling support.
                </p>
                {protectiveLock ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#F7C7C7] bg-[#FFF4F4] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C53030]">
                    <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                    Protective state active
                  </div>
                ) : null}
              </div>
              <div className="rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  Intervention rule
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">
                  If the score becomes critical, new Buy Now Pay Later spending can trigger a
                  higher-friction intervention and offer AKPK support before more debt is added.
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-8">
            <section className="rounded-[28px] border border-[#E6E8EC] bg-white px-10 py-10">
              <h3 className="text-[24px] font-semibold text-[#111827]">Purchase summary</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#5F6673]">
                Review the purchase, compare the options, and see exactly how this decision changes
                your financial position before you commit to it.
              </p>

              <div className="mt-8 rounded-[22px] border border-[#EEF1F4] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[16px] font-semibold text-[#111827]">
                      {data.checkoutScenario.itemName}
                    </p>
                    <p className="mt-1 text-[13px] text-[#6B7280]">
                      {data.checkoutScenario.merchant}
                    </p>
                  </div>
                  <p className="text-[18px] font-semibold text-[#111827]">
                    {formatCurrency(data.checkoutScenario.amount)}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <label className="mb-3 block text-[15px] font-semibold text-[#111827]">
                  Payment choice
                </label>
                <div className="space-y-3">
                  {data.checkoutScenario.paymentOptions
                    .filter(
                      (option) =>
                        option.type === "full_payment" ||
                        (option.type === "bnpl" && option.installments === 3),
                    )
                    .map((option) => {
                      const isSelected = option.label === selectedOptionLabel;
                      const isProtectedBnpl = option.type === "bnpl" && supportNeeded;
                      const optionTitle =
                        option.type === "full_payment"
                          ? "Pay now"
                          : `Buy Now Pay Later (${option.installments} months)`;

                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => {
                            if (isProtectedBnpl) {
                              return;
                            }

                            setSelectedOptionLabel(option.label);
                          }}
                          className={`flex w-full items-center justify-between rounded-[22px] border px-5 py-4 text-left transition ${
                            isSelected
                              ? option.type === "bnpl"
                                ? "border-[#F7D7A7] bg-[#FFFBF4]"
                                : "border-[#1652F0] bg-[#EEF3FD]"
                              : option.type === "bnpl" && supportNeeded
                                ? "border-[#F7C7C7] bg-[#FFF8F8]"
                                : "border-[#E6E8EC] bg-white"
                          } ${isProtectedBnpl ? "cursor-not-allowed opacity-85" : ""}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[15px] font-semibold text-[#111827]">
                                {optionTitle}
                              </p>
                              {isProtectedBnpl ? (
                                <span className="rounded-full border border-[#F7C7C7] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C53030]">
                                  Protected
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-[13px] text-[#6B7280]">{option.label}</p>
                            {option.type === "bnpl" ? (
                              <p className="mt-2 text-[12px] font-medium text-[#B7791F]">
                                {isProtectedBnpl
                                  ? "Protected state: switch to Pay now to avoid unlocking a new installment"
                                  : "Riskier choice: adds repayment pressure to future months"}
                              </p>
                            ) : (
                              <p className="mt-2 text-[12px] font-medium text-[#1652F0]">
                                Safer choice: avoids creating a new installment obligation
                              </p>
                            )}
                          </div>
                          <p className="text-[15px] font-semibold text-[#111827]">
                            {option.type === "full_payment"
                              ? formatCurrency(option.amount)
                              : `${installmentCount} x ${formatCurrency(option.amount)}`}
                          </p>
                        </button>
                      );
                    })}
                </div>
                {protectiveLock ? (
                  <p className="mt-4 text-[13px] leading-relaxed text-[#C53030]">
                    At this risk level, MyDuitAI pauses new Buy Now Pay Later by default. The
                    safest path is to switch to Pay now or pause 24 hours before continuing.
                  </p>
                ) : null}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-[22px] border border-[#EEF1F4] p-5">
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                    Before purchase
                  </p>
                  <p className="mt-2 text-[28px] font-semibold text-[#111827]">
                    {scoreResult.score}
                  </p>
                  <p className="mt-2 text-[13px] text-[#6B7280]">
                    {scoreResult.zone} zone
                  </p>
                </div>
                <div className="rounded-[22px] border border-[#EEF1F4] p-5">
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                    After purchase
                  </p>
                  <p className="mt-2 text-[28px] font-semibold text-[#C53030]">
                    {checkoutImpact.projectedScore}
                  </p>
                  <p className="mt-2 text-[13px] text-[#6B7280]">
                    {checkoutImpact.projectedZone} zone | {scoreDeltaLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border border-[#F7D7A7] bg-[#FFFBF4] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B7791F]">
                  If you proceed
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                      Risk zone
                    </p>
                    <p className="mt-2 text-[18px] font-semibold text-[#111827]">
                      {entersWorseZone
                        ? `${checkoutImpact.currentZone} to ${checkoutImpact.projectedZone}`
                        : checkoutImpact.projectedZone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                      Buy Now Pay Later burden
                    </p>
                    <p className="mt-2 text-[18px] font-semibold text-[#C53030]">
                      {checkoutImpact.projectedBnplDebtToIncomeRatio}% of income
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                      Month-end cash
                    </p>
                    <p className="mt-2 text-[18px] font-semibold text-[#C53030]">
                      {formatCurrency(checkoutImpact.projectedEndingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <ScoreHealthBar
                scoreBefore={scoreResult.score}
                scoreAfter={checkoutImpact.projectedScore}
                zoneBefore={scoreResult.zone}
                zoneAfter={checkoutImpact.projectedZone}
              />
              <PeerComparisonChart
                userRatio={checkoutImpact.projectedBnplDebtToIncomeRatio}
                peerRatio={peerComparison.peerRatio}
              />
              <CheckoutInterventionPanel
                userName={data.userProfile.name}
                scoreResult={scoreResult}
                checkoutImpact={checkoutImpact}
                peerRatio={peerComparison.peerRatio}
                formatCurrency={formatCurrency}
              />

              <RiskDriverList contributors={checkoutReasons} title="Why this increases risk" />

              {supportNeeded ? (
                <div className="rounded-[28px] border border-[#F7C7C7] bg-[#FFF8F8] p-8">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C53030]">
                    Critical intervention state
                  </p>
                  <h3 className="mt-2 text-[20px] font-semibold text-[#C53030]">
                    New Buy Now Pay Later spending should be paused at this threshold
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#5F6673]">
                    MyDuitAI is treating this as a high-risk decision point. At this level, the
                    system shifts from warning into protective action by increasing friction,
                    discouraging new installment debt, and surfacing AKPK debt counselling support.
                  </p>
                  <div className="mt-5 rounded-[22px] border border-[#F7C7C7] bg-white p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C53030]">
                      What happens now
                    </p>
                    <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-[#111827]">
                      <p>1. Pause is treated as the default action.</p>
                      <p>2. New Buy Now Pay Later spending is strongly discouraged.</p>
                      <p>3. AKPK support can be surfaced before more debt is added.</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-[22px] border border-[#EEF1F4] bg-white p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                      AKPK support path
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">
                      If risk stays critical, MyDuitAI can connect the user to AKPK debt
                      counselling resources before missed obligations turn into formal debt
                      distress.
                    </p>
                    <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-[#6B7280]">
                      <p>Review repayment pressure and month-end cash shortfall</p>
                      <p>Surface counselling support before another installment is added</p>
                      <p>Keep final financial decisions with the user</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSupportPath((current) => !current)}
                      className="mt-5 inline-flex items-center rounded-full border border-[#C53030] px-4 py-2 text-[13px] font-semibold text-[#C53030]"
                    >
                      {showSupportPath ? "Hide AKPK support path" : "View AKPK support path"}
                    </button>

                    {showSupportPath ? (
                      <div className="mt-5 rounded-[20px] border border-[#F7C7C7] bg-[#FFF8F8] p-5">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C53030]">
                          Support flow
                        </p>
                        <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">
                          This is how MyDuitAI would hand the user into support before Buy Now Pay
                          Later stress becomes formal debt distress.
                        </p>

                        <div className="mt-5 space-y-3">
                          {[
                            {
                              step: "01",
                              title: "Risk is confirmed",
                              description:
                                "MyDuitAI detects that the score has crossed into a critical repayment state.",
                            },
                            {
                              step: "02",
                              title: "Spending is slowed down",
                              description:
                                "New Buy Now Pay Later is paused by default so the user can review the forecast before adding more debt.",
                            },
                            {
                              step: "03",
                              title: "Support is surfaced",
                              description:
                                "AKPK debt counselling is offered as a next step while the user still keeps final control over what to do next.",
                            },
                          ].map((item) => (
                            <div
                              key={item.step}
                              className="flex gap-4 rounded-[18px] border border-[#F7C7C7] bg-white p-4"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[12px] font-semibold text-[#C53030]">
                                {item.step}
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-[#111827]">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-[18px] border border-[#EEF1F4] bg-white p-4">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                            What the user can do next
                          </p>
                          <p className="mt-2 text-[13px] leading-relaxed text-[#111827]">
                            Review the forecast again, pause for 24 hours, or move into AKPK
                            counselling support if repayment pressure keeps rising.
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setScreen("forecast")}
                            className="rounded-full bg-[#1652F0] px-5 py-2.5 text-[13px] font-semibold text-white"
                          >
                            Review forecast first
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReferralPrep((current) => !current)}
                            className="rounded-full border border-[#C53030] px-5 py-2.5 text-[13px] font-semibold text-[#C53030]"
                          >
                            {showReferralPrep ? "Hide referral prep" : "Prepare AKPK referral"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSupportPath(false)}
                            className="rounded-full border border-[#E6E8EC] px-5 py-2.5 text-[13px] font-semibold text-[#6B7280]"
                          >
                            Not now
                          </button>
                        </div>

                        {showReferralPrep ? (
                          <div className="mt-5 rounded-[18px] border border-[#F7C7C7] bg-white p-4">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C53030]">
                              Referral preparation
                            </p>
                            <p className="mt-2 text-[13px] leading-relaxed text-[#111827]">
                              MyDuitAI would prepare a support handoff using the user&apos;s current
                              risk state, repayment pressure, and recent month-end cash decline so
                              AKPK counselling starts with context instead of starting cold.
                            </p>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                              <div className="rounded-[16px] border border-[#EEF1F4] bg-[#FBFCFE] p-3">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                                  Current score
                                </p>
                                <p className="mt-2 text-[18px] font-semibold text-[#C53030]">
                                  {checkoutImpact.projectedScore}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-[#EEF1F4] bg-[#FBFCFE] p-3">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                                  Buy Now Pay Later burden
                                </p>
                                <p className="mt-2 text-[18px] font-semibold text-[#C53030]">
                                  {checkoutImpact.projectedBnplDebtToIncomeRatio}%
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-[#EEF1F4] bg-[#FBFCFE] p-3">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                                  Cash left
                                </p>
                                <p className="mt-2 text-[18px] font-semibold text-[#C53030]">
                                  {formatCurrency(checkoutImpact.projectedEndingBalance)}
                                </p>
                              </div>
                            </div>
                            <p className="mt-4 text-[12px] leading-relaxed text-[#6B7280]">
                              This remains user-controlled. MyDuitAI prepares the support path, but
                              the user still decides whether to move into counselling.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[28px] border border-[#E6E8EC] bg-white p-8">
                <h3 className="text-[20px] font-semibold text-[#111827]">Recommended next step</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                  The safest action is to pause now, review the forecast, and avoid adding new
                  repayment pressure today if you can.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-[22px] border border-[#D7E8D8] bg-[#F7FCF9] p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0F9D73]">
                      If you pause 24h
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-[#111827]">
                      No new repayment is added today
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                      You keep the current score at {scoreResult.score}, avoid new installment
                      pressure, and leave space to review the forecast before deciding.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[#F7D7A7] bg-[#FFFBF4] p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B7791F]">
                      If you continue now
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-[#111827]">
                      Risk rises immediately after checkout
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                      Your score moves to {checkoutImpact.projectedScore}, cash falls to{" "}
                      {formatCurrency(checkoutImpact.projectedEndingBalance)}, and repayment
                      pressure stays elevated into the next cycle.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center rounded-full bg-[#1652F0] px-8 py-4 text-[16px] font-semibold text-white transition hover:bg-[#1446CC]"
                  >
                    Pause 24h
                  </button>
                  <p className="text-center text-[12px] font-medium text-[#1652F0]">
                    Recommended by MyDuitAI as the default safer action
                  </p>
                  <button
                    type="button"
                    onClick={() => setScreen("forecast")}
                    className="flex w-full items-center justify-center rounded-full border border-[#1652F0] px-8 py-4 text-[15px] font-semibold text-[#1652F0]"
                  >
                    Review the forecast again
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmStep(false);
                      setShowModal(true);
                    }}
                    className={`w-full text-center text-[13px] font-medium ${
                      supportNeeded ? "text-[#C53030]" : "text-[#9CA3AF]"
                    }`}
                  >
                    {protectiveLock ? "Request manual override" : "Proceed anyway"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/35">
          <div className="coinbase-shell-card w-full max-w-[600px] px-10 py-10">
            {!confirmStep ? (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C53030]">
                  {protectiveLock ? "Manual override required" : "Final confirmation"}
                </p>
                <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
                  {protectiveLock ? "Continue with manual override?" : "Proceed anyway?"}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[#5F6673]">
                  This choice leaves an estimated{" "}
                  {formatCurrency(checkoutImpact.projectedEndingBalance)} at month end and sets your
                  projected Financial Stress Score to {checkoutImpact.projectedScore}.
                </p>
                <div className="mt-6 rounded-[20px] border border-[#EEF1F4] bg-[#FBFCFE] p-4">
                  <p className="text-[13px] leading-relaxed text-[#111827]">
                    This confirmation is intentionally high-friction. MyDuitAI is designed to slow
                    down risky purchases before they become longer-term financial stress.
                  </p>
                </div>
                {supportNeeded ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-[#C53030]">
                    Buy Now Pay Later is strongly discouraged here because this purchase would keep
                    your finances in a critical or near-critical state and may warrant AKPK
                    support.
                  </p>
                ) : null}
                <div className="mt-8 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmStep(false);
                      setShowModal(false);
                    }}
                    className="flex w-full items-center justify-center rounded-full bg-[#F1F3F5] px-8 py-4 text-[15px] font-semibold text-[#111827]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep(true)}
                    className="flex w-full items-center justify-center rounded-full bg-[#1652F0] px-8 py-4 text-[15px] font-semibold text-white transition hover:bg-[#1446CC]"
                  >
                    {protectiveLock ? "Continue with override request" : "Confirm and continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C53030]">
                  One more step
                </p>
                <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
                  Are you absolutely sure?
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[#5F6673]">
                  Are you sure? This adds {formatCurrency(selectedOption.amount)} per month to your
                  existing repayment load.
                </p>
                {protectiveLock ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-[#C53030]">
                    This action overrides MyDuitAI's protective state and keeps your risk elevated.
                    AKPK support is recommended before continuing.
                  </p>
                ) : null}
                <div className="mt-8 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmStep(false);
                      setShowModal(false);
                    }}
                    className="flex w-full items-center justify-center rounded-full bg-[#1652F0] px-8 py-4 text-[15px] font-semibold text-white transition hover:bg-[#1446CC]"
                  >
                    {protectiveLock ? "Yes, continue despite the risk" : "Yes, I understand the risk"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep(false)}
                    className="flex w-full items-center justify-center rounded-full bg-[#F1F3F5] px-8 py-4 text-[15px] font-semibold text-[#111827]"
                  >
                    Go back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Checkout;
