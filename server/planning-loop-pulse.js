const PLANNING_PULSE_MESSAGE = `@head Queue check. Continue the next QuadPlan planning item from OVERNIGHT-QUEUE.md.`;

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
