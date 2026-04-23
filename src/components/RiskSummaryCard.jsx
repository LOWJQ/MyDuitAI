import ScoreGauge from "./ScoreGauge";

const zoneStyles = {
  Stable: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Warning: "text-amber-600 bg-amber-50 border-amber-200",
  Danger: "text-red-600 bg-red-50 border-red-200",
  Critical: "text-red-700 bg-red-50 border-red-200",
};

function RiskSummaryCard({ score, zone, summary }) {
  const zoneDescriptions = {
    Stable: "Financially stable with healthy room to absorb new commitments.",
    Warning: "Early pressure is building and should be addressed before it compounds.",
    Danger: "Financial strain is becoming visible across multiple behavioural signals.",
    Critical: "Immediate support is recommended to prevent deeper financial distress.",
  };
  const zoneNowMessages = {
    Stable: "Right now, Aisha still has room to recover before risk becomes visible in day-to-day cash flow.",
    Warning:
      "Right now, pressure is building quietly in the background even if the user still feels mostly in control.",
    Danger:
      "Right now, Aisha is drifting into a zone where everyday spending, repayments, and low month-end cash are starting to overlap.",
    Critical:
      "Right now, the user is close enough to financial distress that protection and support should appear before more debt is added.",
  };
  return (
    <div className="rounded-[32px] border border-[#E6E8EC] bg-white p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-center gap-8">
        <div className="max-w-[640px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1652F0]">
            Financial Stress Score
          </p>
          <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
            A forward-looking signal of financial wellbeing
          </h2>
          <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-[#5F6673]">
            MyDuitAI combines multiple behavioural signals to estimate how close a user is drifting
            toward financial distress.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-[#111827]">
            Lower score = higher financial risk.
          </p>

          <div className="mt-5 rounded-[18px] border border-[#EEF1F4] bg-[#FBFCFE] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
              What this means right now
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">
              {zoneNowMessages[zone] ?? zoneNowMessages.Warning}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-[20px] border border-[#EEF1F4] bg-[#FBFCFE] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                Current interpretation
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">{summary}</p>
            </div>

            <div className="rounded-[20px] border border-[#EEF1F4] bg-[#FBFCFE] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                What this zone means
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#111827]">
                {zoneDescriptions[zone] ?? zoneDescriptions.Warning}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center rounded-[28px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="scale-105">
              <ScoreGauge score={score} />
            </div>
            <span
              className={`mt-4 rounded-full border px-5 py-2.5 text-[15px] font-semibold ${zoneStyles[zone] ?? zoneStyles.Warning}`}
            >
              {zone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskSummaryCard;
