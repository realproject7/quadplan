const PLANNING_PULSE_MESSAGE = `@head Queue check. Continue the next QuadPlan planning item from OVERNIGHT-QUEUE.md.`;

// QuadWork /api/chat parity decision (#104):
//   Aligned: mention normalization — callers in routes.js apply normalizeMentions()
//     before passing the message here, matching /api/chat's preprocessing.
//   Intentional divergence: loop guard skip — pulses pass _skipLoopGuard=true because
//     they are system infrastructure (sender:"system", type:"message") and must not
//     increment the agent-to-agent hop counter. The timer path separately checks
//     isLoopGuardPaused() before calling this function.
//   Intentional divergence: sender is always "system" — pulses are not agent or user
//     messages, so no sender negotiation (shimToken/bridgeSender) applies.
function sendPlanningPulse(projectId, customMessage, fileChat) {
  const message = customMessage || PLANNING_PULSE_MESSAGE;
  try {
    const record = fileChat.appendMessage(projectId, {
      sender: "system",
      channel: "general",
      type: "message",
      text: message,
    }, true);
    return { ok: true, message, record };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to send pulse" };
  }
}

module.exports = {
  PLANNING_PULSE_MESSAGE,
  sendPlanningPulse,
};
