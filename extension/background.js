const DEFAULT_FINANCIAL_STATE = {
  userName: "Aisha",
  score: 49,
  zone: "Danger",
  bnplRatio: 28,
  peerAvgRatio: 14,
  monthlyBnplBurden: 826,
  projectedDecemberCash: -142,
  projectedScore: 42,
  activePlans: 4,
  monthlyIncome: 3000,
};

function ensureFinancialState() {
  chrome.storage.local.get(["financialState"], (result) => {
    if (result.financialState) {
      return;
    }

    chrome.storage.local.set({ financialState: DEFAULT_FINANCIAL_STATE });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureFinancialState();
});

chrome.runtime.onStartup.addListener(() => {
  ensureFinancialState();
});
