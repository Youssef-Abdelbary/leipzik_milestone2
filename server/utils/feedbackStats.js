const FEEDBACK_CATEGORIES = ["experience", "food", "venue", "organisation"];

export function feedbackOverallScore(feedback) {
  const values = FEEDBACK_CATEGORIES.map((category) => feedback[category]).filter(
    (value) => value != null && !Number.isNaN(Number(value))
  );

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + Number(value), 0) / values.length;
}

export function computeEventFeedbackStats(feedbacks) {
  const positiveScores = [];
  const negativeScores = [];

  for (const feedback of feedbacks) {
    if (!feedback?.submittedAt) {
      continue;
    }

    const overall = feedbackOverallScore(feedback);
    if (overall == null) {
      continue;
    }

    if (overall >= 4) {
      positiveScores.push(overall);
    } else if (overall <= 2) {
      negativeScores.push(overall);
    }
  }

  return {
    averagePositiveFeedback: positiveScores.length
      ? positiveScores.reduce((sum, value) => sum + value, 0) / positiveScores.length
      : 0,
    averageNegativeFeedback: negativeScores.length
      ? negativeScores.reduce((sum, value) => sum + value, 0) / negativeScores.length
      : 0,
    positiveCount: positiveScores.length,
    negativeCount: negativeScores.length,
    totalCount: positiveScores.length + negativeScores.length,
  };
}

export function computeOrganizerFeedbackSummary(feedbacks) {
  return computeEventFeedbackStats(feedbacks);
}
