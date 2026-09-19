function scoreProspect(data) {
  let score = 0;

  const lookingMap = {
    business_opportunity: 25,
    extra_income: 20,
    personal_development: 10,
    networking: 10,
    exploring: 5
  };
  score += lookingMap[data.lookingFor] || 5;

  score += data.previousExperience ? 15 : 5;

  const t = (data.weeklyTime || '').toLowerCase();
  if (t.includes('10+') || t.includes('more than 10')) score += 20;
  else if (t.includes('5-10') || t.includes('5 to 10')) score += 15;
  else if (t.includes('2-5') || t.includes('2 to 5')) score += 10;
  else if (t.trim()) score += 5;

  const wantsMap = { yes: 30, maybe: 15, not_now: 0 };
  score += wantsMap[data.wantsExplanation] || 0;

  if (data.preferredContact) score += 5;

  let category = 'NOT_READY';
  if (score >= 70) category = 'HIGH_INTEREST';
  else if (score >= 45) category = 'EXPLORING';
  else if (score >= 25) category = 'FOLLOW_UP';

  return { score, category };
}

module.exports = { scoreProspect };
