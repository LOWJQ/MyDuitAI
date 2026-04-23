function TransactionTable({ transactions = [], activeFilter = "All", formatCurrency }) {
  const visibleTransactions = transactions.filter((transaction) => {
    if (activeFilter === "All") {
      return true;
    }

    return transaction.category === activeFilter;
  });

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E6E8EC]">
      <div className="grid grid-cols-[110px_minmax(0,1.35fr)_130px_90px_120px_110px_120px] gap-4 border-b border-[#EEF1F4] bg-[#FBFCFE] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
        <span>Date</span>
        <span>Description</span>
        <span>Category</span>
        <span>Type</span>
        <span>Channel</span>
        <span>Amount</span>
        <span>Flags</span>
      </div>

      <div className="divide-y divide-[#EEF1F4]">
        {visibleTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="grid grid-cols-[110px_minmax(0,1.35fr)_130px_90px_120px_110px_120px] gap-4 px-5 py-4 transition hover:bg-[#FBFCFE]"
          >
            <span className="text-[13px] text-[#6B7280]">{transaction.date}</span>

            <div>
              <p className="text-[14px] font-semibold text-[#111827]">{transaction.description}</p>
              <p className="mt-1 text-[12px] text-[#9CA3AF]">
                {transaction.merchant || transaction.source}
              </p>
            </div>

            <span className="text-[13px] font-medium text-[#111827]">{transaction.category}</span>

            <span
              className={`text-[13px] font-medium capitalize ${
                transaction.type === "inflow" ? "text-[#0F9D73]" : "text-[#6B7280]"
              }`}
            >
              {transaction.type}
            </span>

            <span className="text-[13px] capitalize text-[#6B7280]">{transaction.channel}</span>

            <span
              className={`text-[14px] font-semibold ${
                transaction.type === "inflow" ? "text-[#0F9D73]" : "text-[#111827]"
              }`}
            >
              {transaction.type === "inflow" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </span>

            <div className="flex flex-wrap gap-2">
              {transaction.isBnplRelated ? (
                <span className="rounded-full border border-[#F7C7C7] px-2.5 py-1 text-[11px] font-semibold text-[#C53030]">
                  Buy Now Pay Later
                </span>
              ) : null}
              {transaction.isRecurring ? (
                <span className="rounded-full border border-[#DCE7FF] px-2.5 py-1 text-[11px] font-semibold text-[#1652F0]">
                  Recurring
                </span>
              ) : null}
              {transaction.tags?.includes("late-repayment") ? (
                <span className="rounded-full border border-[#F7D7A7] px-2.5 py-1 text-[11px] font-semibold text-[#B7791F]">
                  Late
                </span>
              ) : null}
              {transaction.tags?.includes("risky-pattern") ? (
                <span className="rounded-full border border-[#F7D7A7] px-2.5 py-1 text-[11px] font-semibold text-[#B7791F]">
                  Risky pattern
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionTable;
