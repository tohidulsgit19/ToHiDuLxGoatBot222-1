
module.exports = {
	config: {
		name: "balance",
		aliases: ["bal"],
		version: "2.1",
		author: "NTKhang & Modified by Tohidul",
		countDown: 5,
		role: 0,
		description: {
			vi: "xem số tiền hiện có hoặc chuyển tiền cho người khác",
			en: "view your money or send money to others"
		},
		category: "economy",
		guide: {
			vi: "   {pn}: xem số tiền của bạn"
				+ "\n   {pn} <@tag>: xem số tiền của người được tag"
				+ "\n   {pn} send <số tiền> <@tag>: chuyển tiền cho người được tag",
			en: "   {pn}: view your money"
				+ "\n   {pn} <@tag>: view the money of the tagged person"
				+ "\n   {pn} send <amount> <@tag>: send money to the tagged person"
		}
	},

	langs: {
		vi: {
			money: "💰 Bạn đang có %1$",
			moneyOf: "💰 %1 đang có %2$",
			missingAmount: "❌ Vui lòng nhập số tiền cần chuyển và tag người nhận.",
			missingUser: "❌ Vui lòng tag người nhận tiền.",
			notEnoughMoney: "❌ Bạn không có đủ tiền để chuyển.",
			sendSuccess: "✅ Đã chuyển %1$ cho %2.",
			invalidAmount: "❌ Số tiền không hợp lệ.",
			cantSendToSelf: "❌ Bạn không thể chuyển tiền cho chính mình.",
			minAmount: "❌ Số tiền tối thiểu để chuyển là 1$.",
			userNotFound: "❌ Không tìm thấy người dùng được tag."
		},
		en: {
			money: "💰 You have %1$",
			moneyOf: "💰 %1 has %2$",
			missingAmount: "❌ Please enter the amount and tag the recipient.",
			missingUser: "❌ Please tag the user to send money to.",
			notEnoughMoney: "❌ You don't have enough money to send.",
			sendSuccess: "✅ Successfully sent %1$ to %2.",
			invalidAmount: "❌ Invalid amount.",
			cantSendToSelf: "❌ You cannot send money to yourself.",
			minAmount: "❌ Minimum amount to send is 1$.",
			userNotFound: "❌ Tagged user not found."
		}
	},

	// Format money with commas and currency symbol
	formatMoney(amount) {
		if (amount === 0) return "0$";
		const abs = Math.abs(amount);
		if (abs >= 1e15) return (amount / 1e15).toFixed(2).replace(/\.00$/, "") + "qt$";
		if (abs >= 1e12) return (amount / 1e12).toFixed(2).replace(/\.00$/, "") + "t$";
		if (abs >= 1e9) return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + "b$";
		if (abs >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.00$/, "") + "m$";
		if (abs >= 1e3) return (amount / 1e3).toFixed(2).replace(/\.00$/, "") + "k$";
		return amount.toLocaleString() + "$";
	},

	onStart: async function ({ message, usersData, event, args, getLang }) {
		const senderID = event.senderID;

		// If sending money
		if (args[0] === "send") {
			// Check if amount is provided
			if (!args[1]) {
				return message.reply(getLang("missingAmount"));
			}

			const amount = parseInt(args[1]);
			
			// Validate amount
			if (isNaN(amount) || amount <= 0) {
				return message.reply(getLang("invalidAmount"));
			}

			if (amount < 1) {
				return message.reply(getLang("minAmount"));
			}

			// Check if user is tagged
			const mentions = Object.keys(event.mentions);
			if (mentions.length === 0) {
				return message.reply(getLang("missingUser"));
			}

			const receiverID = mentions[0];
			
			// Check if user is trying to send to themselves
			if (receiverID == senderID) {
				return message.reply(getLang("cantSendToSelf"));
			}

			try {
				// Get sender data
				const senderData = await usersData.get(senderID);
				if (!senderData) {
					return message.reply(getLang("userNotFound"));
				}

				// Check if sender has enough money
				if (senderData.money < amount) {
					return message.reply(
						`${getLang("notEnoughMoney")}\n💰 আপনার বর্তমান ব্যালেন্স: ${this.formatMoney(senderData.money)}`
					);
				}

				// Get receiver data
				const receiverData = await usersData.get(receiverID);
				if (!receiverData) {
					return message.reply(getLang("userNotFound"));
				}

				const receiverName = event.mentions[receiverID].replace("@", "");

				// Update balances
				await usersData.set(senderID, {
					money: senderData.money - amount
				});

				await usersData.set(receiverID, {
					money: receiverData.money + amount
				});

				// Send success message
				const successMsg = 
					`╔═══════════════════════════════\n` +
					`║ 💸 অর্থ স্থানান্তর সফল হয়েছে!\n` +
					`║─────────────────────────────\n` +
					`║ 👤 প্রেরক: ${await usersData.getName(senderID)}\n` +
					`║ 👥 গ্রহীতা: ${receiverName}\n` +
					`║ 💰 পরিমাণ: ${this.formatMoney(amount)}\n` +
					`║─────────────────────────────\n` +
					`║ 💳 আপনার নতুন ব্যালেন্স: ${this.formatMoney(senderData.money - amount)}\n` +
					`╚═══════════════════════════════`;

				return message.reply(successMsg);

			} catch (error) {
				console.error("Error in balance send:", error);
				return message.reply("❌ একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।");
			}
		}

		// If viewing others' balance
		if (Object.keys(event.mentions).length > 0) {
			const uids = Object.keys(event.mentions);
			let msg = "╔═══════════════════════════════\n║ 💰 ব্যালেন্স তথ্য\n║─────────────────────────────\n";
			
			for (const uid of uids) {
				try {
					const userData = await usersData.get(uid);
					const userName = event.mentions[uid].replace("@", "");
					const userMoney = userData ? userData.money || 0 : 0;
					msg += `║ 👤 ${userName}: ${this.formatMoney(userMoney)}\n`;
				} catch (error) {
					msg += `║ ❌ ${event.mentions[uid].replace("@", "")}: Data not found\n`;
				}
			}
			msg += "╚═══════════════════════════════";
			return message.reply(msg);
		}

		// If viewing own balance
		try {
			const userData = await usersData.get(senderID);
			const userMoney = userData ? userData.money || 0 : 0;
			const userName = await usersData.getName(senderID);
			
			const balanceMsg = 
				`╔═══════════════════════════════\n` +
				`║ 💰 আপনার ব্যালেন্স তথ্য\n` +
				`║─────────────────────────────\n` +
				`║ 👤 নাম: ${userName}\n` +
				`║ 💳 ব্যালেন্স: ${this.formatMoney(userMoney)}\n` +
				`║─────────────────────────────\n` +
				`║ 💡 টিপ: /bal send <amount> @user\n` +
				`║    দিয়ে অর্থ পাঠান\n` +
				`╚═══════════════════════════════`;

			return message.reply(balanceMsg);
			
		} catch (error) {
			console.error("Error getting user balance:", error);
			return message.reply("❌ ব্যালেন্স তথ্য পেতে সমস্যা হয়েছে।");
		}
	}
};
