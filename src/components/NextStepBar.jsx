import AiVoiceButton from "./AiVoiceButton";

function NextStepBar({ show, label, buttonText, question, fallback }) {
  const resolvedButtonText = (() => {
    if (typeof buttonText === "string" && buttonText.trim().toLowerCase().startsWith("hear")) {
      return `🔊 ${buttonText.trim().replace(/^hear[:\s-]*/i, "")}`;
    }

    if (question) {
      return `🔊 ${question}`;
    }

    return "🔊 Voice message";
  })();

  return (
    <AiVoiceButton
      show={show}
      variant="bar"
      description={label}
      idleLabel={resolvedButtonText}
      replayLabel={resolvedButtonText}
      loadingLabel="Generating voice message..."
      stopLabel="Stop voice message"
      question={question}
      fallback={fallback}
    />
  );
}

export default NextStepBar;
