// path: /js/achievements.js

class AchievementManager {
  constructor() {
    this.achievements = [
      {
        id: "first_steps",
        title: "First Steps",
        description: "Complete your first habit",
        icon: "👣",
        requirement: 1,
        type: "total_completed",
        unlocked: false,
        progress: 0,
      },
      {
        id: "week_warrior",
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: "🔥",
        requirement: 7,
        type: "streak",
        unlocked: false,
        progress: 0,
      },
      {
        id: "month_master",
        title: "Month Master",
        description: "Maintain a 30-day streak",
        icon: "🏆",
        requirement: 30,
        type: "streak",
        unlocked: false,
        progress: 0,
      },
      {
        id: "habit_hero",
        title: "Habit Hero",
        description: "Complete 100 habits total",
        icon: "🦸",
        requirement: 100,
        type: "total_completed",
        unlocked: false,
        progress: 0,
      },
      {
        id: "level_10",
        title: "Decade Dominator",
        description: "Reach level 10",
        icon: "⭐",
        requirement: 10,
        type: "level",
        unlocked: false,
        progress: 0,
      },
      {
        id: "level_25",
        title: "Silver Sentinel",
        description: "Reach level 25",
        icon: "🥈",
        requirement: 25,
        type: "level",
        unlocked: false,
        progress: 0,
      },
      {
        id: "level_50",
        title: "Golden Guardian",
        description: "Reach level 50",
        icon: "🥇",
        requirement: 50,
        type: "level",
        unlocked: false,
        progress: 0,
      },
      {
        id: "early_bird",
        title: "Early Bird",
        description: "Complete 5 habits before 8 AM",
        icon: "🌅",
        requirement: 5,
        type: "morning_completions",
        unlocked: false,
        progress: 0,
      },
    ];

    this.loadAchievements();
  }

  loadAchievements() {
    const saved = localStorage.getItem("achievements");
    if (saved) {
      const savedAchievements = JSON.parse(saved);
      // Merge saved state (unlocked, progress) with default definitions
      this.achievements = this.achievements.map((ach) => {
        const saved = savedAchievements.find((s) => s.id === ach.id);
        return saved
          ? {
              ...ach,
              unlocked: saved.unlocked,
              progress: saved.progress,
              unlockedAt: saved.unlockedAt,
            }
          : ach;
      });
    }
  }

  saveAchievements() {
    localStorage.setItem("achievements", JSON.stringify(this.achievements));
  }

  checkAchievement(type, value) {
    const newlyUnlocked = [];

    this.achievements.forEach((achievement) => {
      if (!achievement.unlocked && achievement.type === type) {
        // Update progress before checking unlock status
        achievement.progress = Math.min(value, achievement.requirement);

        if (value >= achievement.requirement) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date().toISOString();
          newlyUnlocked.push(achievement);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveAchievements();
      newlyUnlocked.forEach((achievement) => {
        this.showAchievementUnlocked(achievement);
      });
    }
  }

  showAchievementUnlocked(achievement) {
    // Play achievement sound
    if (window.HQApp && window.HQApp.soundEnabled) {
      playSound("achievement");
    }

    // Show achievement modal
    document.getElementById("achievementTitle").textContent = achievement.title;
    document.getElementById("achievementDesc").textContent =
      achievement.description;
    window.HQApp.showModal("achievementModal");

    // Show notification
    if (window.HQApp) {
      window.HQApp.showNotification(
        `🏆 Achievement Unlocked: ${achievement.title}`,
        "success"
      );
    }
  }

  getAchievements() {
    return this.achievements;
  }
}

// Global achievement functions
const achievementManager = new AchievementManager();

function checkStreakAchievements(currentStreak) {
  achievementManager.checkAchievement("streak", currentStreak);
}

function checkLevelAchievements(currentLevel) {
  achievementManager.checkAchievement("level", currentLevel);
}

function checkHabitAchievements(totalCompleted) {
  achievementManager.checkAchievement("total_completed", totalCompleted);
}

function checkHabitSpecificAchievements(habit) {
  // This is where more complex, habit-specific checks (like 'early_bird') would live.
  // Requires more complex tracking in HQDB or app.js completion logic.
}

function getAchievements() {
  return achievementManager.getAchievements();
}
