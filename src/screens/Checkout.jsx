import NextStepBar from "../components/NextStepBar";

function Checkout({ setScreen }) {
  const interventionReasons = [
    {
      label: "Critical Risk State",
      value: "Intervention Threshold Reached",
      detail: "Your current signals already place you in a state where the next Buy Now Pay Later attempt needs extra friction",
    },
    {
      label: "Cash Buffer Is Thin",
      value: "Only RM24 Left This Month",
      detail: "Your remaining balance is already tight, so another installment could quickly remove the little flexibility you still have",
    },
    {
      label: "Buy Now Pay Later Overload",
      value: "4 Active Plans",
      detail: "You already have 4 active Buy Now Pay Later plans totalling RM1,858 outstanding",
    },
  ];

  const interventionActions = [
    "MyDuitAI will step in on the next Buy Now Pay Later attempt because your account is already in an intervention state",
    "The extension does not know the exact next product yet, so it cannot show a precise post-purchase score until that checkout event actually happens",
    "When the next Buy Now Pay Later attempt is detected on Shopee, the extension will pause the flow, explain the risk, and encourage a safer decision",
  ];

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#FCFCFD] px-8 py-7 pb-24">
      <div className="mx-auto max-w-[1180px] space-y-6 p-8">
        <section className="rounded-[20px] border border-[#F7C7C7] bg-[#FFF8F8] p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C53030]">
            Intervention Active
          </p>
          <h2 className="mt-3 text-[24px] font-semibold text-[#111827]">
            Why MyDuitAI will interfere with the next Buy Now Pay Later attempt
          </h2>
          <p className="mt-3 max-w-[880px] text-[14px] leading-relaxed text-[#6B7280]">
            Your current financial signals already indicate elevated repayment pressure. Because
            of that, MyDuitAI is prepared to interfere the next time you try to use Buy Now Pay
            Later on Shopee. This page explains why that intervention state is active before the
            next checkout event happens.
          </p>
        </section>

        <section className="rounded-[20px] border border-[#E6E8EC] bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
            What this page is for
          </p>
          <p className="mt-3 max-w-[900px] text-[14px] leading-relaxed text-[#111827]">
            MyDuitAI is not evaluating a specific item on this screen. The real purchase-risk
            assessment happens inside Shopee when a Buy Now Pay Later checkout attempt is
            detected. This dashboard page only explains why your account is now being treated as
            intervention-ready.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-6">
          {interventionReasons.map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-[#E6E8EC] bg-white p-5"
            >
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#6B7280]">
                {item.label}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[#111827]">{item.value}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="flex items-center justify-center gap-6">
          <div className="flex min-h-[236px] w-full max-w-[340px] flex-col items-center justify-center rounded-[20px] border border-[#E6E8EC] bg-white p-6 text-center">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6B7280]">
              Current Score
            </p>
            <p className="mt-4 text-[48px] font-semibold leading-none text-[#B7791F]">51</p>
            <p className="mt-3 text-[14px] font-semibold text-[#B7791F]">Danger</p>
            <p className="mt-3 max-w-[250px] text-[13px] leading-relaxed text-[#6B7280]">
              Your account is still active, but risk is already elevated before the next Buy
              Now Pay Later attempt.
            </p>
          </div>

          <div className="text-[32px] font-semibold text-[#6B7280]">→</div>

          <div className="flex min-h-[236px] w-full max-w-[340px] flex-col items-center justify-center rounded-[20px] border border-[#E6E8EC] bg-white p-6 text-center">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6B7280]">
              Intervention State
            </p>
            <p className="mt-4 text-[48px] font-semibold leading-none text-[#C53030]">Active</p>
            <p className="mt-3 text-[14px] font-semibold text-[#C53030]">
              Protective friction active
            </p>
            <p className="mt-3 max-w-[250px] text-[13px] leading-relaxed text-[#6B7280]">
              The next Buy Now Pay Later attempt will be interrupted on Shopee.
            </p>
          </div>
        </section>

        <section className="rounded-[20px] border border-[#DCE7FF] bg-[#EEF3FD] p-6">
          <h3 className="text-[16px] font-semibold text-[#1652F0]">
            What this intervention is doing right now
          </h3>
          <div className="mt-4 space-y-3">
            {interventionActions.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-[#1652F0]" />
                <p className="text-[14px] leading-relaxed text-[#111827]">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <NextStepBar
        show
        label="The AI has prepared a personalised recovery plan for you."
        buttonText="View Recovery Plan →"
        question="Why is MyDuitAI intervening right now?"
        fallback="Aisha, your BNPL is already at 28 percent of your income, double what your peers carry. Adding another purchase pushes your projected May balance to negative RM142. Your stress score can fall from 49 to 31. MyDuitAI intervenes here because this purchase moment is where the risk becomes real."
      />
    </div>
  );
}

export default Checkout;
