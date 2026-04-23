function NextStepBar({ label, buttonText, onClick, show }) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-[260px] right-0 z-40 border-t border-[#E6E8EC] bg-white px-8 py-4">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6">
        <p className="text-[14px] text-[#6B7280]">{label}</p>
        <button
          type="button"
          onClick={onClick}
          className="rounded-full bg-[#1652F0] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#1240C0]"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default NextStepBar;
