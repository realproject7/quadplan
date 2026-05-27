const PLANNING_PULSE_MESSAGE = `@head Queue check. Continue the next QuadPlan planning item from OVERNIGHT-QUEUE.md.`;

// QuadWork /api/chat parity decision (#104):
//   Aligned: mention normalization — callers in routes.js apply normalizeMentions()
//     before passing the message here, matching /api/chat's preprocessing.
//   Intentional divergence: loop guard — pulses pass _skipLoopGuard=true so they
//     never increment the agent-to-agent hop counter (they are infrastructure, not
//     agent chat). Manual pulses always append to file-chat; dispatchToAgentPTY's
//     own isLoopGuardPaused check suppresses PTY injection when the guard is paused.
//     The timer path additionally checks isLoopGuardPaused before calling this
//     function, skipping the append entirely.
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
