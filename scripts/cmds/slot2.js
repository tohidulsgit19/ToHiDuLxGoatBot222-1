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
      invalid_amount: "Put a big 🌝 number, you can win twice the risk of my son 🌝🙌",
      not_enough_money: "You have this amount, see your balance then 🌝🤣",
      limit_reached: "⚠️ You already played %1$ times in last 12h. Try again after %2$ hours.",
      win_message: "You win %1$💗!\n[ %2$ | %3$ | %4$ ]",
      lose_message: "You lost %1$🥲.\n[ %2$ | %3$ | %4$ ]",
      jackpot_message: "🎉 JACKPOT! You won %1$!\n[ %2$ | %3$ | %4$ ]",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const amount = parseInt(args[0]);

    // ===== LIMIT SYSTEM (12h / 20 spins) =====
    const now = Date.now();
    const limit = 20;
    const resetTime = 12 * 60 * 60 * 1000; // 12h

    if (!userData.slot2Data) {
      userData.slot2Data = { count: 0, lastReset: now };
    }

    if (now - userData.slot2Data.lastReset > resetTime) {
      userData.slot2Data = { count: 0, lastReset: now };
    }

    if (userData.slot2Data.count >= limit) {
      const remaining = ((resetTime - (now - userData.slot2Data.lastReset)) / (60 * 60 * 1000)).toFixed(1);
      return message.reply(getLang("limit_reached", limit, remaining));
    }

    userData.slot2Data.count++;
    // ==========================================

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

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
      messageText + `\n🌀 Spins used: ${userData.slot2Data.count}/${limit}`
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
