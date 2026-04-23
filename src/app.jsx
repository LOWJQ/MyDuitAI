import { useEffect, useState } from "react";
import Checkout from "./screens/Checkout";
import Forecast from "./screens/Forecast";
import Overview from "./screens/Overview";
import Signals from "./screens/Signals";
import { getUserFinancialContext } from "./lib/getUserFinancialContext";

const sidebarItems = [
  { label: "Overview", screen: "overview", icon: "home" },
  { label: "Signals", screen: "signals", icon: "receipt" },
  { label: "Forecast", screen: "forecast", icon: "clock" },
  { label: "Checkout", screen: "checkout", icon: "compass" },
];
const demoSteps = [
  { label: "Your Risk", screen: "overview" },
  { label: "What We See", screen: "signals" },
  { label: "Where This Leads", screen: "forecast" },
  { label: "Decision Moment", screen: "checkout" },
];

function SidebarIcon({ icon, active = false }) {
  const stroke = active ? "#1652F0" : "#111827";

  if (icon === "home") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 11.5L12 5L20 11.5V19A1 1 0 0 1 19 20H5A1 1 0 0 1 4 19V11.5Z" fill={stroke} />
      </svg>
    );
  }

  if (icon === "clock") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2.2" />
        <path d="M12 7V12H16" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "receipt") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 4H18V20L15 18L12 20L9 18L6 20V4Z"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 9H15M9 13H15" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2.2" />
      <path d="M9 15L11 9L15 11L13 15L9 15Z" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function App() {
  const [screen, setScreen] = useState("overview");
  const { data, scoreResult, formatCurrency } = getUserFinancialContext();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen]);

  const scoreTone =
    scoreResult.score >= 80
      ? {
          card: "border-[#D7E8D8] bg-[#F7FCF9]",
          score: "text-[#0F9D73]",
          zone: "text-[#0F9D73]",
        }
      : scoreResult.score >= 60
        ? {
            card: "border-[#F7D7A7] bg-[#FFFBF4]",
            score: "text-[#B7791F]",
            zone: "text-[#B7791F]",
          }
        : {
            card: "border-[#F7C7C7] bg-[#FFF8F8]",
            score: "text-[#C53030]",
            zone: "text-[#C53030]",
          };

  const pageMeta = {
    overview: {
      title: "Overview",
      subtitle: "Predict financial distress before it becomes a crisis.",
      layer: "Predict",
    },
    signals: {
      title: "Signals",
      subtitle: "See the behavioural evidence feeding the Financial Stress Score.",
      layer: "Predict",
    },
    forecast: {
      title: "Forecast",
      subtitle: "Educate the user with a forward-looking view of what happens next.",
      layer: "Educate",
    },
    checkout: {
      title: "Checkout",
      subtitle: "Intervene at the moment of decision with friction by default.",
      layer: "Intervene",
    },
  };

  const renderScreen = () => {
    switch (screen) {
      case "signals":
        return <Signals setScreen={setScreen} />;
      case "forecast":
        return <Forecast setScreen={setScreen} />;
      case "checkout":
        return <Checkout setScreen={setScreen} />;
      case "overview":
      default:
        return <Overview setScreen={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827]">
      <aside
        className="fixed left-0 top-0 flex h-screen w-[260px] flex-col overflow-hidden border-r bg-white px-5 py-6"
        style={{ borderColor: "#E6E8EC" }}
      >
        <div className="flex h-full flex-col">
          <p className="text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">MyDuitAI</p>

          <nav className="mt-6 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = item.screen === screen;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setScreen(item.screen)}
                  className={`flex w-full items-center justify-between rounded-full px-4 py-3.5 text-left text-[15px] font-semibold transition ${
                    isActive
                      ? "bg-[#EEF3FD] text-[#1652F0]"
                      : "text-[#111827] hover:bg-[#F8F9FB]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <SidebarIcon icon={item.icon} active={isActive} />
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className="rounded-[20px] border border-[#EEF1F4] p-3.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                Current user
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[#111827]">{data.userProfile.name}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">
                {data.userProfile.age} years old · {formatCurrency(data.userProfile.monthlyIncome)} monthly income
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">
                {data.userProfile.employmentStatus}
              </p>
              <p className="mt-2.5 text-[12px] leading-relaxed text-[#6B7280]">
                Critical scores can trigger AKPK referral and counselling support.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-[260px] min-h-screen bg-[#F7F9FC]">
        <div className="border-b border-[#E6E8EC] bg-white/95 px-8 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-[#111827]">
                  {pageMeta[screen].title}
                </h1>
                <span className="rounded-full border border-[#DCE7FF] bg-[#EEF3FD] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1652F0]">
                  {pageMeta[screen].layer}
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                {pageMeta[screen].subtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {demoSteps.map((step, index) => {
                  const isActive = step.screen === screen;

                  return (
                    <button
                      key={step.screen}
                      type="button"
                      onClick={() => setScreen(step.screen)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                        isActive
                          ? "border-[#DCE7FF] bg-[#EEF3FD] text-[#1652F0]"
                          : "border-[#EEF1F4] bg-white text-[#6B7280] hover:border-[#DCE7FF] hover:text-[#1652F0]"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isActive ? "bg-[#1652F0] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span>{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-[20px] border px-4 py-3 ${scoreTone.card}`}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                Financial Stress Score
              </p>
              <div className="mt-2 flex items-center gap-3">
                <p className={`text-[24px] font-semibold ${scoreTone.score}`}>{scoreResult.score}</p>
                <p className={`text-[13px] font-semibold ${scoreTone.zone}`}>{scoreResult.zone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[calc(100vh-84px)]">{renderScreen()}</div>
      </main>
    </div>
  );
}

export default App;
