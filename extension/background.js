const DEFAULT_FINANCIAL_STATE = {
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
