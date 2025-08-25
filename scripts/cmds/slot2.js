
const gameCount = require("./gameCount");

module.exports = {
  config: {
    name: "slot",
    version: "1.1",
    author: "Tohidul",
    shortDescription: {
      en: "Game slot",
    },
    longDescription: {
      en: "Game slot with usage limit.",
    },
    category: "game",
  },
  langs: {
    en: {
      invalid_amount: "❌ Enter a valid bet amount (50 - 1M coins)!",
      not_enough_money: "❌ You don't have enough money! Check your balance.",
      limit_reached: "⚠️ You already played %1$ times in last 12h. Try again after %2$ hours.",
      win_message: "🎉 You win %1$💗!\n[ %2$ | %3$ | %4$ ]",
      lose_message: "😞 You lost %1$🥲.\n[ %2$ | %3$ | %4$ ]",
      jackpot_message: "🎉 JACKPOT! You won %1$!\n[ %2$ | %3$ | %4$ ]",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    // ===== BET LIMITS =====
    if (amount < 50) {
      return message.reply("❌ Minimum bet is 50 coins!");
    }
    if (amount > 1000000) {
      return message.reply("❌ Maximum bet is 1M coins!");
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    // ===== GAME LIMIT SYSTEM USING gameCount.js =====
    const gameCheck = gameCount.canPlayGame(senderID, "slot");
    
    if (!gameCheck.canPlay) {
      return message.reply(`⚠️ You already played ${gameCheck.limit} slot games in last 12h. Try again after ${gameCheck.remaining} hours.`);
    }

    // Increment game count
    const currentCount = gameCount.incrementGameCount(senderID, "slot");
    // ==========================================

    const slots = ["🍒", "🍇", "🍊", "🍉", "🍋", "🍎", "🍓", "🍑", "🥝"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    const winnings = calculateWinnings(slot1, slot2, slot3, amount);

    userData.money += winnings;
    await usersData.set(senderID, userData);

    let messageText;
    if (winnings > 0) {
      if (slot1 === "🍒" && slot2 === "🍒" && slot3 === "🍒") {
        messageText = getLang("jackpot_message", winnings, slot1, slot2, slot3);
      } else {
        messageText = getLang("win_message", winnings, slot1, slot2, slot3);
      }
    } else {
      messageText = getLang("lose_message", -winnings, slot1, slot2, slot3);
    }

    return message.reply(
      messageText + `\n💰 Balance: ${userData.money}\n🎮 Slot games played: ${currentCount}/20`
    );
  },
};

function calculateWinnings(slot1, slot2, slot3, betAmount) {
  if (slot1 === "🍒" && slot2 === "🍒" && slot3 === "🍒") {
    return betAmount * 10;
  } else if (slot1 === "🍇" && slot2 === "🍇" && slot3 === "🍇") {
    return betAmount * 5;
  } else if (slot1 === slot2 && slot2 === slot3) {
    return betAmount * 3;
  } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
    return betAmount * 2;
  } else {
    return -betAmount;
  }
}
