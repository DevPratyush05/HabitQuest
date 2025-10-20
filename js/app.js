// path: /js/app.js

class HabitQuest {
  constructor() {
    this.xp = parseInt(localStorage.getItem("xp") || 0);
    this.level = parseInt(localStorage.getItem("level") || 1);
    this.currentStreak = parseInt(localStorage.getItem("currentStreak") || 0);
    this.longestStreak = parseInt(localStorage.getItem("longestStreak") || 0);
    this.totalCompleted = parseInt(localStorage.getItem("totalCompleted") || 0);
    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    this.darkMode = localStorage.getItem("darkMode") !== "false";
    this.gender = localStorage.getItem("gender");
    this.firstTimeUser = this.gender === null;
    this.isPWA = window.matchMedia("(display-mode: standalone)").matches;

    this.XP_FOR_LEVEL = 100;
    this.lastCompletionDate = localStorage.getItem("lastCompletionDate");
    this.dailyCompletions = new Set(
      JSON.parse(localStorage.getItem("dailyCompletions") || "[]")
    );
    this.habitToDelete = null;

    this.init();
  }

  // Add this method to HabitQuest class
  ensureButtonVisible() {
    const addButton = document.getElementById("addHabitBtn");
    if (addButton) {
      // Scroll to bottom to ensure button is visible
      setTimeout(() => {
        addButton.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }

  // Call this when switching to habits page
  switchPage(pageName) {
    // ... your existing switchPage code ...

    // Render specific content for the page
    switch (pageName) {
      case "home":
        this.renderDailyQuests();
        break;
      case "habits":
        this.renderHabits();
        this.ensureButtonVisible(); // Add this line
        break;
      case "achievements":
        this.renderAchievements();
        break;
      case "profile":
        this.renderProfile();
        break;
    }
  }

  async init() {
    // Hide loading screen
    this.hideLoadingScreen();

    // Setup audio
    this.setupAudio();

    // Check if first time user (no gender selected)
    if (this.firstTimeUser) {
      await this.showGenderSelection();
    } else {
      await this.setupEventListeners();
      await this.renderAll();
      this.setupTheme();
      setSoundEnabled(this.soundEnabled);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("sw.js");
        console.log("Service Worker registered successfully");
      } catch (error) {
        console.log("Service Worker registration failed:", error);
      }
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        setTimeout(() => {
          loadingScreen.remove();
        }, 300);
      }, 500);
    }
  }

  async showGenderSelection() {
    this.switchPage("gender");

    const genderOptions = document.querySelectorAll(".gender-option");
    const confirmBtn = document.getElementById("confirmGenderBtn");

    genderOptions.forEach((option) => {
      option.addEventListener("click", () => {
        // Remove selection from all options
        genderOptions.forEach((opt) => opt.classList.remove("selected"));
        // Add selection to clicked option
        option.classList.add("selected");

        this.gender = option.dataset.gender;
        confirmBtn.disabled = false;

        // Preview avatar
        this.previewAvatar(this.gender);
      });
    });

    confirmBtn.addEventListener("click", async () => {
      if (this.gender) {
        await this.completeGenderSelection();
      }
    });
  }

  previewAvatar(gender) {
    const avatars = {
      male: "🦸‍♂️",
      female: "🦸‍♀️",
      "non-binary": "🧙‍♂️",
    };

    const genderOption = document.querySelector(`[data-gender="${gender}"]`);
    if (genderOption) {
      const avatarElement = genderOption.querySelector(".gender-avatar");
      avatarElement.textContent = avatars[gender];
    }
  }

  async completeGenderSelection() {
    // Save gender preference
    localStorage.setItem("gender", this.gender);
    this.firstTimeUser = false;

    // Set avatar based on gender
    await this.setAvatarBasedOnGender();

    // Initialize the main app
    await this.setupEventListeners();
    await this.renderAll();
    this.setupTheme();
    setSoundEnabled(this.soundEnabled);

    // Switch to home page
    this.switchPage("home");
    this.showNotification(
      "Welcome to HabitQuest! Start your journey by adding your first quest.",
      "success"
    );
  }

  async setAvatarBasedOnGender() {
    const avatarElement = document.getElementById("characterAvatar");
    if (!avatarElement) return;

    const avatars = {
      male: "🦸‍♂️",
      female: "🦸‍♀️",
      "non-binary": "🧙‍♂️",
    };

    // Set avatar as emoji
    avatarElement.textContent = avatars[this.gender] || "👤";
    avatarElement.className = "avatar emoji-avatar";
  }

  // Add this method to the HabitQuest class
  setupAudio() {
    // Initialize audio on first user interaction
    const initAudio = () => {
      if (window.soundManager && window.soundManager.audioContext) {
        window.soundManager.audioContext.resume().then(() => {
          console.log("Audio context ready");
        });
      }
      document.removeEventListener("click", initAudio);
    };

    document.addEventListener("click", initAudio, { once: true });
  }

  async setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchPage(e.target.dataset.page)
      );
    });

    // Habit Modal
    document.getElementById("addHabitBtn").addEventListener("click", () => {
      this.showModal("habitModal");
    });

    document
      .getElementById("saveHabitBtn")
      .addEventListener("click", async () => {
        await this.saveHabit();
      });

    document.getElementById("cancelHabitBtn").addEventListener("click", () => {
      this.hideModal("habitModal");
    });

    // Filters
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.filterHabits(e.target.dataset.filter)
      );
    });

    // Settings
    document
      .getElementById("darkModeToggle")
      .addEventListener("change", (e) => {
        this.toggleDarkMode(e.target.checked);
      });

    document.getElementById("soundToggle").addEventListener("change", (e) => {
      this.toggleSound(e.target.checked);
    });

    document.getElementById("exportDataBtn").addEventListener("click", () => {
      this.exportData();
    });

    document.getElementById("resetDataBtn").addEventListener("click", () => {
      this.showConfirmation(
        "Reset All Data",
        "Are you sure you want to reset all data? This will delete all your habits and progress!",
        () => this.performReset()
      );
    });

    document
      .getElementById("closeAchievementBtn")
      .addEventListener("click", () => {
        this.hideModal("achievementModal");
      });

    // Delete habit modal handlers
    document
      .getElementById("confirmDeleteBtn")
      .addEventListener("click", async () => {
        await this.confirmDeleteHabit();
      });

    document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
      this.hideModal("deleteHabitModal");
      this.habitToDelete = null;
    });

    // Close modals on background click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Global delete button handler (event delegation)
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("delete-habit-btn") ||
        e.target.closest(".delete-habit-btn")
      ) {
        const button = e.target.classList.contains("delete-habit-btn")
          ? e.target
          : e.target.closest(".delete-habit-btn");
        const habitId = parseInt(button.dataset.habitId);
        this.showDeleteConfirmation(habitId);
      }
    });
  }

  switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });

    // Show target page
    const targetPage = document.getElementById(pageName + "Page");
    if (targetPage) {
      targetPage.classList.add("active");
    }

    // Update active nav button
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.page === pageName) {
        btn.classList.add("active");
      }
    });

    // Render specific content for the page
    switch (pageName) {
      case "home":
        this.renderDailyQuests();
        break;
      case "habits":
        this.renderHabits();
        break;
      case "achievements":
        this.renderAchievements();
        break;
      case "profile":
        this.renderProfile();
        break;
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  showNotification(message, type = "info") {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  async renderAll() {
    await this.renderHabits();
    this.renderDailyQuests();
    this.renderAchievements();
    this.renderProfile();
    this.updateStats();
    this.updateXPBar();
  }

  async renderHabits(filter = "all") {
    const habits = await HQDB.getHabits();
    const list = document.getElementById("habitList");
    list.innerHTML = "";

    const filteredHabits = habits.filter((habit) => {
      if (filter === "all") return true;
      return habit.frequency === filter;
    });

    if (filteredHabits.length === 0) {
      list.innerHTML = this.getEmptyStateHTML("habits");
      return;
    }

    filteredHabits.forEach((habit) => {
      const li = this.createHabitElement(habit);
      list.appendChild(li);
    });
  }

  createHabitElement(habit) {
    const li = document.createElement("li");
    li.className = "habit-item";

    const isCompletedToday = this.dailyCompletions.has(habit.id);
    const completionClass = isCompletedToday ? "completed" : "";

    li.innerHTML = `
      <div class="habit-info">
        <div class="habit-name ${completionClass}">${this.escapeHtml(
      habit.name
    )}</div>
        <div class="habit-meta">
          <span class="habit-frequency ${habit.frequency}">${
      habit.frequency
    }</span>
          <span class="habit-streak">🔥 ${habit.streak} days</span>
          ${habit.reminder ? '<span class="habit-reminder">🔔</span>' : ""}
        </div>
        ${
          habit.description
            ? `<div class="habit-desc">${this.escapeHtml(
                habit.description
              )}</div>`
            : ""
        }
        ${
          isCompletedToday
            ? '<div class="completed-badge">✅ Completed Today</div>'
            : ""
        }
      </div>
      <div class="habit-actions">
        <button class="complete-btn ${isCompletedToday ? "completed" : ""}" 
                data-id="${habit.id}" 
                ${isCompletedToday ? "disabled" : ""}>
          ${isCompletedToday ? "Completed" : "Complete"}
        </button>
        <button class="delete-habit-btn" data-habit-id="${
          habit.id
        }" title="Delete Quest">
          🗑️
        </button>
      </div>
    `;

    if (!isCompletedToday) {
      li.querySelector(".complete-btn").addEventListener("click", (e) => {
        e.target.disabled = true;
        e.target.classList.add("loading");
        this.completeHabit(habit, e.target);
      });
    }

    return li;
  }

  async saveHabit() {
    const name = document.getElementById("habitName").value.trim();
    const description = document
      .getElementById("habitDescription")
      .value.trim();
    const frequency = document.getElementById("habitFrequency").value;
    const reminder = document.getElementById("habitReminder").checked;

    if (name) {
      try {
        await HQDB.addHabit({
          name,
          description,
          frequency,
          reminder,
          streak: 0,
          createdAt: new Date().toISOString(),
        });

        this.hideModal("habitModal");
        await this.renderHabits();
        this.renderDailyQuests();

        this.showNotification("🎯 New quest added!", "success");

        // Reset form
        document.getElementById("habitName").value = "";
        document.getElementById("habitDescription").value = "";
        document.getElementById("habitReminder").checked = false;
      } catch (error) {
        console.error("Save error:", error);
        this.showNotification("❌ Error saving quest", "error");
      }
    } else {
      this.showNotification("Please enter a quest name", "error");
    }
  }

  async completeHabit(habit, button) {
    try {
      // Add to daily completions
      this.dailyCompletions.add(habit.id);

      // Update streak
      const updatedHabit = await HQDB.updateHabit(habit.id, {
        streak: habit.streak + 1,
      });

      // Record completion
      await HQDB.recordCompletion(habit.id);

      // Update XP and stats
      this.addXP(25); // 25 XP per completion

      // Update total completed
      this.totalCompleted++;

      // Check streak achievements
      if (updatedHabit.streak > this.currentStreak) {
        this.currentStreak = updatedHabit.streak;
        if (this.currentStreak > this.longestStreak) {
          this.longestStreak = this.currentStreak;
        }
      }

      // Save to storage
      this.saveToStorage();

      // Check achievements
      checkStreakAchievements(this.currentStreak);
      checkHabitAchievements(this.totalCompleted);

      // Play sound
      if (this.soundEnabled) {
        playSound("complete");
      }

      // Update UI
      await this.renderHabits();
      this.renderDailyQuests();
      this.updateStats();

      this.showNotification("✅ Quest completed! +25 XP", "success");
    } catch (error) {
      console.error("Completion error:", error);
      button.disabled = false;
      button.classList.remove("loading");
      this.showNotification("❌ Error completing quest", "error");
    }
  }

  addXP(amount) {
    this.xp += amount;

    // Check for level up
    const xpNeeded = this.level * this.XP_FOR_LEVEL;
    if (this.xp >= xpNeeded) {
      this.level++;
      this.xp = this.xp - xpNeeded;

      // Play level up sound
      if (this.soundEnabled) {
        playSound("levelUp");
      }

      // Check level achievements
      checkLevelAchievements(this.level);

      this.showNotification(
        `🎉 Level Up! You're now level ${this.level}`,
        "success"
      );
    }

    this.updateXPBar();
    this.saveToStorage();
  }

  updateXPBar() {
    const xpFill = document.getElementById("xpFill");
    const xpText = document.getElementById("xpText");
    const currentLevel = document.getElementById("currentLevel");

    if (xpFill && xpText && currentLevel) {
      const xpNeeded = this.level * this.XP_FOR_LEVEL;
      const progress = (this.xp / xpNeeded) * 100;

      xpFill.style.width = `${progress}%`;
      xpText.textContent = `Level: ${this.level} | XP: ${this.xp}/${xpNeeded}`;
      currentLevel.textContent = this.level;
    }
  }

  async renderDailyQuests() {
    const container = document.getElementById("dailyQuests");
    if (!container) return;

    const habits = await HQDB.getHabits();
    const dailyHabits = habits.filter((habit) => habit.frequency === "daily");

    if (dailyHabits.length === 0) {
      container.innerHTML = this.getEmptyStateHTML("quests");
      return;
    }

    container.innerHTML = dailyHabits
      .map((habit) => {
        const isCompleted = this.dailyCompletions.has(habit.id);
        return `
        <div class="quest-item ${isCompleted ? "completed" : ""}">
          <div class="quest-info">
            <div class="quest-name">${this.escapeHtml(habit.name)}</div>
            <div class="quest-meta">
              <span class="quest-streak">🔥 ${habit.streak} days</span>
              ${
                isCompleted
                  ? '<span class="quest-completed">✅ Completed</span>'
                  : ""
              }
            </div>
          </div>
          ${
            !isCompleted
              ? `
            <button class="complete-btn" data-id="${habit.id}">
              Complete
            </button>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");

    // Add event listeners to complete buttons
    container.querySelectorAll(".complete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const habitId = parseInt(e.target.dataset.id);
        const habit = dailyHabits.find((h) => h.id === habitId);
        if (habit) {
          e.target.disabled = true;
          e.target.classList.add("loading");
          await this.completeHabit(habit, e.target);
        }
      });
    });
  }

  async renderAchievements() {
    const container = document.getElementById("achievementsList");
    if (!container) return;

    const achievements = getAchievements();

    if (achievements.length === 0) {
      container.innerHTML =
        '<div class="no-achievements">No achievements available</div>';
      return;
    }

    container.innerHTML = achievements
      .map(
        (achievement) => `
      <div class="achievement-card ${
        achievement.unlocked ? "unlocked" : "locked"
      }">
        <div class="achievement-icon-small">${achievement.icon}</div>
        <h4>${achievement.title}</h4>
        <p>${achievement.description}</p>
        <small>${
          achievement.unlocked
            ? "Unlocked!"
            : `Progress: ${achievement.progress}/${achievement.requirement}`
        }</small>
      </div>
    `
      )
      .join("");
  }

  renderProfile() {
    document.getElementById("profileXP").textContent = this.xp;
    document.getElementById("profileLevel").textContent = this.level;
    document.getElementById(
      "longestStreak"
    ).textContent = `${this.longestStreak} days`;

    // Set toggle states
    document.getElementById("darkModeToggle").checked = this.darkMode;
    document.getElementById("soundToggle").checked = this.soundEnabled;
  }

  updateStats() {
    document.getElementById(
      "currentStreak"
    ).textContent = `${this.currentStreak} days`;
    document.getElementById(
      "totalCompleted"
    ).textContent = `${this.totalCompleted} habits`;
  }

  getEmptyStateHTML(type) {
    const messages = {
      habits:
        '<div class="no-habits">No quests yet. Add your first quest to begin your adventure!</div>',
      quests:
        '<div class="no-quests">No daily quests today. Add some daily habits to see them here!</div>',
    };
    return messages[type] || "<div>No items found</div>";
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  filterHabits(filter) {
    this.renderHabits(filter);

    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.filter === filter) {
        btn.classList.add("active");
      }
    });
  }

  showDeleteConfirmation(habitId) {
    HQDB.getHabits().then((habits) => {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        document.getElementById(
          "deleteHabitMessage"
        ).textContent = `Are you sure you want to delete "${habit.name}"? This action cannot be undone and all progress will be lost.`;

        this.habitToDelete = habitId;
        this.showModal("deleteHabitModal");
      }
    });
  }

  async confirmDeleteHabit() {
    if (this.habitToDelete) {
      try {
        // Remove from daily completions if it exists
        this.dailyCompletions.delete(this.habitToDelete);

        // Delete from database
        await HQDB.deleteHabit(this.habitToDelete);

        this.showNotification("🗑️ Quest deleted successfully", "success");
        this.hideModal("deleteHabitModal");

        // Re-render habits
        await this.renderHabits();

        // Also update daily quests if we're on home page
        this.renderDailyQuests();

        this.habitToDelete = null;
      } catch (error) {
        console.error("Delete error:", error);
        this.showNotification("❌ Error deleting quest", "error");
      }
    }
  }

  toggleDarkMode(enabled) {
    this.darkMode = enabled;
    this.setupTheme();
    this.saveToStorage();
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    setSoundEnabled(enabled);
    this.saveToStorage();
  }

  setupTheme() {
    document.documentElement.setAttribute(
      "data-theme",
      this.darkMode ? "dark" : "light"
    );
  }

  saveToStorage() {
    localStorage.setItem("xp", this.xp);
    localStorage.setItem("level", this.level);
    localStorage.setItem("currentStreak", this.currentStreak);
    localStorage.setItem("longestStreak", this.longestStreak);
    localStorage.setItem("totalCompleted", this.totalCompleted);
    localStorage.setItem("lastCompletionDate", this.lastCompletionDate || "");
    localStorage.setItem("soundEnabled", this.soundEnabled);
    localStorage.setItem("darkMode", this.darkMode);
    if (this.gender) {
      localStorage.setItem("gender", this.gender);
    }
    localStorage.setItem(
      "dailyCompletions",
      JSON.stringify([...this.dailyCompletions])
    );
  }

  showConfirmation(title, message, onConfirm) {
    document.getElementById("confirmationTitle").textContent = title;
    document.getElementById("confirmationMessage").textContent = message;

    const confirmBtn = document.getElementById("confirmYesBtn");
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener("click", () => {
      this.hideModal("confirmationModal");
      onConfirm();
    });

    this.showModal("confirmationModal");
  }

  performReset() {
    HQDB.resetDatabase().then(() => {
      localStorage.clear();
      window.location.reload();
    });
  }

  exportData() {
    // Simple export implementation
    const data = {
      xp: this.xp,
      level: this.level,
      streak: this.currentStreak,
      habits: [], // You would populate this with actual habits from DB
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habitquest-data.json";
    link.click();

    URL.revokeObjectURL(url);
    this.showNotification("📊 Data exported successfully", "success");
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  window.HQApp = new HabitQuest();
});
