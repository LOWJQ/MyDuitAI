import { calculateFinancialStressScore } from "./calculateFinancialStressScore";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeRatio = (value) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue > 1.5 ? numericValue / 100 : numericValue;
};

export function evaluateCheckoutImpact(data, metrics, selectedOptionLabel = null) {
  const selectedPaymentOption =
    data.checkoutScenario.paymentOptions.find(
      (option) => option.label === (selectedOptionLabel ?? data.checkoutScenario.selectedOption),
    ) ?? data.checkoutScenario.paymentOptions[0];

  const bnplIncrease =
    selectedPaymentOption.type === "bnpl" ? Number(selectedPaymentOption.amount || 0) : 0;
  const upfrontCashImpact =
    selectedPaymentOption.type === "full_payment"
      ? Number(selectedPaymentOption.amount || 0)
      : bnplIncrease;

  const currentBnplRatio = normalizeRatio(metrics.bnplDebtToIncomeRatio);
  const projectedBnplDebtToIncomeRatio = clamp(
    (metrics.monthlyBnplRepayments + bnplIncrease) / Math.max(metrics.monthlyIncome || 1, 1),
    0,
    1.5,
  );
  const projectedEndingBalance = Math.round(metrics.latestEndingBalance - upfrontCashImpact);

  const projectedMetrics = {
    ...metrics,
    monthlyBnplRepayments: metrics.monthlyBnplRepayments + bnplIncrease,
    bnplDebtToIncomeRatio: projectedBnplDebtToIncomeRatio,
    bnplDebtToIncomeRatioPercent: Math.round(projectedBnplDebtToIncomeRatio * 100),
    bnplRatio: projectedBnplDebtToIncomeRatio,
    bnplRatioPercent: Math.round(projectedBnplDebtToIncomeRatio * 100),
    latestEndingBalance: projectedEndingBalance,
    endingBalanceTrend: {
      ...metrics.endingBalanceTrend,
      latestChange:
        projectedEndingBalance -
        (metrics.snapshots[metrics.snapshots.length - 2]?.endingBalance ?? metrics.latestEndingBalance),
    },
    bnplUsageFrequency: {
      ...metrics.bnplUsageFrequency,
      activePlanCount:
        metrics.bnplUsageFrequency.activePlanCount +
        (selectedPaymentOption.type === "bnpl" ? 1 : 0),
    },
  };

  const projectedResult = calculateFinancialStressScore(projectedMetrics);
  const currentResult = calculateFinancialStressScore(metrics);
  const worseRiskZone = projectedResult.zone !== currentResult.zone;
  const addedBnplBurden = Math.round((projectedBnplDebtToIncomeRatio - currentBnplRatio) * 100);
  const criticalIntervention =
    projectedResult.zone === "Critical" ||
    (selectedPaymentOption.type === "bnpl" && projectedBnplDebtToIncomeRatio >= 0.3);

  return {
    purchaseAmount: data.checkoutScenario.amount,
    selectedPaymentOption,
    paymentType: selectedPaymentOption.type,
    currentScore: currentResult.score,
    currentZone: currentResult.zone,
    projectedBnplDebtToIncomeRatio: Math.round(projectedBnplDebtToIncomeRatio * 100),
    projectedEndingBalance,
    projectedScore: projectedResult.score,
    scoreDelta: projectedResult.score - currentResult.score,
    projectedZone: projectedResult.zone,
    addedBnplBurden,
    worseRiskZone,
    criticalIntervention,
    riskMessage:
      selectedPaymentOption.type === "bnpl"
        ? `Selecting ${selectedPaymentOption.label} would push Buy Now Pay Later commitments to ${Math.round(
            projectedBnplDebtToIncomeRatio * 100,
          )}% of income and reduce projected end-of-month balance to RM${projectedEndingBalance}.`
        : `Paying in full would reduce projected end-of-month balance to RM${projectedEndingBalance} without creating a new Buy Now Pay Later obligation.`,
  };
}

export default evaluateCheckoutImpact;
