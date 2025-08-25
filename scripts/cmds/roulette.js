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
      return message.reply(`⚠️ You already played ${limit} casino games in last 12h. Try again after ${remaining} hours.`);
    }

    userData.gameData.count++;

    // ===== Roulette game logic =====
    const bet = parseInt(args[0]);
    const color = args[1]?.toLowerCase();

    if (isNaN(bet) || bet <= 0) {
      return message.reply("Please provide a valid bet amount and color (red/black/green).");
    }

    if (!["red", "black", "green"].includes(color)) {
      return message.reply("Please choose a color: red, black, or green.");
    }

    if (userData.coins < bet) {
      return message.reply("You don't have enough coins to place this bet.");
    }

    userData.coins -= bet;

    const winningColor = ["red", "black", "green"][Math.floor(Math.random() * 3)];
    let winnings = 0;

    if (color === winningColor) {
      if (color === "green") {
        winnings = bet * 14;
      } else {
        winnings = bet * 2;
      }
      userData.coins += winnings;
      message.reply(`The winning color is **${winningColor.toUpperCase()}**! You won **${winnings}** coins. 🥳\n\n🎮 Casino games played: ${userData.gameData.count}/${limit}`);
    } else {
      message.reply(`The winning color is **${winningColor.toUpperCase()}**! You lost **${bet}** coins. 😥\n\n🎮 Casino games played: ${userData.gameData.count}/${limit}`);
    }