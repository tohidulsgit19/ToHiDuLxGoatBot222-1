module.exports = {
 config: {
 name: "wheel",
 version: "3.1",
 author: "xnil6x",
 shortDescription: "🎡 Ultra-Stable Wheel Game",
 longDescription: "Guaranteed smooth spinning experience with automatic fail-safes",
 category: "Game",
 guide: {
 en: "{p}wheel <amount>"
 }
 },

 onStart: async function ({ api, event, args, usersData }) {
 const { senderID, threadID } = event;
 let betAmount = 0;

 try {
 betAmount = this.sanitizeBetAmount(args[0]);
 if (!betAmount) {
 return api.sendMessage(
 `❌ Invalid bet amount! Usage: ${global.GoatBot.config.prefix}wheel 500`,
 threadID
 );
 }

 const user = await usersData.get(senderID);
 if (!this.isValidUserData(user)) {
 return api.sendMessage(
 "🔒 Account verification failed. Please contact support.",
 threadID
 );
 }

 if (betAmount > user.money) {
 return api.sendMessage(
 `❌ Insufficient balance! You have: ${this.formatMoney(user.money)}`,
 threadID
 );
 }

 const { result, winAmount } = await this.executeSpin(api, threadID, betAmount);
 const newBalance = user.money + winAmount;

 await usersData.set(senderID, { money: newBalance });

 return api.sendMessage(
 this.generateResultText(result, winAmount, betAmount, newBalance),
 threadID
 );

 } catch (error) {
 console.error("Wheel System Error:", error);
 return api.sendMessage(
 `🎡 System recovered! Your ${this.formatMoney(betAmount)} coins are safe. Try spinning again.`,
 threadID
 );
 }
 },

 sanitizeBetAmount: function(input) {
 const amount = parseInt(String(input || "").replace(/[^0-9]/g, ""));
 return amount > 0 ? amount : null;
 },

 isValidUserData: function(user) {
 return user && typeof user.money === "number" && user.money >= 0;
 },

 async executeSpin(api, threadID, betAmount) {
 const wheelSegments = [
 { emoji: "🍒", multiplier: 0.5, weight: 20 },
 { emoji: "🍋", multiplier: 1, weight: 30 },
 { emoji: "🍊", multiplier: 2, weight: 25 }, 
 { emoji: "🍇", multiplier: 3, weight: 15 },
 { emoji: "💎", multiplier: 5, weight: 7 },
 { emoji: "💰", multiplier: 10, weight: 3 }
 ];

 await api.sendMessage("🌀 Starting the wheel...", threadID);
 await new Promise(resolve => setTimeout(resolve, 1500));

 const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0);
 const randomValue = Math.random() * totalWeight;
 let cumulativeWeight = 0;

 const result = wheelSegments.find(segment => {
 cumulativeWeight += segment.weight;
 return randomValue <= cumulativeWeight;
 }) || wheelSegments[0];

 const winAmount = Math.floor(betAmount * result.multiplier) - betAmount;

 return { result, winAmount };
 },

 generateResultText: function(result, winAmount, betAmount, newBalance) {
 const resultText = [
 `🎡 WHEEL STOPPED ON: ${result.emoji}`,
 "",
 this.getOutcomeText(result.multiplier, winAmount, betAmount),
 `💰 NEW BALANCE: ${this.formatMoney(newBalance)}`
 ].join("\n");

 return resultText;
 },

 getOutcomeText: function(multiplier, winAmount, betAmount) {
 if (multiplier < 1) return `❌ LOST: ${this.formatMoney(betAmount * 0.5)}`;
 if (multiplier === 1) return "➖ BROKE EVEN";
 return `✅ WON ${multiplier}X! (+${this.formatMoney(winAmount)})`;
 },

 formatMoney: function(amount) {
 const units = ["", "K", "M", "B"];
 let unitIndex = 0;
 
 while (amount >= 1000 && unitIndex < units.length - 1) {
 amount /= 1000;
 unitIndex++;
 }
 
 return amount.toFixed(amount % 1 ? 2 : 0) + units[unitIndex];
 }
};
const fs = require("fs-extra");
const path = require("path");

// Store file for tracking daily plays
const WHEEL_STORE_FILE = path.join(__dirname, "..", "cache", "wheelGame.json");
const DAILY_LIMIT = 3; // Maximum 3 spins per day per user

// Wheel symbols and their rewards/penalties
const WHEEL_SYMBOLS = [
  { symbol: "🍎", name: "Apple", reward: 50, chance: 20 },
  { symbol: "🍌", name: "Banana", reward: 30, chance: 25 },
  { symbol: "🍒", name: "Cherry", reward: 100, chance: 15 },
  { symbol: "🍇", name: "Grape", reward: 75, chance: 18 },
  { symbol: "🍊", name: "Orange", reward: 40, chance: 22 },
  { symbol: "💎", name: "Diamond", reward: 500, chance: 3 },
  { symbol: "⭐", name: "Star", reward: 200, chance: 8 },
  { symbol: "💀", name: "Skull", reward: -100, chance: 5 },
  { symbol: "🎰", name: "Jackpot", reward: 1000, chance: 2 },
  { symbol: "❌", name: "Loss", reward: -50, chance: 7 }
];

// Ensure store file exists
function ensureStoreFile() {
  const folder = path.dirname(WHEEL_STORE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(WHEEL_STORE_FILE)) {
    fs.writeFileSync(WHEEL_STORE_FILE, JSON.stringify({}));
  }
}

// Load wheel data
function loadWheelData() {
  ensureStoreFile();
  try {
    return JSON.parse(fs.readFileSync(WHEEL_STORE_FILE, 'utf8'));
  } catch (error) {
    return {};
  }
}

// Save wheel data
function saveWheelData(data) {
  try {
    fs.writeFileSync(WHEEL_STORE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving wheel data:", error);
  }
}

// Get today's date string
function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// Spin the wheel based on chance
function spinWheel() {
  const totalChance = WHEEL_SYMBOLS.reduce((sum, symbol) => sum + symbol.chance, 0);
  const random = Math.random() * totalChance;
  
  let currentChance = 0;
  for (const symbol of WHEEL_SYMBOLS) {
    currentChance += symbol.chance;
    if (random <= currentChance) {
      return symbol;
    }
  }
  
  // Fallback (should never happen)
  return WHEEL_SYMBOLS[0];
}

// Create animated wheel spinning effect
function createWheelAnimation() {
  const spinFrames = [
    "🎰 ═══════════════════ 🎰",
    "🎪 ░░░░░ SPINNING ░░░░░ 🎪",
    "🎯 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 🎯",
    "⚡ ████████████████████ ⚡",
    "🌟 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 🌟"
  ];
  
  return spinFrames[Math.floor(Math.random() * spinFrames.length)];
}

// Bengali time format
function formatTime(date) {
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka'
  }).format(date);
}

module.exports = {
  config: {
    name: "wheel",
    aliases: ["slot", "spin", "casino"],
    version: "1.0",
    author: "Wheel Game Master",
    countDown: 5,
    role: 0,
    shortDescription: "Play wheel game with daily limit",
    longDescription: "Spin the wheel to win or lose money! Limited to 3 spins per day per user.",
    category: "game",
    guide: {
      en: "{pn} - Spin the wheel (3 times per day)\n{pn} stats - Check your stats\n{pn} leaderboard - View top players\n{pn} help - Show symbol rewards"
    }
  },

  onStart: async function ({ args, message, event, usersData, threadsData, api, getLang }) {
    const { senderID, threadID } = event;
    const command = args[0]?.toLowerCase();

    // Help command
    if (command === "help" || command === "symbols") {
      let helpMsg = "🎰 𝗪𝗛𝗘𝗘𝗟 𝗚𝗔𝗠𝗘 𝗦𝗬𝗠𝗕𝗢𝗟𝗦 🎰\n";
      helpMsg += "━━━━━━━━━━━━━━━━━━━━━━━━\n";
      
      WHEEL_SYMBOLS.forEach(symbol => {
        const rewardText = symbol.reward > 0 ? `+${symbol.reward}` : `${symbol.reward}`;
        helpMsg += `${symbol.symbol} ${symbol.name}: ${rewardText} coins (${symbol.chance}%)\n`;
      });
      
      helpMsg += "\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
      helpMsg += "💰 Daily Limit: 3 spins per user\n";
      helpMsg += "🕐 Reset: Every day at midnight\n";
      helpMsg += "🎯 Use: wheel, wheel stats, wheel leaderboard";
      
      return message.reply(helpMsg);
    }

    // Stats command
    if (command === "stats" || command === "stat") {
      const wheelData = loadWheelData();
      const userData = wheelData[senderID] || { 
        totalSpins: 0, 
        totalWon: 0, 
        totalLost: 0, 
        bestWin: 0, 
        worstLoss: 0,
        lastSpin: null 
      };
      
      const winRate = userData.totalSpins > 0 ? 
        ((userData.totalSpins - Math.abs(userData.totalLost / 50)) / userData.totalSpins * 100).toFixed(1) : 0;
      
      let statsMsg = `🎰 ${(await api.getUserInfo(senderID))[senderID]?.name || "You"} এর পরিসংখ্যান\n`;
      statsMsg += "━━━━━━━━━━━━━━━━━━━━━━━━\n";
      statsMsg += `🎲 মোট স্পিন: ${userData.totalSpins}\n`;
      statsMsg += `💰 মোট জেতা: ${userData.totalWon} coins\n`;
      statsMsg += `💸 মোট হারানো: ${Math.abs(userData.totalLost)} coins\n`;
      statsMsg += `🏆 সেরা জয়: ${userData.bestWin} coins\n`;
      statsMsg += `📉 সবচেয়ে বেশি ক্ষতি: ${Math.abs(userData.worstLoss)} coins\n`;
      statsMsg += `📊 জয়ের হার: ${winRate}%\n`;
      
      if (userData.lastSpin) {
        statsMsg += `⏰ শেষ স্পিন: ${formatTime(new Date(userData.lastSpin))}`;
      }
      
      return message.reply(statsMsg);
    }

    // Leaderboard command
    if (command === "leaderboard" || command === "top") {
      const wheelData = loadWheelData();
      const sortedUsers = Object.entries(wheelData)
        .map(([userID, data]) => ({
          userID,
          totalWon: data.totalWon || 0,
          totalSpins: data.totalSpins || 0,
          netGain: (data.totalWon || 0) + (data.totalLost || 0)
        }))
        .sort((a, b) => b.netGain - a.netGain)
        .slice(0, 10);

      if (sortedUsers.length === 0) {
        return message.reply("🎰 কেউ এখনো wheel game খেলেনি!");
      }

      let leaderMsg = "🏆 𝗪𝗛𝗘𝗘𝗟 𝗚𝗔𝗠𝗘 𝗟𝗘𝗔𝗗𝗘𝗥𝗕𝗢𝗔𝗥𝗗\n";
      leaderMsg += "━━━━━━━━━━━━━━━━━━━━━━━━\n";

      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        let userName = "Unknown User";
        try {
          const userInfo = await api.getUserInfo(user.userID);
          userName = userInfo[user.userID]?.name || "Unknown User";
        } catch (error) {
          userName = `User ${user.userID}`;
        }

        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        leaderMsg += `${medal} ${userName}\n`;
        leaderMsg += `   💰 Net: ${user.netGain} | Spins: ${user.totalSpins}\n`;
      }

      return message.reply(leaderMsg);
    }

    // Main wheel spin
    const wheelData = loadWheelData();
    const today = getTodayString();
    
    // Initialize user data
    if (!wheelData[senderID]) {
      wheelData[senderID] = {
        totalSpins: 0,
        totalWon: 0,
        totalLost: 0,
        bestWin: 0,
        worstLoss: 0,
        dailySpins: {},
        lastSpin: null
      };
    }

    const userData = wheelData[senderID];
    const todaySpins = userData.dailySpins[today] || 0;

    // Check daily limit
    if (todaySpins >= DAILY_LIMIT) {
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 1);
      nextReset.setHours(0, 0, 0, 0);
      
      return message.reply(
        `🚫 দৈনিক সীমা শেষ!\n\n` +
        `আপনি আজ ${DAILY_LIMIT}টি স্পিন সম্পন্ন করেছেন।\n` +
        `⏰ পরবর্তী রিসেট: ${formatTime(nextReset)}\n\n` +
        `📊 আজকের স্ট্যাটস দেখতে: wheel stats`
      );
    }

    // Check user balance
    const userData2 = await usersData.get(senderID);
    const currentBalance = userData2.money || 0;
    
    if (currentBalance < 10) {
      return message.reply("💸 আপনার কমপক্ষে 10 coins থাকতে হবে খেলার জন্য!");
    }

    // Spin animation
    const spinAnimation = createWheelAnimation();
    const spinMsg = await message.reply(
      `🎰 𝗦𝗣𝗜𝗡𝗡𝗜𝗡𝗚 𝗧𝗛𝗘 𝗪𝗛𝗘𝗘𝗟...\n\n${spinAnimation}\n\n⏳ অপেক্ষা করুন...`
    );

    // Wait for suspense
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Spin the wheel
    const result = spinWheel();
    
    // Update user balance
    await usersData.addMoney(senderID, result.reward);
    
    // Update wheel statistics
    userData.totalSpins++;
    userData.dailySpins[today] = todaySpins + 1;
    userData.lastSpin = Date.now();
    
    if (result.reward > 0) {
      userData.totalWon += result.reward;
      if (result.reward > userData.bestWin) {
        userData.bestWin = result.reward;
      }
    } else {
      userData.totalLost += result.reward;
      if (result.reward < userData.worstLoss) {
        userData.worstLoss = result.reward;
      }
    }
    
    saveWheelData(wheelData);

    // Create result message
    const isWin = result.reward > 0;
    const remainingSpins = DAILY_LIMIT - (todaySpins + 1);
    
    let resultMsg = `🎰 𝗪𝗛𝗘𝗘𝗟 𝗥𝗘𝗦𝗨𝗟𝗧 🎰\n`;
    resultMsg += "━━━━━━━━━━━━━━━━━━━━━━━━\n";
    resultMsg += `🎯 Result: ${result.symbol} ${result.name}\n`;
    
    if (isWin) {
      resultMsg += `🎉 অভিনন্দন! আপনি জিতেছেন!\n`;
      resultMsg += `💰 পুরস্কার: +${result.reward} coins\n`;
    } else {
      resultMsg += `😞 দুর্ভাগ্য! আপনি হেরেছেন!\n`;
      resultMsg += `💸 ক্ষতি: ${result.reward} coins\n`;
    }
    
    const newBalance = await usersData.get(senderID);
    resultMsg += `💳 নতুন ব্যালেন্স: ${newBalance.money || 0} coins\n`;
    resultMsg += `🎲 আজকের অবশিষ্ট স্পিন: ${remainingSpins}\n`;
    resultMsg += "━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    if (result.reward >= 500) {
      resultMsg += `🔥 BIG WIN! 🔥\n`;
    } else if (result.reward >= 200) {
      resultMsg += `⭐ Great Win! ⭐\n`;
    }
    
    resultMsg += `📊 Stats: wheel stats | 🏆 Top: wheel leaderboard`;

    // Edit the spinning message with result
    await message.edit(spinMsg.messageID, resultMsg);

    // Special reactions for big wins/losses
    if (result.reward >= 500) {
      api.setMessageReaction("🔥", event.messageID, () => {}, true);
    } else if (result.reward >= 200) {
      api.setMessageReaction("⭐", event.messageID, () => {}, true);
    } else if (result.reward <= -50) {
      api.setMessageReaction("💀", event.messageID, () => {}, true);
    } else if (isWin) {
      api.setMessageReaction("🎉", event.messageID, () => {}, true);
    }
  }
};
