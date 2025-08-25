
const gameCount = require("./gameCount");

module.exports = {
  config: {
    name: "roulette",
    version: "1.0",
    author: "tohidul",
    countDown: 5,
    role: 0,
    description: "🎰 Roulette game",
    category: "game",
    guide: { en: "Use: {pn} <bet> <color>\nColors: red, black, green" }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);

    if (!userData || userData.money === undefined) {
      return message.reply("❌ Account issue! Please try again later.");
    }

    // ===== GAME LIMIT SYSTEM USING gameCount.js =====
    const gameCheck = gameCount.canPlayGame(senderID, "roulette");
    
    if (!gameCheck.canPlay) {
      return message.reply(`⚠️ You already played ${gameCheck.limit} roulette games in last 12h. Try again after ${gameCheck.remaining} hours.`);
    }

    // Increment game count
    const currentCount = gameCount.incrementGameCount(senderID, "roulette");

    // ===== Roulette game logic =====
    const bet = parseInt(args[0]);
    const color = args[1]?.toLowerCase();

    if (isNaN(bet) || bet <= 0) {
      return message.reply("Please provide a valid bet amount and color (red/black/green).");
    }

    if (!["red", "black", "green"].includes(color)) {
      return message.reply("Please choose a color: red, black, or green.");
    }

    if (userData.money < bet) {
      return message.reply("You don't have enough money to place this bet.");
    }

    userData.money -= bet;

    const winningColor = ["red", "black", "green"][Math.floor(Math.random() * 3)];
    let winnings = 0;

    if (color === winningColor) {
      if (color === "green") {
        winnings = bet * 14;
      } else {
        winnings = bet * 2;
      }
      userData.money += winnings;
      await usersData.set(senderID, userData);
      message.reply(`The winning color is **${winningColor.toUpperCase()}**! You won **${winnings}** coins. 🥳\n\n🎮 Roulette games played: ${currentCount}/20`);
    } else {
      await usersData.set(senderID, userData);
      message.reply(`The winning color is **${winningColor.toUpperCase()}**! You lost **${bet}** coins. 😥\n\n🎮 Roulette games played: ${currentCount}/20`);
    }
  }
};
