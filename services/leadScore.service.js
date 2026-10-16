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

function scoreStudent(data) {
  let score = 0;

  // Days available: more days = higher intent (max 40)
  const days = Array.isArray(data.daysAvailable) ? data.daysAvailable.length : 0;
  if (days >= 5) score += 40;
  else if (days >= 3) score += 30;
  else if (days >= 2) score += 20;
  else if (days >= 1) score += 10;

  // Year of study: final year students often want opportunity
  const yr = (data.yearOfStudy || '').toLowerCase();
  if (yr.includes('4') || yr.includes('final') || yr.includes('graduate')) score += 20;
  else if (yr.includes('3')) score += 15;
  else if (yr.includes('2')) score += 10;
  else if (yr.trim()) score += 5;

  // Optional extras
  if (data.course && data.course.trim()) score += 5;

  let category = 'NOT_READY';
  if (score >= 50) category = 'HIGH_INTEREST';
  else if (score >= 30) category = 'EXPLORING';
  else if (score >= 15) category = 'FOLLOW_UP';

  return { score, category };
}

module.exports = { scoreProspect, scoreStudent };
