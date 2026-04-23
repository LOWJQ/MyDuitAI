const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeRatio = (value) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue > 1.5 ? numericValue / 100 : numericValue;
};

const getZone = (score) => {
  if (score >= 80) return "Stable";
  if (score >= 60) return "Warning";
  if (score >= 40) return "Danger";
  return "Critical";
};

const formatRatio = (value) => `${Math.round(normalizeRatio(value) * 100)}%`;

export function calculateFinancialStressScore(metrics = {}) {
  let score = 100;
  const contributors = [];

  const bnplUsageFrequency = metrics.bnplUsageFrequency ?? {
    relatedTransactionCount60d: 0,
    newPlanCount60d: 0,
    activePlanCount: 0,
  };
  const endingBalanceTrend = metrics.endingBalanceTrend ?? { consecutiveDeclines: 0 };
  const lateRepaymentCount = Number(metrics.lateRepaymentCount ?? 0);
  const missedRepaymentCount = Number(metrics.missedRepaymentCount ?? 0);
  const latestEndingBalance = Number(metrics.latestEndingBalance ?? 0);
  const normalizedBnplRatio = normalizeRatio(metrics.bnplDebtToIncomeRatio);
  const normalizedSpendingRatio = normalizeRatio(metrics.spendingToIncomeRatio);

  const frequencyPenalty = clamp(
    bnplUsageFrequency.relatedTransactionCount60d * 0.8 +
      bnplUsageFrequency.newPlanCount60d * 1.5 +
      bnplUsageFrequency.activePlanCount * 0.6,
    0,
    12,
  );
  if (frequencyPenalty > 0) {
    score -= frequencyPenalty;
    contributors.push({
      signal: "bnpl_usage_frequency",
      impact: -Math.round(frequencyPenalty),
      message: `${bnplUsageFrequency.relatedTransactionCount60d} Buy Now Pay Later-related transactions and ${bnplUsageFrequency.newPlanCount60d} new commitments were detected in the last 60 days.`,
    });
  }

  let balancePenalty = 0;
  if (endingBalanceTrend.consecutiveDeclines >= 3) {
    balancePenalty += 8;
  } else if (endingBalanceTrend.consecutiveDeclines === 2) {
    balancePenalty += 5;
  } else if (endingBalanceTrend.consecutiveDeclines === 1) {
    balancePenalty += 2;
  }

  if (latestEndingBalance < 200) {
    balancePenalty += 10;
  } else if (latestEndingBalance < 500) {
    balancePenalty += 6;
  } else if (latestEndingBalance < 800) {
    balancePenalty += 3;
  }

  if (balancePenalty > 0) {
    score -= balancePenalty;
    contributors.push({
      signal: "ending_balance_trend",
      impact: -balancePenalty,
      message: `Ending balance has fallen for ${Math.max(
        1,
        endingBalanceTrend.consecutiveDeclines + 1,
      )} consecutive tracked months and now stands at RM${Math.round(latestEndingBalance)}.`,
    });
  }

  const repaymentPenalty = clamp(lateRepaymentCount * 4 + missedRepaymentCount * 8, 0, 12);
  if (repaymentPenalty > 0) {
    score -= repaymentPenalty;
    contributors.push({
      signal: "repayment_punctuality",
      impact: -repaymentPenalty,
      message: `${lateRepaymentCount} late repayments and ${missedRepaymentCount} missed repayments were detected in the recent repayment history.`,
    });
  }

  let bnplRatioPenalty = 0;
  if (normalizedBnplRatio >= 0.3) {
    bnplRatioPenalty = 14;
  } else if (normalizedBnplRatio >= 0.2) {
    bnplRatioPenalty = 10;
  } else if (normalizedBnplRatio >= 0.14) {
    bnplRatioPenalty = 5;
  } else if (normalizedBnplRatio >= 0.1) {
    bnplRatioPenalty = 3;
  }

  if (bnplRatioPenalty > 0) {
    score -= bnplRatioPenalty;
    contributors.push({
      signal: "bnpl_debt_to_income_ratio",
      impact: -bnplRatioPenalty,
      message: `Buy Now Pay Later commitments are consuming ${formatRatio(
        normalizedBnplRatio,
      )} of monthly income.`,
    });
  }

  let spendingPenalty = 0;
  if (normalizedSpendingRatio >= 1) {
    spendingPenalty = 12;
  } else if (normalizedSpendingRatio >= 0.92) {
    spendingPenalty = 9;
  } else if (normalizedSpendingRatio >= 0.85) {
    spendingPenalty = 6;
  } else if (normalizedSpendingRatio >= 0.78) {
    spendingPenalty = 3;
  }

  if (spendingPenalty > 0) {
    score -= spendingPenalty;
    contributors.push({
      signal: "spending_to_income_ratio",
      impact: -spendingPenalty,
      message: `Monthly spending and obligations are absorbing ${formatRatio(
        normalizedSpendingRatio,
      )} of income.`,
    });
  }

  const finalScore = clamp(Math.round(score), 0, 100);
  const zone = getZone(finalScore);

  return {
    score: finalScore,
    zone,
    contributors,
    summary:
      finalScore >= 80
        ? "Your finances look stable with enough room to absorb upcoming commitments."
        : finalScore >= 60
          ? "Some financial pressure is building, but there is still room to stabilise before it worsens."
          : finalScore >= 40
            ? "Your finances are under growing strain. Lower cash buffers and rising repayments are starting to overlap."
            : "Your finances are in a critical zone. Immediate action is needed to prevent missed obligations or cash shortfall.",
  };
}

export default calculateFinancialStressScore;
