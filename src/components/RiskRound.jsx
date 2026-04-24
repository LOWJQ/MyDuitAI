import ScoreGauge from "./ScoreGauge";

const zoneStyles = {
  Stable: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Warning: "text-amber-600 bg-amber-50 border-amber-200",
  Danger: "text-red-600 bg-red-50 border-red-200",
  Critical: "text-red-700 bg-red-50 border-red-200",
};

function RiskRound({ score, zone }) {
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
    <div className="h-full rounded-[32px] border border-[#E6E8EC] bg-white p-8">
      <div className="flex h-full items-center justify-center rounded-[28px] border border-[#EEF1F4] bg-[#FBFCFE] px-5 py-6">
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
  );
}

export default RiskRound;
