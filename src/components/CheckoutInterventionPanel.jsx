function CheckoutInterventionPanel({
  userName,
  scoreResult,
  checkoutImpact,
  peerRatio,
  formatCurrency,
}) {
  const isCritical =
    scoreResult.zone === "Critical" || checkoutImpact.projectedZone === "Critical";
  const ratioGap = Math.max(0, checkoutImpact.projectedBnplDebtToIncomeRatio - peerRatio);

  return (
    <div
      className={`rounded-[28px] border p-6 ${
        isCritical ? "border-[#F7C7C7] bg-[#FFF8F8]" : "border-[#E6E8EC] bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="pt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L2 20h20L12 2z"
              stroke={isCritical ? "#EF4444" : "#F59E0B"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 9v5M12 16.5v.5"
              stroke={isCritical ? "#EF4444" : "#F59E0B"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
            Intervention layer
          </p>
          <h2 className="mt-1 text-[16px] font-semibold text-[#111827]">
            {isCritical ? "Your financial position is at high risk" : "Before you proceed"}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5F6673]">
            {checkoutImpact.paymentType === "bnpl"
              ? `${userName}, this purchase increases your Buy Now Pay Later burden to ${checkoutImpact.projectedBnplDebtToIncomeRatio}% of income. At this pace, your remaining cash may drop to ${formatCurrency(checkoutImpact.projectedEndingBalance)} and your Financial Stress Score moves from ${scoreResult.score} to ${checkoutImpact.projectedScore}.`
              : `${userName}, paying now reduces your remaining cash to ${formatCurrency(checkoutImpact.projectedEndingBalance)}. Your Financial Stress Score moves from ${scoreResult.score} to ${checkoutImpact.projectedScore} without adding a new Buy Now Pay Later repayment.`}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#111827]">
            Users with similar income average a {peerRatio}% Buy Now Pay Later ratio. You would be
            at {checkoutImpact.projectedBnplDebtToIncomeRatio}% after this purchase.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-[22px] border border-[#E6E8EC] bg-white p-4">
          <p className="text-[24px] font-semibold text-[#C53030]">
            {checkoutImpact.projectedBnplDebtToIncomeRatio}%
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Income committed after purchase
          </p>
        </div>
        <div className="rounded-[22px] border border-[#E6E8EC] bg-white p-4">
          <p className="text-[24px] font-semibold text-[#0F9D73]">{peerRatio}%</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">Peers your age</p>
        </div>
        <div className="rounded-[22px] border border-[#E6E8EC] bg-white p-4">
          <p className="text-[24px] font-semibold text-[#C53030]">
            {formatCurrency(checkoutImpact.projectedEndingBalance)}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Cash left after purchase
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
          Social proof nudge
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#111827]">
          People with similar income typically stay near {peerRatio}%. This decision would place
          you {ratioGap} percentage points above that level.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
          MyDuitAI uses this comparison to show when a repayment pattern is becoming unusually
          risky, not just personally uncomfortable.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-5 rounded-[24px] border border-[#E6E8EC] bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-[#EEF1F4] px-4 py-3 text-center">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">Now</p>
            <p className="mt-1 text-[26px] font-semibold text-[#111827]">{scoreResult.score}</p>
          </div>
          <div className="rounded-[18px] border border-[#F7C7C7] px-4 py-3 text-center">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#9CA3AF]">After</p>
            <p className="mt-1 text-[26px] font-semibold text-[#C53030]">
              {checkoutImpact.projectedScore}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
            Financial Stress Score
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">
            Right now you are at {scoreResult.score} in the {scoreResult.zone.toLowerCase()} zone.
            If you proceed, you move to {checkoutImpact.projectedScore} in the{" "}
            {checkoutImpact.projectedZone.toLowerCase()} zone.
          </p>
          {isCritical ? (
            <p className="mt-3 text-[13px] leading-relaxed text-[#C53030]">
              This is the escalation threshold. AKPK support can be triggered at this level to
              connect the user to debt counselling before another installment is added.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CheckoutInterventionPanel;
