function sleep(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = {
	config: {
		name: "filteruser",
		version: "3.1",
		author: "Tohidul (Auto-confirm)",
		countDown: 5,
		role: 0,
		description: {
			en: "Filter group members by number of messages or locked account (no confirm needed)"
		},
		category: "box chat",
		guide: {
			en: "{pn} <number of messages> | die"
		}
	},

	langs: {
		en: {
			kickByBlock: "✅ | Removed %1 locked accounts",
			kickByMsg: "✅ | Removed %1 members with less than %2 messages",
			kickError: "❌ | Could not remove %1 members:\n%2",
			noBlock: "✅ | No locked accounts found",
			noMsg: "✅ | No members with less than %1 messages"
		}
	},

	onStart: async function ({ api, args, threadsData, message, event, getLang }) {
		const threadData = await threadsData.get(event.threadID);
		const botID = api.getCurrentUserID();

		if (!isNaN(args[0])) {
			const minMsg = Number(args[0]);
			const toKick = threadData.members.filter(member =>
				member.count < minMsg &&
				member.inGroup &&
				member.userID !== botID
			);

			const success = [], errors = [];

			for (const member of toKick) {
				try {
					await api.removeUserFromGroup(member.userID, event.threadID);
					success.push(member.userID);
				} catch (e) {
					errors.push(member.name);
				}
				await sleep(700);
			}

			let msg = "";
			if (success.length)
				msg += `${getLang("kickByMsg", success.length, minMsg)}\n`;
			if (errors.length)
				msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
			if (!success.length && !errors.length)
				msg += getLang("noMsg", minMsg);

			message.reply(msg);
		}

		else if (args[0] === "die") {
			const threadInfo = await api.getThreadInfo(event.threadID);
			const blocked = threadInfo.userInfo.filter(u => u.type !== "User");

			const success = [], errors = [];

			for (const user of blocked) {
				try {
					await api.removeUserFromGroup(user.id, event.threadID);
					success.push(user.id);
				} catch (e) {
					errors.push(user.name);
				}
				await sleep(700);
			}

			let msg = "";
			if (success.length)
				msg += `${getLang("kickByBlock", success.length)}\n`;
			if (errors.length)
				msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
			if (!success.length && !errors.length)
				msg += getLang("noBlock");

			message.reply(msg);
		}

		else {
			message.reply("❌ | Invalid usage. Try: filteruser <number> or filteruser die");
		}
	}
};
