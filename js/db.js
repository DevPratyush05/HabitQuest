// path: /js/db.js

class HQDB {
  static async init() {
    return new Promise((resolve, reject) => {
      // Version 1 of the database
      const request = indexedDB.open("HabitQuestDB", 1);

      request.onerror = () => {
        console.error("IndexedDB Error:", request.error);
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Habit store: Primary data for tracking
        if (!db.objectStoreNames.contains("habits")) {
          const habitsStore = db.createObjectStore("habits", {
            keyPath: "id",
            autoIncrement: true, // Use IndexedDB's auto-incrementing key
          });
          habitsStore.createIndex("name", "name", { unique: false });
          habitsStore.createIndex("frequency", "frequency", { unique: false });
        }

        // Achievements store: Local storage for achievement states
        if (!db.objectStoreNames.contains("achievements")) {
          db.createObjectStore("achievements", {
            keyPath: "id",
          });
        }

        // Completions store: For historical tracking and analytics
        if (!db.objectStoreNames.contains("completions")) {
          const completionsStore = db.createObjectStore("completions", {
            keyPath: "id",
            autoIncrement: true,
          });
          completionsStore.createIndex("habitId", "habitId", {
            unique: false,
          });
          completionsStore.createIndex("date", "date", { unique: false });
        }
      };
    });
  }

  // Add this method to the HQDB class in db.js
  static async resetDatabase() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["habits", "achievements", "completions"],
        "readwrite"
      );

      transaction.objectStore("habits").clear();
      transaction.objectStore("achievements").clear();
      transaction.objectStore("completions").clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  static async deleteHabit(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["habits"], "readwrite");
      const store = transaction.objectStore("habits");
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Habit ${id} deleted successfully`);
        resolve();
      };
      request.onerror = () => {
        console.error("Error deleting habit:", request.error);
        reject(request.error);
      };
    });
  }

  static async getDB() {
    if (!this.db) {
      this.db = await this.init();
    }
    return this.db;
  }

  static async addHabit(habit) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["habits"], "readwrite");
      const store = transaction.objectStore("habits");

      // IndexedDB will generate the 'id' due to autoIncrement: true
      const request = store.add(habit);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getHabits() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["habits"], "readonly");
      const store = transaction.objectStore("habits");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteHabit(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["habits"], "readwrite");
      const store = transaction.objectStore("habits");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async updateHabit(id, updates) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["habits"], "readwrite");
      const store = transaction.objectStore("habits");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const habit = getRequest.result;
        if (habit) {
          // Merge existing habit data with updates
          const updatedHabit = { ...habit, ...updates };
          const putRequest = store.put(updatedHabit);
          putRequest.onsuccess = () => resolve(updatedHabit);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error("Habit not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async recordCompletion(habitId) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["completions"], "readwrite");
      const store = transaction.objectStore("completions");
      const request = store.add({
        habitId,
        date: new Date().toISOString(),
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async resetDatabase() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["habits", "achievements", "completions"],
        "readwrite"
      );

      transaction.objectStore("habits").clear();
      transaction.objectStore("achievements").clear();
      transaction.objectStore("completions").clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Initialize database when loaded
HQDB.init().catch(console.error);
