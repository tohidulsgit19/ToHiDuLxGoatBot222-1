module.exports = {
  config: {
    name: "bank",
    aliases: [],
    version: "1.9",
    author: "tohidul",
    countDown: 5,
    role: 0,
    description: "Bank system with wallet, bank, loan, etc.",
    category: "economy",
    guide: {
      en: "{pn} balance\n{pn} deposit <amount>\n{pn} withdraw <amount>\n{pn} loan\n{pn} preloan\n{pn} top"
    }
  },

  formatMoney(amount) {
    if (amount === 0) return "0";
    const abs = Math.abs(amount);
    if (abs >= 1e15) return (amount / 1e15).toFixed(2).replace(/\.00$/, "") + "qt";
    if (abs >= 1e12) return (amount / 1e12).toFixed(2).replace(/\.00$/, "") + "treelion";
    if (abs >= 1e9) return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + "bilon";
    if (abs >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.00$/, "") + "milon";
    if (abs >= 1e3) return (amount / 1e3).toFixed(2).replace(/\.00$/, "") + "k";
    return amount.toString();
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      const senderID = event.senderID;
      const cmd = args[0]?.toLowerCase();

      if (!cmd) {
        return message.reply(
          "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
          "║➤◉ 🏦 Bank Commands:\n" +
          "║➤◉ • balance\n" +
          "║➤◉ • deposit <amount>\n" +
          "║➤◉ • withdraw <amount>\n" +
          "║➤◉ • loan\n" +
          "║➤◉ • preloan\n" +
          "║➤◉ • top\n" +
          "╚════════════════════════════════════"
        );
      }

      let userData = await usersData.get(senderID);
      if (!userData.data) userData.data = {};
      if (!userData.data.bankdata) userData.data.bankdata = { bank: 0, loan: 0 };

      let wallet = userData.money || 0;
      let bankData = userData.data.bankdata;
      const format = this.formatMoney;

      if (cmd === "balance") {
        const replyText =
          "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
          `║➤◉ 👤 Name  : ${await usersData.getName(senderID)}\n` +
          `║➤◉ 💰 Wallet: ${format(wallet)}\n` +
          `║➤◉ 🏦 Bank  : ${format(bankData.bank)}\n` +
          `║➤◉ 💳 Loan  : ${format(bankData.loan)}\n` +
          "╚════════════════════════════════════";

        return message.reply(replyText);
      }

      if (cmd === "deposit") {
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0)
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            "║➤◉ ❌ Provide a valid amount to deposit.\n" +
            "╚════════════════════════════════════"
          );

        if (wallet < amount)
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            `║➤◉ ❌ You only have ${format(wallet)} in your wallet.\n` +
            "╚════════════════════════════════════"
          );

        wallet -= amount;
        bankData.bank += amount;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });

        const replyText =
          "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
          `║➤◉ ✅ Deposited: ${format(amount)}\n` +
          `║➤◉ 💰 Wallet: ${format(wallet)}\n` +
          `║➤◉ 🏦 Bank: ${format(bankData.bank)}\n` +
          "╚════════════════════════════════════";

        return message.reply(replyText);
      }

      if (cmd === "withdraw") {
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0)
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            "║➤◉ ❌ Provide a valid amount to withdraw.\n" +
            "╚════════════════════════════════════"
          );

        if (bankData.bank < amount)
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            `║➤◉ ❌ You only have ${format(bankData.bank)} in your bank.\n` +
            "╚════════════════════════════════════"
          );

        bankData.bank -= amount;
        wallet += amount;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });

        const replyText =
          "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
          `║➤◉ ✅ Withdrawn: ${format(amount)}\n` +
          `║➤◉ 💰 Wallet: ${format(wallet)}\n` +
          `║➤◉ 🏦 Bank: ${format(bankData.bank)}\n` +
          "╚════════════════════════════════════";

        return message.reply(replyText);
      }

      if (cmd === "loan") {
        const loanLimit = 1000000;
        if (bankData.loan > 0) {
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            `║➤◉ ⛔ You already have a loan of ${format(bankData.loan)}. Repay it first.\n` +
            "╚════════════════════════════════════"
          );
        }

        bankData.loan = loanLimit;
        wallet += loanLimit;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });

        const replyText =
          "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
          `║➤◉ ✅ Loan approved: ${format(loanLimit)} added to your wallet.\n` +
          "╚════════════════════════════════════";

        return message.reply(replyText);
      }

      if (cmd === "preloan") {
        if (bankData.loan === 0) {
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            "║➤◉ ✅ You have no active loan.\n" +
            "╚════════════════════════════════════"
          );
        }

        if (wallet < bankData.loan) {
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            `║➤◉ ❌ You need ${format(bankData.loan)} to repay.\n` +
            "╚════════════════════════════════════"
          );
        }

        wallet -= bankData.loan;
        bankData.loan = 0;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });

        return message.reply(
          "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
          "║➤◉ ✅ Loan fully repaid. You are debt-free!\n" +
          "╚════════════════════════════════════"
        );
      }

      if (cmd === "top") {
        const allUsers = await usersData.getAll();
        const topUsers = allUsers
          .filter(u => u?.data?.bankdata?.bank > 0)
          .sort((a, b) => b.data.bankdata.bank - a.data.bankdata.bank)
          .slice(0, 10);

        if (topUsers.length === 0) {
          return message.reply(
            "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
            "║➤◉ ❌ No users found with money in bank.\n" +
            "╚════════════════════════════════════"
          );
        }

        let msg = "╔═════════ 《 🏦 Makima Bank 》 ═════════\n";
        msg += "║➤◉ 🏆 Top 10 Users by Bank Balance:\n";
        for (let i = 0; i < topUsers.length; i++) {
          const user = topUsers[i];
          msg += `║➤◉ ${i + 1}. ${user.name || "Unknown"}: ${format(user.data.bankdata.bank)}\n`;
        }
        msg += "╚════════════════════════════════════";

        return message.reply(msg.trim());
      }

      return message.reply(
        "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
        "║➤◉ ❓ Invalid subcommand. Try: balance, deposit, withdraw, loan, preloan, top\n" +
        "╚════════════════════════════════════"
      );

    } catch (error) {
      console.error("Bank command error:", error);
      return message.reply(
        "╔═════════ 《 🏦 Makima Bank 》 ═════════\n" +
        "║➤◉ ❌ An error occurred. Please try again later.\n" +
        "╚════════════════════════════════════"
      );
    }
  }
};
