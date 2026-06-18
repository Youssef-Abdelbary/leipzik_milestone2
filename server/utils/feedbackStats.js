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

function roundScore(value) {
  return Math.round(value * 10) / 10;
}

function averageScores(scores) {
  if (!scores.length) {
    return 0;
  }

  return roundScore(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

export function computeEventFeedbackStats(feedbacks) {
  const submitted = feedbacks.filter((feedback) => feedback.submittedAt != null);

  if (submitted.length === 0) {
    return {
      count: 0,
      positiveReviewCount: 0,
      negativeReviewCount: 0,
      averagePositiveFeedback: 0,
      averageNegativeFeedback: 0,
    };
  }

  const positiveScores = [];
  const negativeScores = [];

  submitted.forEach((feedback) => {
    const overall = feedbackOverallScore(feedback);
    if (overall == null) {
      return;
    }
    if (overall >= 4) {
      positiveScores.push(overall);
    }
    if (overall <= 2) {
      negativeScores.push(overall);
    }
  });

  return {
    count: submitted.length,
    positiveReviewCount: positiveScores.length,
    negativeReviewCount: negativeScores.length,
    averagePositiveFeedback: averageScores(positiveScores),
    averageNegativeFeedback: averageScores(negativeScores),
  };
}
