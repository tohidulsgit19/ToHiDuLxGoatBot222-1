module.exports = {
  config: {
    name: "spin",
    version: "5.0",
    author: "TOHIDUL",
    countDown: 5,
    role: 0,
    description: "Slot machine spin game with win/loss & leaderboard",
    category: "game",
    guide: {
      en: "{p}spin <amount>\n{p}spin top"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const senderID = event.senderID;
    const subCommand = args[0];

    // ✅ /spin top leaderboard
    if (subCommand === "top") {
      const allUsers = await usersData.getAll();
      const top = allUsers
        .filter(u => typeof u.data?.totalSpinWin === "number" && u.data.totalSpinWin > 0)
        .sort((a, b) => b.data.totalSpinWin - a.data.totalSpinWin)
        .slice(0, 10);

      if (top.length === 0) {
        return message.reply("❌ No spin winners yet.");
      }

      const result = top.map((user, i) => {
        const name = user.name || `User ${user.userID?.slice(-4) || "??"}`;
        return `${i + 1}. ${name} – 💸 ${user.data.totalSpinWin} coins`;
      }).join("\n");

      return message.reply(`🏆 Top Spin Winners:\n\n${result}`);
    }

    // ✅ /spin <amount>
    const betAmount = parseInt(subCommand);
    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply("❌ Usage:\n/spin <amount>\n/spin top");
    }

    // ===== BET LIMITS =====
    if (betAmount < 50) {
      return message.reply("❌ Minimum bet is 50 coins!");
    }
    if (betAmount > 1000000) {
      return message.reply("❌ Maximum bet is 1M coins!");
    }

    const userData = await usersData.get(senderID) || {};
    userData.money = userData.money || 0;
    userData.data = userData.data || {};
    userData.data.totalSpinWin = userData.data.totalSpinWin || 0;

    // ===== LIMIT SYSTEM (database based) =====
    const now = Date.now();
    const limit = 20;
    const resetTime = 12 * 60 * 60 * 1000; // 12h

    if (!userData.spinData) {
      userData.spinData = { count: 0, lastReset: now };
    }

    if (now - userData.spinData.lastReset > resetTime) {
      userData.spinData = { count: 0, lastReset: now };
    }

    if (userData.spinData.count >= limit) {
      const remaining = ((resetTime - (now - userData.spinData.lastReset)) / (60 * 60 * 1000)).toFixed(1);
      return message.reply(`⚠️ You already played ${limit} times in last 12h. Try again after ${remaining} hours.`);
    }

    userData.spinData.count++;

    if (userData.money < betAmount) {
      return message.reply(`❌ Not enough money.\n💰 Your balance: ${userData.money}`);
    }

    // Bet deduct
    userData.money -= betAmount;

    // 🎰 Slot symbols
    const symbols = ["🍒", "🍋", "🍇", "🍉", "⭐", "7️⃣"];
    const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

    let multiplier = 0;
    let resultText = "💥 You lost everything!";

    if (slot1 === slot2 && slot2 === slot3) {
      // Jackpot condition 🎉
      multiplier = 10;
      resultText = "🎉 JACKPOT! All 3 matched!";
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      // Two symbols matched
      multiplier = 2;
      resultText = "🟢 Two matched! You doubled your bet!";
    } else {
      // Random small chance to break even
      if (Math.random() < 0.2) {
        multiplier = 1;
        resultText = "🟡 You broke even.";
      } else if (Math.random() < 0.3) {
        multiplier = 0.5;
        resultText = "😞 You got back half.";
      }
    }

    const reward = Math.floor(betAmount * multiplier);
    userData.money += reward;

    if (reward > betAmount) {
      const profit = reward - betAmount;
      userData.data.totalSpinWin += profit;
    }

    await usersData.set(senderID, userData);

    return message.reply(
      `🎰 SLOT MACHINE 🎰\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${resultText}\n\n💵 Bet: ${betAmount}$\n💸 Won: ${reward}$\n💰 Balance: ${userData.money}$\n\n🌀 Spins used: ${userData.spinData.count}/${limit}`
    );
  }
};