function RiskDriverList({ contributors = [], title = "Why your score changed" }) {
  return (
    <div className="rounded-[28px] border border-[#E6E8EC] bg-white p-6">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1652F0]">
        {title}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
        These are the clearest reasons MyDuitAI believes financial risk is increasing right now.
      </p>
      <div className="mt-5 space-y-4">
        {contributors.map((contributor, index) => (
          <div
            key={contributor.signal}
            className="flex items-center gap-4 rounded-[22px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF3FD] text-[12px] font-semibold text-[#1652F0]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] leading-relaxed text-[#111827]">{contributor.message}</p>
              {typeof contributor.impact === "number" && contributor.impact !== 0 ? (
                <p className="mt-1 text-[12px] text-[#6B7280]">
                  This signal reduced your score by {Math.abs(contributor.impact)} points.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskDriverList;
