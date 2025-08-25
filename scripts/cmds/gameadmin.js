
const gameCount = require("./gameCount");

module.exports = {
  config: {
    name: "gameadmin",
    aliases: ["gadmin"],
    version: "1.0",
    author: "tohidul",
    countDown: 5,
    role: 2,
    description: "🔧 Admin commands for game management",
    category: "admin",
    guide: { 
      en: "Use: {pn} reset <userID> [game_name] - Reset user's game count\n{pn} view <userID> - View user's game stats\n{pn} set <userID> <game_name> <count> - Set user's game count" 
    }
  },

  onStart: async function ({ message, event, args }) {
    const action = args[0];
    const userID = args[1];

    if (!action || !userID) {
      return message.reply("❌ Invalid usage!\nUse: gameadmin <action> <userID> [options]");
    }

    const allData = gameCount.loadGameCount();

    switch (action.toLowerCase()) {
      case "reset":
        const gameName = args[2];
        if (gameName) {
          // Reset specific game
          if (allData[userID] && allData[userID][gameName]) {
            allData[userID][gameName].count = 0;
            allData[userID][gameName].lastReset = Date.now();
            gameCount.saveGameCount(allData);
            return message.reply(`✅ Reset ${gameName} game count for user ${userID}`);
          } else {
            return message.reply(`❌ User ${userID} has no ${gameName} game data`);
          }
        } else {
          // Reset all games for user
          if (allData[userID]) {
            for (const game in allData[userID]) {
              allData[userID][game].count = 0;
              allData[userID][game].lastReset = Date.now();
            }
            gameCount.saveGameCount(allData);
            return message.reply(`✅ Reset all game counts for user ${userID}`);
          } else {
            return message.reply(`❌ User ${userID} has no game data`);
          }
        }

      case "view":
        const userData = allData[userID] || {};
        if (Object.keys(userData).length === 0) {
          return message.reply(`❌ User ${userID} has no game data`);
        }
        
        let viewMessage = `🎮 **GAME DATA FOR USER ${userID}** 🎮\n\n`;
        for (const [game, data] of Object.entries(userData)) {
          const now = Date.now();
          const resetTime = 12 * 60 * 60 * 1000;
          const timeLeft = ((resetTime - (now - data.lastReset)) / (60 * 60 * 1000)).toFixed(1);
          
          viewMessage += `🎯 **${game.toUpperCase()}**: ${data.count}/20\n`;
          viewMessage += `   ⏰ Time left: ${timeLeft} hours\n\n`;
        }
        return message.reply(viewMessage);

      case "set":
        const targetGame = args[2];
        const newCount = parseInt(args[3]);
        
        if (!targetGame || isNaN(newCount)) {
          return message.reply("❌ Usage: gameadmin set <userID> <game_name> <count>");
        }
        
        if (!allData[userID]) {
          allData[userID] = {};
        }
        
        if (!allData[userID][targetGame]) {
          allData[userID][targetGame] = {
            count: 0,
            lastReset: Date.now()
          };
        }
        
        allData[userID][targetGame].count = newCount;
        gameCount.saveGameCount(allData);
        return message.reply(`✅ Set ${targetGame} game count to ${newCount} for user ${userID}`);

      default:
        return message.reply("❌ Invalid action! Use: reset, view, or set");
    }
  }
};
