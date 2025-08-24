module.exports = {
	config: {
		name: "balance",
		aliases: ["bal"],
		version: "2.0",
		author: "NTKhang & Modified by You",
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
				+ "\n   {pn} send <@tag> <số tiền>: chuyển tiền cho người được tag",
			en: "   {pn}: view your money"
				+ "\n   {pn} <@tag>: view the money of the tagged person"
				+ "\n   {pn} send <@tag> <amount>: send money to the tagged person"
		}
	},

	langs: {
		vi: {
			money: "Bạn đang có %1$",
			moneyOf: "%1 đang có %2$",
			missingAmount: "Vui lòng nhập số tiền cần chuyển.",
			notEnoughMoney: "Bạn không có đủ tiền để chuyển.",
			sendSuccess: "Đã chuyển %1$ cho %2.",
			invalidAmount: "Số tiền không hợp lệ."
		},
		en: {
			money: "You have %1$",
			moneyOf: "%1 has %2$",
			missingAmount: "Please enter the amount to send.",
			notEnoughMoney: "You don't have enough money to send.",
			sendSuccess: "Sent %1$ to %2.",
			invalidAmount: "Invalid amount."
		}
	},

	onStart: async function ({ message, usersData, event, args, getLang }) {
		// If sending money
		if (args[0] === "send") {
			const mentions = Object.keys(event.mentions);
			if (mentions.length === 0 || args.length < 3)
				return message.reply(getLang("missingAmount"));

			const receiverID = mentions[0];
			const amount = parseInt(args[2]);

			if (isNaN(amount) || amount <= 0)
				return message.reply(getLang("invalidAmount"));

			const senderID = event.senderID;
			const senderData = await usersData.get(senderID);
			const receiverName = event.mentions[receiverID].replace("@", "");

			if (senderData.money < amount)
				return message.reply(getLang("notEnoughMoney"));

			// Update balances
			await usersData.set(senderID, {
				money: senderData.money - amount
			});

			const receiverData = await usersData.get(receiverID);
			await usersData.set(receiverID, {
				money: receiverData.money + amount
			});

			return message.reply(getLang("sendSuccess", amount, receiverName));
		}

		// If viewing others' balance
		if (Object.keys(event.mentions).length > 0) {
			const uids = Object.keys(event.mentions);
			let msg = "";
			for (const uid of uids) {
				const userMoney = await usersData.get(uid, "money");
				msg += getLang("moneyOf", event.mentions[uid].replace("@", ""), userMoney) + '\n';
			}
			return message.reply(msg);
		}

		// If viewing own balance
		const userData = await usersData.get(event.senderID);
		message.reply(getLang("money", userData.money));
	}
};
