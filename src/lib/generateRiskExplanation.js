const getConsecutiveDeclines = (trend) => {
  if (typeof trend?.consecutiveDeclines === "number") {
    return trend.consecutiveDeclines;
  }

  return 0;
};

const normalizeRatio = (value) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue > 1.5 ? numericValue / 100 : numericValue;
};

const getRatioPercent = (metrics, primaryKey, fallbackKey) =>
  Math.round(normalizeRatio(metrics[primaryKey] ?? metrics[fallbackKey] ?? 0) * 100);

const pluralize = (count, singular, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

export function generateRiskExplanation(metrics = {}) {
  const explanations = [];

  const bnplRatio = getRatioPercent(metrics, "bnplRatio", "bnplDebtToIncomeRatio");
  const spendingRatio = getRatioPercent(metrics, "spendingRatio", "spendingToIncomeRatio");
  const lateRepaymentCount = Number(metrics.lateRepaymentCount ?? 0);
  const missedRepaymentCount = Number(metrics.missedRepaymentCount ?? 0);
  const totalRepaymentIssues = lateRepaymentCount + missedRepaymentCount;
  const balanceDeclines = getConsecutiveDeclines(
    metrics.endMonthBalanceTrend ?? metrics.endingBalanceTrend,
  );
  const nonEssentialSpendingChange = Number(metrics.nonEssentialSpendingChange ?? 0);
  const monthlyBnplRepayments = Math.round(metrics.monthlyBnplRepayments ?? 0);
  const nextRepaymentDue = metrics.nextRepaymentDue;
  const latestEndingBalance = Math.round(metrics.latestEndingBalance ?? 0);

  if (spendingRatio >= 80) {
    explanations.push(`Your spending is using ${spendingRatio}% of your monthly income.`);
  }

  if (bnplRatio >= 14) {
    explanations.push(
      `Your Buy Now Pay Later commitments now take up ${bnplRatio}% of your income.`,
    );
  }

  if (balanceDeclines >= 2) {
    explanations.push(
      `Your end-of-month cash buffer has declined for ${balanceDeclines + 1} straight months.`,
    );
  }

  if (totalRepaymentIssues > 0) {
    explanations.push(
      `You had ${totalRepaymentIssues} ${pluralize(
        totalRepaymentIssues,
        "late repayment event",
      )} in recent repayment history.`,
    );
  }

  if (nonEssentialSpendingChange >= 8) {
    explanations.push(
      `Non-essential spending increased ${nonEssentialSpendingChange}% compared to last month.`,
    );
  }

  if (latestEndingBalance > 0 && latestEndingBalance <= 500) {
    explanations.push(`Your remaining month-end cash buffer is down to RM${latestEndingBalance}.`);
  }

  if (monthlyBnplRepayments >= 400 || (nextRepaymentDue && bnplRatio >= 14)) {
    explanations.push("Repayment pressure is staying elevated over the next 30 days.");
  }

  return explanations.slice(0, 6);
}

export default generateRiskExplanation;
