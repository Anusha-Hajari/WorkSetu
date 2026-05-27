export function calculateScore(worker, job) {
  let score = 0;
  if (worker.skills?.includes(job.skill)) score += 40;
  if (worker.rating >= 4.5) score += 20;
  else if (worker.rating >= 4.0) score += 10;
  if (worker.location === job.location) score += 20;
  if (worker.completedJobs >= 10) score += 20;
  return Math.min(score, 100);
}