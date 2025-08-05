const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slots2",
    aliases: ["slot", "spin"],
    version: "2.0",
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

    const formatMoney = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M 💰` : n.toLocaleString() + " 💵";

    if (isNaN(bet) || bet <= 0) return message.reply("❌ Enter a valid amount.");
    if (user.money < bet) return message.reply(`💸 Need ${formatMoney(bet - user.money)} more.`);

    const symbols = ["🍒", "🍋", "🍇", "🍉", "⭐", "7️⃣"];
    const roll = () => symbols[Math.floor(Math.random() * symbols.length)];

    const slot1 = roll(), slot2 = roll(), slot3 = roll();
    let winnings = 0, outcome = "", note = "";

    const jackpotChance = Math.random() < 0.01;  // 5% jackpot
    const loseChance = Math.random() < 0.60;      // 40% loss

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
    await usersData.set(senderID, { money: newBalance });

    const slotBox =
      "🎰 SLOT\n\n" +
      `[ ${slot1} | ${slot2} | ${slot3} ]`;

    const result =
      `${slotBox}\n\n` +
      `${outcome}\n\n` +
      `${winnings >= 0 ? `+${formatMoney(winnings)}` : `-${formatMoney(bet)}`}\n\n` +
      `💰 Bal: ${formatMoney(newBalance)}`;

    return message.reply(result);
  }
};
