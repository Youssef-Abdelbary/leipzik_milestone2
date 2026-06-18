export function feedbackOverallScore(feedback) {
  const scores = [
    feedback.experience,
    feedback.food,
    feedback.venue,
    feedback.organisation,
  ].filter((value) => value != null && !Number.isNaN(Number(value)));

  if (scores.length === 0) {
    return null;
  }

  const total = scores.reduce((sum, value) => sum + Number(value), 0);
  return total / scores.length;
}

export function computeEventFeedbackStats(feedbacks) {
  const submitted = feedbacks.filter((feedback) => feedback.submittedAt != null);

  if (submitted.length === 0) {
    return {
      count: 0,
      averagePositiveFeedback: 0,
      averageNegativeFeedback: 0,
    };
  }

  let positiveCount = 0;
  let negativeCount = 0;

  submitted.forEach((feedback) => {
    const overall = feedbackOverallScore(feedback);
    if (overall == null) {
      return;
    }
    if (overall >= 4) {
      positiveCount += 1;
    }
    if (overall <= 2) {
      negativeCount += 1;
    }
  });

  const count = submitted.length;

  return {
    count,
    averagePositiveFeedback: count > 0 ? positiveCount / count : 0,
    averageNegativeFeedback: count > 0 ? negativeCount / count : 0,
  };
}
