
const gameCount = require("./gameCount");

module.exports = {
  config: {
    name: "gamestats",
    aliases: ["gamestat", "gstats"],
    version: "1.0",
    author: "tohidul",
    countDown: 5,
    role: 0,
    description: "🎮 Check your game statistics",
    category: "game",
    guide: { en: "Use: {pn} [game_name]" }
  },

  onStart: async function ({ message, event, args }) {
    const { senderID } = event;
    const gameName = args[0];

    if (gameName) {
      // Show stats for specific game
      const stats = gameCount.getUserGameStats(senderID, gameName);
      return message.reply(`🎮 **${gameName.toUpperCase()} GAME STATS**\n\n👤 Your Stats:\n🎯 Games Played: ${stats.count}/${stats.limit}\n⏰ Resets every 12 hours`);
    } else {
      // Show stats for all games
      const allData = gameCount.loadGameCount();
      const userData = allData[senderID] || {};
      
      let statsMessage = "🎮 **YOUR GAME STATISTICS** 🎮\n\n";
      
      if (Object.keys(userData).length === 0) {
        statsMessage += "❌ No games played yet!";
      } else {
        for (const [game, data] of Object.entries(userData)) {
          const now = Date.now();
          const resetTime = 12 * 60 * 60 * 1000;
          const timeLeft = ((resetTime - (now - data.lastReset)) / (60 * 60 * 1000)).toFixed(1);
          
          statsMessage += `🎯 **${game.toUpperCase()}**: ${data.count}/20\n`;
          if (data.count >= 20) {
            statsMessage += `   ⏰ Resets in: ${timeLeft} hours\n`;
          }
          statsMessage += "\n";
        }
      }
      
      return message.reply(statsMessage);
    }
  }
};
