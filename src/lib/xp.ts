export const OPTIONAL_TRACK_MULTIPLIER = 1.5
export const CERTIFICATE_BONUS = 200

export function applyTrack(xp: number, track: 'mandatory' | 'optional'): number {
  if (track === 'optional') {
    return Math.round(xp * OPTIONAL_TRACK_MULTIPLIER)
  }
  return xp
}

export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1
}

export function xpToNextLevel(totalXp: number): { currentLevel: number; nextLevelXp: number; progressPct: number } {
  const currentLevel = levelFromXp(totalXp)
  const currentLevelBaseXp = Math.pow(currentLevel - 1, 2) * 100
  const nextLevelXp = Math.pow(currentLevel, 2) * 100
  const needed = nextLevelXp - currentLevelBaseXp
  const earned = totalXp - currentLevelBaseXp
  const progressPct = needed > 0 ? Math.min(100, Math.floor((earned / needed) * 100)) : 100
  return { currentLevel, nextLevelXp, progressPct }
}
