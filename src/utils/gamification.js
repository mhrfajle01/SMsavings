/**
 * Jomao (জমাও) Gamification Utilities
 */

// Leveling Logic
// Formula: XP required for level N = 100 * (N-1) * N
// Level 1: 0 XP
// Level 2: 200 XP (Needs 200 XP)
// Level 3: 600 XP (Needs 400 XP more)
// Level 4: 1200 XP (Needs 600 XP more)
// Level 5: 2000 XP (Needs 800 XP more)
export const calculateLevel = (xp) => {
  let level = 1;
  // Threshold for Level L: 100 * (L-1) * L
  // Level 1: 0 XP
  // Level 2: 100 * 1 * 2 = 200 XP
  // Level 3: 100 * 2 * 3 = 600 XP
  // Level 4: 100 * 3 * 4 = 1200 XP
  while (100 * level * (level + 1) <= xp) {
    level++;
  }
  
  const currentLevelTotalXP = 100 * (level - 1) * level;
  const nextLevelTotalXP = 100 * level * (level + 1);
  const xpInCurrentLevel = xp - currentLevelTotalXP;
  const xpNeededForNextLevel = nextLevelTotalXP - currentLevelTotalXP;
  
  const progress = Math.min(Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100), 100);
  
  return { 
    level, 
    progress, 
    xpInCurrentLevel, 
    xpNeededForNextLevel,
    xpRemaining: xpNeededForNextLevel - xpInCurrentLevel
  };
};

// Streak Logic
export const checkStreakStatus = (lastStreakDate, currentStreak, hasStreakFreeze = false) => {
  if (!lastStreakDate) return { newStreak: currentStreak, status: 'none' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastStreakDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Already updated today
    return { newStreak: currentStreak, status: 'maintained' };
  } else if (diffInDays === 1) {
    // Yesterday was the last update. Streak is alive but needs an action today to increment.
    return { newStreak: currentStreak, status: 'eligible' };
  } else if (diffInDays > 1) {
    // Streak broken (missed at least one full day)
    if (hasStreakFreeze) {
      return { newStreak: currentStreak, status: 'frozen', useFreeze: true };
    }
    return { newStreak: 0, status: 'broken' }; // Reset to 0
  }

  return { newStreak: currentStreak, status: 'none' };
};

export const STREAK_FREEZE_COST = 500; // XP cost to buy a streak freeze
