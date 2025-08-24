const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slot2",
    aliases: ["slot2"],
    version: "2.2",
    author: "tohidul",
    countDown: 3,
    role: 0,
    description: "🎰 Stylish slot game with real odds",
    category: "game",
    guide: { en: "Use: {pn} [amount]" }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const bet = parseInt(args[0]);
    const user = await usersData.get(senderID);

    // ========= LIMIT SYSTEM (usersData ভিত্তিক) =========
    const now = Date.now();
    const limit = 20;
    const resetTime = 12 * 60 * 60 * 1000; // 12 ঘন্টা

    if (!user.slotsData) {
      user.slotsData = { count: 0, lastReset: now };
    }

    if (now - user.slotsData.lastReset > resetTime) {
      user.slotsData = { count: 0, lastReset: now };
    }

    if (user.slotsData.count >= limit) {
      const remaining = ((resetTime - (now - user.slotsData.lastReset)) / (60 * 60 * 1000)).toFixed(1);
      return message.reply(`⚠️ | আজকে আপনি ${limit} বার spin করেছেন। আবার চেষ্টা করুন ${remaining} ঘন্টা পরে।`);
    }

    user.slotsData.count++;
    // ===============================================

    const formatMoney = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M 💰` : n.toLocaleString() + " 💵";

    if (isNaN(bet) || bet <= 0) return message.reply("❌ Enter a valid amount.");
    if (user.money < bet) return message.reply(`💸 Need ${formatMoney(bet - user.money)} more.`);

    const symbols = ["🍒", "🍋", "🍇", "🍉", "⭐", "7️⃣"];
    const roll = () => symbols[Math.floor(Math.random() * symbols.length)];

    const slot1 = roll(), slot2 = roll(), slot3 = roll();
    let winnings = 0, outcome = "";

    const jackpotChance = Math.random() < 0.05;  // 5% jackpot
    const loseChance = Math.random() < 0.40;     // 40% loss

    if (jackpotChance) {
      winnings = bet * 500;
      outcome = "🎉 JACKPOT x500!";
    } else if (!loseChance) {
      const multi = Math.floor(Math.random() * 10) + 1;
      winnings = bet * multi;
      outcome = `🎯 Win x${multi}`;
    } else {
      winnings = -bet;
      outcome = "😓 You lost!";
    }

    const newBalance = user.money + winnings;
    user.money = newBalance;

    await usersData.set(senderID, user); // পুরো userData সেভ হবে (money + slotsData সহ)

    const slotBox = "🎰 SLOT\n\n" + `[ ${slot1} | ${slot2} | ${slot3} ]`;

    const result =
      `${slotBox}\n\n` +
      `${outcome}\n\n` +
      `${winnings >= 0 ? `+${formatMoney(winnings)}` : `-${formatMoney(bet)}`}\n\n` +
      `💰 Bal: ${formatMoney(newBalance)}\n\n` +
      `🌀 Spins used: ${user.slotsData.count}/${limit}`;

    return message.reply(result);
  }
};
