
const cooldowns = {}; // ইউজারের usage ট্র্যাক করার জন্য

module.exports = {
  config: {
    name: "sicbo",
    aliases: ["sic"],
    version: "1.2",
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
    const userData = await usersData.get(user);
    
    const now = Date.now();
    const limit = 20; // সর্বোচ্চ খেলার সংখ্যা
    const resetTime = 12 * 60 * 60 * 1000; // 12 ঘন্টা = ms

    // ===== LIMIT SYSTEM (12h / 20 plays) =====
    if (!userData.sicboData) {
      userData.sicboData = { count: 0, lastReset: now };
    }

    if (now - userData.sicboData.lastReset > resetTime) {
      userData.sicboData = { count: 0, lastReset: now };
    }

    if (userData.sicboData.count >= limit) {
      const remaining = ((resetTime - (now - userData.sicboData.lastReset)) / (60 * 60 * 1000)).toFixed(1);
      return message.reply(`⚠️ | আপনি আজকে ${limit} বার খেলেছেন। আবার খেলতে পারবেন ${remaining} ঘন্টা পরে।`);
    }

    userData.sicboData.count++;

    // -------- গেম লজিক --------
    const betType = args[0]?.toLowerCase();
    const betAmount = parseInt(args[1]);

    if (!["small", "big"].includes(betType)) {
      return message.reply("🙊 | Choose 'small' or 'big'.");
    }

    if (!Number.isInteger(betAmount) || betAmount < 50) {
      return message.reply("❌ | Please bet an amount of 50 or more.");
    }

    if (betAmount > 1000000) {
      return message.reply("❌ | Maximum bet is 1M coins!");
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

    // --- SPIN ANIMATION EFFECT ---
    const spinMsg = await message.reply("🎲 Rolling the dice...");
    const spinFrames = [
      "🎲 [ 1 | 2 | 3 ]",
      "🎲 [ 4 | 5 | 6 ]",
      "🎲 [ 2 | 4 | 1 ]",
      "🎲 [ 6 | 3 | 2 ]",
      "🎲 [ 3 | 5 | 1 ]",
      "🎲 [ 6 | 2 | 4 ]",
      "🎲 [ 5 | 1 | 3 ]"
    ];

    for (let i = 0; i < spinFrames.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      await message.edit(spinMsg.messageID, spinFrames[i]);
    }

    await new Promise(r => setTimeout(r, 700));

    // Final result দেখাও
    if (betType === outcome) {
      const winAmount = betAmount;
      userData.money += winAmount;
      await usersData.set(user, userData);
      return message.edit(spinMsg.messageID,
        `🎲 [ ${resultString} ]\n\n🎉 You won! Total: ${total} (${outcome})\n💰 Won: ${winAmount} coins\n💵 Balance: ${userData.money}\n🎲 Plays used: ${userData.sicboData.count}/${limit}`
      );
    } else {
      userData.money -= betAmount;
      await usersData.set(user, userData);
      return message.edit(spinMsg.messageID,
        `🎲 [ ${resultString} ]\n\n😞 You lost! Total: ${total} (${outcome})\n💸 Lost: ${betAmount} coins\n💵 Balance: ${userData.money}\n🎲 Plays used: ${userData.sicboData.count}/${limit}`
      );
    }
  }
};
