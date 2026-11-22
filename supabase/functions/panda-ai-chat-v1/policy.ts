// Panda Go AI: keep the existing server quota policy (trial 30 days: 10/day; then 3/day).
export const TRIAL_DAYS = 30;
export const TRIAL_LIMIT = 10;
export const BASE_LIMIT = 3;
export const MS_PER_DAY = 86_400_000;
export function quotaPolicy(purchasedAt: string, now = Date.now()) {
  const timestamp = Date.parse(purchasedAt);
  if (!Number.isFinite(timestamp) || now < timestamp) throw new Error("Invalid purchase timestamp");
  const elapsed = now - timestamp;
  const trial = elapsed < TRIAL_DAYS * MS_PER_DAY;
  return {
    phase: trial ? "trial" : "base",
    limit: trial ? TRIAL_LIMIT : BASE_LIMIT,
    trialDay: trial ? Math.floor(elapsed / MS_PER_DAY) + 1 : null,
    trialEndsAt: new Date(timestamp + TRIAL_DAYS * MS_PER_DAY).toISOString()
  };
}
