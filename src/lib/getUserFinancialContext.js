import { mockUserData } from "../data/mockUserData";
import { deriveFinancialMetrics } from "./deriveFinancialMetrics";
import { calculateFinancialStressScore } from "./calculateFinancialStressScore";
import { evaluateCheckoutImpact } from "./evaluateCheckoutImpact";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("MYR", "RM")
    .replace(/\s/g, "");

const severityToStatus = {
  high: "danger",
  medium: "warning",
  low: "safe",
};

const buildRiskSignalValue = (signal, metrics) => {
  switch (signal.type) {
    case "bnpl_growth":
      return `${metrics.bnplUsageFrequency.newPlanCount60d} new plans`;
    case "late_repayment":
      return `${metrics.lateRepaymentCount + metrics.missedRepaymentCount} events`;
    case "balance_decline":
      return `${formatCurrency(metrics.latestEndingBalance)} left`;
    case "bnpl_overlap":
      return `${metrics.monthlyBnplRepayments} / month`;
    case "bnpl_frequency":
      return `${metrics.bnplUsageFrequency.relatedTransactionCount60d} txns`;
    default:
      return "Monitoring";
  }
};

const buildDashboardSignals = (metrics) =>
  metrics.recentRiskSignals.map((signal) => ({
    id: signal.type,
    label: signal.title,
    status: severityToStatus[signal.severity] ?? "warning",
    value: buildRiskSignalValue(signal, metrics),
    description: signal.detail,
  }));

const buildForecastData = (metrics) =>
  metrics.snapshots.map((snapshot) => ({
    month: snapshot.month,
    balance: snapshot.endingBalance,
    buyNowPayLater: snapshot.bnplRepayments,
  }));

const sortByDateDesc = (items, field = "date") =>
  [...items].sort((left, right) => new Date(right[field]) - new Date(left[field]));

const buildForecastProjections = (metrics) => {
  const latestSnapshot = metrics.latestSnapshot;
  const discretionaryBuffer = Math.round(latestSnapshot.discretionarySpending * 0.25);

  return [
    {
      id: "30d",
      title: "If current behaviour continues",
      days: 30,
      endingBalance: latestSnapshot.endingBalance,
      bnplRatio: metrics.bnplDebtToIncomeRatio,
      summary:
        "Current commitments already leave a thin cash buffer at the end of the next cycle.",
      tone: latestSnapshot.endingBalance < 250 ? "danger" : "warning",
    },
    {
      id: "60d",
      title: "If repayment overlap continues",
      days: 60,
      endingBalance: Math.max(0, latestSnapshot.endingBalance - 180),
      bnplRatio: Math.min(100, metrics.bnplDebtToIncomeRatio + 4),
      summary:
        "Repeated overlap between installment due dates and salary-cycle gaps will keep compressing available cash.",
      tone: "danger",
    },
    {
      id: "90d",
      title: "If discretionary spending is reduced",
      days: 90,
      endingBalance: latestSnapshot.endingBalance + discretionaryBuffer + 120,
      bnplRatio: Math.max(0, metrics.bnplDebtToIncomeRatio - 5),
      summary:
        "Reducing non-essential spending and avoiding new installment plans can rebuild a safer month-end buffer.",
      tone: "warning",
    },
  ];
};

const buildScoreTrendData = (metrics) => {
  const values = metrics.snapshots.map((snapshot, index) => ({
    week: `Week ${index + 1}`,
    score: Math.max(
      0,
      Math.min(
        100,
        96 -
          snapshot.bnplDebtToIncomeRatio -
          Math.max(0, snapshot.spendingToIncomeRatio - 55) -
          (index + 1) * 2,
      ),
    ),
  }));

  if (values.length) {
    values[values.length - 1].score = calculateFinancialStressScore(metrics).score;
  }

  return values;
};

export function getUserFinancialContext() {
  const data = mockUserData;
  const metrics = deriveFinancialMetrics(data);
  const scoreResult = calculateFinancialStressScore(metrics);
  const checkoutImpact = evaluateCheckoutImpact(data, metrics);

  return {
    data,
    metrics,
    scoreResult,
    checkoutImpact,
    dashboardSignals: buildDashboardSignals(metrics),
    forecastData: buildForecastData(metrics),
    forecastProjections: buildForecastProjections(metrics),
    scoreTrendData: buildScoreTrendData(metrics),
    peerComparison: {
      userRatio: metrics.bnplDebtToIncomeRatioPercent,
      peerRatio: Number(data.userProfile.peerAverageBnplRatio ?? 14),
    },
    transactions: sortByDateDesc(data.transactions),
    bnplPlans: sortByDateDesc(data.bnplPlans, "nextDueDate"),
    repaymentEvents: sortByDateDesc(data.repaymentEvents, "dueDate"),
    recurringCommitments: sortByDateDesc(
      data.transactions.filter((transaction) => transaction.isRecurring && transaction.type === "outflow"),
    ),
    formatCurrency,
  };
}

export default getUserFinancialContext;
