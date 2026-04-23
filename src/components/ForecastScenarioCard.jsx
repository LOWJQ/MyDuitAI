function ForecastScenarioCard({
  title,
  horizons = [],
  comparison = [],
  tone = "neutral",
  formatCurrency,
}) {
  const toneStyles = {
    neutral: "border-[#E6E8EC] bg-white",
    danger: "border-[#F7C7C7] bg-[#FFF8F8]",
    safer: "border-[#D7E8D8] bg-[#F7FCF9]",
  };

  return (
    <div className={`rounded-[26px] border p-6 ${toneStyles[tone] ?? toneStyles.neutral}`}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[18px] font-semibold text-[#111827]">{title}</h4>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
            tone === "safer" ? "bg-[#EAF7EE] text-[#0F9D73]" : "bg-[#FEECEC] text-[#C53030]"
          }`}
        >
          {tone === "safer" ? "Safer path" : "Current path"}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
        {tone === "safer"
          ? "This shows what recovery starts to look like if you slow discretionary spending and avoid new installment pressure."
          : "This shows what happens if repayment pressure and current spending behaviour continue without intervention."}
      </p>
      <div className="mt-5 space-y-4">
        {horizons.map((horizon, index) => (
          <div
            key={horizon.days}
            className="border-t border-[#EEF1F4] pt-4 first:border-t-0 first:pt-0"
          >
            <p className="text-[14px] font-semibold text-[#111827]">{horizon.label}</p>
            <p className="mt-2 text-[13px] text-[#6B7280]">
              Remaining cash at month end: {formatCurrency(horizon.projectedRemainingCash)}
            </p>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              Buy Now Pay Later burden: {horizon.bnplBurdenRatio}% of income
            </p>
            <p
              className={`mt-1 text-[13px] font-semibold ${
                tone === "safer" ? "text-[#0F9D73]" : "text-[#C53030]"
              }`}
            >
              {horizon.riskOutlook}
            </p>
            {comparison[index]?.cashImprovement ? (
              <p className="mt-2 text-[13px] text-[#1652F0]">
                Improved vs current path: {formatCurrency(comparison[index].cashImprovement)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ForecastScenarioCard;
