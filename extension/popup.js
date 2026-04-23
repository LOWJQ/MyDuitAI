const DEFAULT_STATE = {
  userName: "Aisha",
  score: 48,
  zone: "Danger",
  bnplRatio: 38,
  peerAvgRatio: 22,
  monthlyBnplBurden: 456,
  projectedDecemberCash: -10,
  projectedScore: 41,
  activePlans: 4,
  monthlyIncome: 3000,
};

function formatRinggit(value) {
  return `RM${Number(value || 0).toLocaleString("en-MY")}`;
}

function renderPopup(state) {
  const scoreLine = document.getElementById("score-line");
  const zoneLine = document.getElementById("zone-line");
  const activePlans = document.getElementById("active-plans");
  const monthlyBurden = document.getElementById("monthly-burden");

  scoreLine.textContent = `Financial Stress Score: ${state.score} — ${state.zone}`;
  zoneLine.textContent = state.zone;
  activePlans.textContent = String(state.activePlans);
  monthlyBurden.textContent = formatRinggit(state.monthlyBnplBurden);
}

chrome.storage.local.get(["financialState"], (result) => {
  const state = result.financialState ? { ...DEFAULT_STATE, ...result.financialState } : DEFAULT_STATE;
  renderPopup(state);
});

document.getElementById("dashboard-button")?.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:5173" });
});
