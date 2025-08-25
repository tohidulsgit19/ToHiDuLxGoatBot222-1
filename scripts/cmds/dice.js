module.exports = {
  config: {
    name: "dice",
    version: "1.7",
    author: "tohidul",
    shortDescription: "🎲 Dice Game | Bet & win coins!",
    longDescription: "Bet coins and roll the dice. Dice value decides your fate. No need to guess!",
    category: "Game",
    guide: {
      en: "{p}dice <bet amount>\nExample: {p}dice 1000"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID);

    if (!userData || userData.money === undefined) {
      return api.sendMessage("❌ Account issue! Please try again later.", threadID);
    }

    const betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return api.sendMessage("⚠️ Invalid usage!\nUse like: dice <bet amount>\nExample: dice 1000", threadID);
    }

    // ===== BET LIMITS =====
    if (betAmount < 50) {
      return api.sendMessage("❌ Minimum bet is 50 coins!", threadID);
    }
    if (betAmount > 1000000) {
      return api.sendMessage("❌ Maximum bet is 1M coins!", threadID);
    }

    if (betAmount > userData.money) {
      return api.sendMessage(`❌ You only have ${formatMoney(userData.money)} coins!`, threadID);
    }

    // ===== UNIVERSAL GAME LIMIT SYSTEM =====
    const now = Date.now();
    const limit = 20;
    const resetTime = 12 * 60 * 60 * 1000; // 12h

    if (!userData.gameData) {
      userData.gameData = { count: 0, lastReset: now };
    }

    if (now - userData.gameData.lastReset > resetTime) {
      userData.gameData = { count: 0, lastReset: now };
    }

    if (userData.gameData.count >= limit) {
      const remaining = ((resetTime - (now - userData.gameData.lastReset)) / (60 * 60 * 1000)).toFixed(1);
      return api.sendMessage(`⚠️ আপনি আজকে ${limit} বার dice খেলেছেন। আবার খেলতে পারবেন ${remaining} ঘন্টা পরে।`, threadID);
    }

    userData.gameData.count++;

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let resultMessage = `🎲 Dice rolled: ${diceRoll}\n`;
    let winAmount = 0;

    // Dice game logic
    if (diceRoll === 6) {
      winAmount = betAmount * 5; // 5x multiplier for 6
      resultMessage += `🎉 JACKPOT! You rolled a 6!\n💰 Won: ${formatMoney(winAmount)}`;
    } else if (diceRoll >= 4) {
      winAmount = betAmount * 2; // 2x multiplier for 4,5
      resultMessage += `✅ Good roll! You won!\n💰 Won: ${formatMoney(winAmount)}`;
    } else if (diceRoll === 3) {
      winAmount = betAmount; // Break even for 3
      resultMessage += `➖ Break even! You got your money back.`;
    } else {
      winAmount = 0; // Loss for 1,2
      resultMessage += `😞 You lost! Better luck next time.`;
    }

    // Update money
    userData.money = userData.money - betAmount + winAmount;
    await usersData.set(senderID, userData);

    resultMessage += `\n💵 Balance: ${formatMoney(userData.money)}\n🎮 Casino games played: ${userData.gameData.count}/${limit}`;

    return api.sendMessage(resultMessage, threadID);
  }
};

function formatMoney(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}