import ScoreGauge from "./ScoreGauge";

const zoneStyles = {
  Healthy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Warning: "text-amber-600 bg-amber-50 border-amber-200",
  Intervention: "text-red-700 bg-red-50 border-red-200",
};

function RiskSummaryCard({ score, zone, summary }) {
  const zoneDescriptions = {
    Healthy: "Financially healthy, with room to absorb new commitments.",
    Warning: "Early pressure is building and should be addressed before it compounds.",
    Intervention: "Protective support is recommended before more debt is added.",
  };
  const zoneNowMessages = {
    Healthy: "Right now, Aisha has room to absorb commitments without visible day-to-day cash pressure.",
    Warning:
      "Right now, pressure is building quietly in the background even if the user still feels mostly in control.",
    Intervention:
      "Right now, the user is close enough to financial distress that protection and support should appear before more debt is added.",
  };
  return (
    <div className="rounded-[32px] border border-[#E6E8EC] bg-white p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-center gap-8">
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
