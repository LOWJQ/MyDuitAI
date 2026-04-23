const ESSENTIAL_CATEGORIES = new Set([
  "Housing",
  "Groceries",
  "Utilities",
  "Transport",
  "Family Support",
]);

const DISCRETIONARY_CATEGORIES = new Set([
  "Dining",
  "Food Delivery",
  "Shopping",
  "Entertainment",
  "Subscriptions",
]);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const safeNumber = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeDivide = (numerator, denominator, fallback = 0) => {
  const safeDenominator = safeNumber(denominator, 0);

  if (safeDenominator <= 0) {
    return fallback;
  }

  return safeNumber(numerator, 0) / safeDenominator;
};
const toPercent = (ratio) => Math.round(clamp(safeNumber(ratio, 0), 0, 1.5) * 100);
const sumAmounts = (items) => items.reduce((total, item) => total + safeNumber(item.amount), 0);

const average = (values) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const percentChange = (current, previous) => {
  const safePrevious = safeNumber(previous, 0);

  if (safePrevious <= 0) {
    return 0;
  }

  return Math.round(((safeNumber(current, 0) - safePrevious) / safePrevious) * 100);
};

const getTrendDirection = (values) => {
  if (values.length < 2) {
    return "flat";
  }

  let rising = 0;
  let falling = 0;

  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[index - 1]) rising += 1;
    if (values[index] < values[index - 1]) falling += 1;
  }

  if (falling === values.length - 1) return "falling";
  if (rising === values.length - 1) return "rising";
  return "mixed";
};

const getConsecutiveDeclines = (values) => {
  let streak = 0;

  for (let index = values.length - 1; index > 0; index -= 1) {
    if (values[index] < values[index - 1]) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const getLatestDate = (transactions) =>
  transactions.reduce((latest, transaction) => {
    const currentDate = new Date(transaction.date);
    return currentDate > latest ? currentDate : latest;
  }, new Date(transactions[0]?.date ?? Date.now()));

const inRecentWindow = (dateString, latestDate, days) => {
  const date = new Date(dateString);
  const diffInMs = latestDate.getTime() - date.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays >= 0 && diffInDays <= days;
};

const buildTopSpendingCategories = (transactions) => {
  const totals = new Map();

  transactions
    .filter((transaction) => transaction.type === "outflow")
    .forEach((transaction) => {
      totals.set(
        transaction.category,
        (totals.get(transaction.category) ?? 0) + safeNumber(transaction.amount),
      );
    });

  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
};

const buildRecentRiskSignals = ({
  latestSnapshot,
  previousSnapshot,
  recentBnplTransactions,
  recentBnplPlanOpenings,
  lateRepaymentCount,
  missedRepaymentCount,
  endingBalanceDeclineMonths,
}) => {
  const signals = [];

  if (recentBnplPlanOpenings.length > 0) {
    signals.push({
      type: "bnpl_growth",
      severity: recentBnplPlanOpenings.length >= 2 ? "medium" : "low",
      title: "New Buy Now Pay Later commitments detected",
      detail: `${recentBnplPlanOpenings.length} new Buy Now Pay Later commitments were added in the last 60 days.`,
    });
  }

  if (lateRepaymentCount > 0 || missedRepaymentCount > 0) {
    signals.push({
      type: "late_repayment",
      severity: missedRepaymentCount > 0 ? "high" : "medium",
      title: "Repayment punctuality is slipping",
      detail: `${lateRepaymentCount} late repayments and ${missedRepaymentCount} missed repayments were detected in recent repayment history.`,
    });
  }

  if (endingBalanceDeclineMonths >= 2) {
    signals.push({
      type: "balance_decline",
      severity: "high",
      title: "Ending balance has been falling consistently",
      detail: `Ending balance fell from RM${safeNumber(previousSnapshot.endingBalance)} to RM${safeNumber(latestSnapshot.endingBalance)} and has declined for ${endingBalanceDeclineMonths + 1} consecutive tracked months.`,
    });
  }

  if (safeNumber(latestSnapshot.bnplRepayments) > safeNumber(previousSnapshot.bnplRepayments)) {
    signals.push({
      type: "bnpl_overlap",
      severity: "medium",
      title: "Buy Now Pay Later repayments are overlapping with salary-cycle cash needs",
      detail: `Monthly Buy Now Pay Later repayments increased from RM${safeNumber(previousSnapshot.bnplRepayments)} to RM${safeNumber(latestSnapshot.bnplRepayments)}.`,
    });
  }

  if (recentBnplTransactions.length >= 4) {
    signals.push({
      type: "bnpl_frequency",
      severity: "medium",
      title: "Buy Now Pay Later activity is frequent",
      detail: `${recentBnplTransactions.length} Buy Now Pay Later-related transactions were detected in the last 60 days.`,
    });
  }

  return signals;
};

export function deriveFinancialMetrics(data) {
  const {
    userProfile = {},
    transactions = [],
    bnplPlans = [],
    repaymentEvents = [],
    monthlySnapshots = [],
    checkoutScenario = null,
  } = data ?? {};

  const inflows = transactions.filter((transaction) => transaction.type === "inflow");
  const outflows = transactions.filter((transaction) => transaction.type === "outflow");
  const essentialTransactions = outflows.filter((transaction) =>
    ESSENTIAL_CATEGORIES.has(transaction.category),
  );
  const discretionaryTransactions = outflows.filter((transaction) =>
    DISCRETIONARY_CATEGORIES.has(transaction.category),
  );
  const bnplTransactions = transactions.filter((transaction) => transaction.isBnplRelated);
  const recurringCommitments = outflows.filter((transaction) => transaction.isRecurring);
  const lateRepayments = repaymentEvents.filter((event) => event.status === "late");
  const missedRepayments = repaymentEvents.filter((event) => event.status === "missed");

  const latestDate = getLatestDate(transactions);
  const recent60DayTransactions = transactions.filter((transaction) =>
    inRecentWindow(transaction.date, latestDate, 60),
  );
  const recent90DayTransactions = transactions.filter((transaction) =>
    inRecentWindow(transaction.date, latestDate, 90),
  );
  const recentBnplTransactions = recent60DayTransactions.filter(
    (transaction) => transaction.isBnplRelated,
  );
  const recentBnplPlanOpenings = recent60DayTransactions.filter((transaction) =>
    transaction.tags?.includes("bnpl-plan-opened"),
  );

  const latestSnapshot = monthlySnapshots[monthlySnapshots.length - 1] ?? {
    income: safeNumber(userProfile.monthlyIncome, 1),
    essentialSpending: safeNumber(userProfile.baselineMonthlyEssentials),
    discretionarySpending: safeNumber(userProfile.baselineMonthlyDiscretionary),
    bnplRepayments: 0,
    endingBalance: 0,
    totalBnplOutstanding: 0,
    spendingToIncomeRatio: 0,
    bnplDebtToIncomeRatio: 0,
  };
  const previousSnapshot = monthlySnapshots[monthlySnapshots.length - 2] ?? latestSnapshot;

  const endingBalances = monthlySnapshots.map((snapshot) => safeNumber(snapshot.endingBalance));
  const endingBalanceDirection = getTrendDirection(endingBalances);
  const endingBalanceDeclineMonths = getConsecutiveDeclines(endingBalances);
  const monthlyIncome = safeNumber(userProfile.monthlyIncome, latestSnapshot.income || 1);
  const latestIncome = safeNumber(latestSnapshot.income, monthlyIncome);
  const latestEssentialSpending = safeNumber(latestSnapshot.essentialSpending);
  const latestDiscretionarySpending = safeNumber(latestSnapshot.discretionarySpending);
  const monthlyBnplRepayments = safeNumber(
    latestSnapshot.bnplRepayments,
    bnplPlans.reduce((total, plan) => total + safeNumber(plan.installmentAmount), 0),
  );
  const monthlySpending =
    latestEssentialSpending + latestDiscretionarySpending + monthlyBnplRepayments;
  const spendingToIncomeRatio = clamp(
    safeNumber(
      latestSnapshot.spendingToIncomeRatio,
      safeDivide(monthlySpending, latestIncome),
    ),
    0,
    1.5,
  );
  const bnplDebtToIncomeRatio = clamp(
    safeNumber(
      latestSnapshot.bnplDebtToIncomeRatio,
      safeDivide(monthlyBnplRepayments, monthlyIncome),
    ),
    0,
    1.5,
  );

  return {
    monthlyIncome,
    monthlySpending,
    totalIncome: sumAmounts(inflows),
    totalOutflow: sumAmounts(outflows),
    totalEssentialSpending: sumAmounts(essentialTransactions),
    totalDiscretionarySpending: sumAmounts(discretionaryTransactions),
    spendingToIncomeRatio,
    spendingToIncomeRatioPercent: toPercent(spendingToIncomeRatio),
    spendingRatio: spendingToIncomeRatio,
    spendingRatioPercent: toPercent(spendingToIncomeRatio),
    totalBnplOutstanding: bnplPlans.reduce(
      (total, plan) =>
        total + safeNumber(plan.installmentAmount) * safeNumber(plan.installmentsRemaining),
      0,
    ),
    totalBnplCommitments: bnplPlans.reduce(
      (total, plan) => total + safeNumber(plan.installmentAmount),
      0,
    ),
    monthlyBnplRepayments,
    bnplDebtToIncomeRatio,
    bnplDebtToIncomeRatioPercent: toPercent(bnplDebtToIncomeRatio),
    bnplRatio: bnplDebtToIncomeRatio,
    bnplRatioPercent: toPercent(bnplDebtToIncomeRatio),
    bnplUsageFrequency: {
      relatedTransactionCount60d: recentBnplTransactions.length,
      newPlanCount60d: recentBnplPlanOpenings.length,
      activePlanCount: bnplPlans.filter((plan) => plan.status === "active").length,
    },
    bnplFrequency: recentBnplTransactions.length,
    lateRepaymentCount: lateRepayments.length,
    missedRepaymentCount: missedRepayments.length,
    averageEndingBalance: Math.round(average(endingBalances)),
    averageEndMonthBalance: Math.round(average(endingBalances)),
    latestEndingBalance: safeNumber(latestSnapshot.endingBalance),
    endingBalanceTrend: {
      direction: endingBalanceDirection,
      values: endingBalances,
      latestChange:
        safeNumber(latestSnapshot.endingBalance) - safeNumber(previousSnapshot.endingBalance),
      consecutiveDeclines: endingBalanceDeclineMonths,
    },
    endMonthBalanceTrend: {
      direction: endingBalanceDirection,
      consecutiveDeclines: endingBalanceDeclineMonths,
      latestChange:
        safeNumber(latestSnapshot.endingBalance) - safeNumber(previousSnapshot.endingBalance),
    },
    recurringCommitmentsTotal: sumAmounts(recurringCommitments),
    topSpendingCategories: buildTopSpendingCategories(recent90DayTransactions),
    recentRiskSignals: buildRecentRiskSignals({
      latestSnapshot,
      previousSnapshot,
      recentBnplTransactions,
      recentBnplPlanOpenings,
      lateRepaymentCount: lateRepayments.length,
      missedRepaymentCount: missedRepayments.length,
      endingBalanceDeclineMonths,
    }),
    recentTrendChanges: {
      discretionarySpendingChange: percentChange(
        latestSnapshot.discretionarySpending,
        previousSnapshot.discretionarySpending,
      ),
      bnplRepaymentChange: percentChange(
        latestSnapshot.bnplRepayments,
        previousSnapshot.bnplRepayments,
      ),
      endingBalanceChange:
        safeNumber(latestSnapshot.endingBalance) - safeNumber(previousSnapshot.endingBalance),
    },
    nonEssentialSpendingChange: percentChange(
      latestSnapshot.discretionarySpending,
      previousSnapshot.discretionarySpending,
    ),
    nextRepaymentDue:
      bnplPlans
        .map((plan) => plan.nextDueDate)
        .sort((left, right) => new Date(left) - new Date(right))[0] ?? null,
    latestSnapshot,
    previousSnapshot,
    snapshots: monthlySnapshots,
    checkoutScenario,
  };
}

export default deriveFinancialMetrics;
