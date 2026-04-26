const DEFAULT_FINANCIAL_STATE = {
  stateVersion: "airpods-rm505-score-38",
  userName: "Aisha",
  score: 38,
  zone: "Intervention",
  bnplRatio: 38,
  peerAvgRatio: 22,
  monthlyBnplBurden: 826,
  purchaseName: "AirPods",
  purchaseAmount: 505,
  purchaseInstallment: 168,
  projectedMayCash: -144,
  projectedDecemberCash: -144,
  projectedScore: 38,
  activePlans: 4,
  monthlyIncome: 3000,
};

function ensureFinancialState() {
  chrome.storage.local.set({
    financialState: {
      ...DEFAULT_FINANCIAL_STATE,
    },
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureFinancialState();
});

chrome.runtime.onStartup.addListener(() => {
  ensureFinancialState();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "MYDUITAI_OPEN_DASHBOARD") {
    return;
  }

  chrome.tabs.create({ url: message.url || "http://localhost:5173/dashboard.html#forecast" });
});
