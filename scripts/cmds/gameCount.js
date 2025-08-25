
const fs = require("fs-extra");
const path = require("path");

// This is a utility module, not a command
// It doesn't need config object

const gameCountPath = path.join(__dirname, "../cache/gameCount.json");

// Ensure the gameCount.json file exists
function ensureGameCountFile() {
    if (!fs.existsSync(gameCountPath)) {
        fs.writeFileSync(gameCountPath, JSON.stringify({}));
    }
}

// Load game count data
function loadGameCount() {
    ensureGameCountFile();
    try {
        return JSON.parse(fs.readFileSync(gameCountPath, "utf8"));
    } catch (error) {
        console.error("Error loading game count:", error);
        return {};
    }
}

// Save game count data
function saveGameCount(data) {
    try {
        fs.writeFileSync(gameCountPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error saving game count:", error);
    }
}

// Check if user can play game
function canPlayGame(userID, gameName) {
    const gameData = loadGameCount();
    const now = Date.now();
    const resetTime = 12 * 60 * 60 * 1000; // 12 hours
    const limit = 20;

    if (!gameData[userID]) {
        gameData[userID] = {};
    }

    if (!gameData[userID][gameName]) {
        gameData[userID][gameName] = {
            count: 0,
            lastReset: now
        };
    }

    const userData = gameData[userID][gameName];

    // Reset count if 12 hours have passed
    if (now - userData.lastReset > resetTime) {
        userData.count = 0;
        userData.lastReset = now;
    }

    // Check if user has reached limit
    if (userData.count >= limit) {
        const remaining = ((resetTime - (now - userData.lastReset)) / (60 * 60 * 1000)).toFixed(1);
        return {
            canPlay: false,
            remaining: remaining,
            count: userData.count,
            limit: limit
        };
    }

    return {
        canPlay: true,
        count: userData.count,
        limit: limit
    };
}

// Increment game count for user
function incrementGameCount(userID, gameName) {
    const gameData = loadGameCount();
    const now = Date.now();

    if (!gameData[userID]) {
        gameData[userID] = {};
    }

    if (!gameData[userID][gameName]) {
        gameData[userID][gameName] = {
            count: 0,
            lastReset: now
        };
    }

    gameData[userID][gameName].count++;
    saveGameCount(gameData);

    return gameData[userID][gameName].count;
}

// Get user's game stats
function getUserGameStats(userID, gameName) {
    const gameData = loadGameCount();
    
    if (!gameData[userID] || !gameData[userID][gameName]) {
        return {
            count: 0,
            limit: 20
        };
    }

    return {
        count: gameData[userID][gameName].count,
        limit: 20
    };
}

module.exports = {
    canPlayGame,
    incrementGameCount,
    getUserGameStats,
    loadGameCount,
    saveGameCount
};
