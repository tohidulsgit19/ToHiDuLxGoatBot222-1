const cooldowns = {}; // ইউজারের usage ট্র্যাক করার জন্য

module.exports = {
  config: {
    name: "sicbo",
    aliases: ["sic"],
    version: "1.1",
    author: "Loid Butter + Tohidul",
    countDown: 10,
    role: 0,
    shortDescription: "Play Sicbo, the oldest gambling game",
    longDescription: "Play Sicbo, the oldest gambling game, and earn money",
    category: "game",
    guide: "{pn} <Small/Big> <amount of money>"
  },

  onStart: async function ({ args, message, usersData, event }) {
    const user = event.senderID;
    const now = Date.now();
    const limit = 20; // সর্বোচ্চ খেলার সংখ্যা
    const resetTime = 12 * 60 * 60 * 1000; // 12 ঘন্টা = ms

    // যদি ইউজারের ডাটা না থাকে, initialize করো
    if (!cooldowns[user]) {
      cooldowns[user] = { count: 0, lastReset: now };
    }

    // 12 ঘন্টা পার হলে reset করো
    if (now - cooldowns[user].lastReset > resetTime) {
      cooldowns[user] = { count: 0, lastReset: now };
    }

    // limit চেক করো
    if (cooldowns[user].count >= limit) {
      const remaining = ((resetTime - (now - cooldowns[user].lastReset)) / (60 * 60 * 1000)).toFixed(1);
      return message.reply(`⚠️ | আপনি আজকে ${limit} বার খেলেছেন। আবার খেলতে পারবেন ${remaining} ঘন্টা পরে।`);
    }

    // count বাড়াও
    cooldowns[user].count++;

    // -------- নিচে তোমার আসল গেম লজিক --------
    const betType = args[0]?.toLowerCase();
    const betAmount = parseInt(args[1]);
    const userData = await usersData.get(user);

    if (!["small", "big"].includes(betType)) {
      return message.reply("🙊 | Choose 'small' or 'big'.");
    }

    if (!Number.isInteger(betAmount) || betAmount < 50) {
      return message.reply("❌ | Please bet an amount of 50 or more.");
    }

    if (betAmount > userData.money) {
      return message.reply("❌ | You don't have enough money to make that bet.");
    }

    const dice = [1, 2, 3, 4, 5, 6];
    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(dice[Math.floor(Math.random() * dice.length)]);
    }

    const resultString = results.join(" | ");
    const total = results.reduce((a, b) => a + b, 0);
    const outcome = total >= 4 && total <= 10 ? "small" : "big";

    if (betType === outcome) {
      const winAmount = betAmount;
      userData.money += winAmount;
      await usersData.set(user, userData);
      return message.reply(`(\\_/)\n( •_•)\n// >[ ${resultString} ]\n\n🎉 | Congratulations! You won ${winAmount}!`);
    } else {
      userData.money -= betAmount;
      await usersData.set(user, userData);
      return message.reply(`(\\_/)\n( •_•)\n// >[ ${resultString} ]\n\n😿 | You lost ${betAmount}.`);
    }
  }
};
