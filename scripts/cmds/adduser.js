const axios = require("axios");

module.exports = {
	config: {
		name: "adduser",
		version: "3.0",
		author: "NTKhang | Modified by Tohidul",
		countDown: 5,
		role: 1,
		description: {
			en: "Add a member to group by reply, UID, or profile link"
		},
		category: "box chat",
		guide: {
			en: "{pn} [reply to user / UID / profile link]\nUse 'gc' after reply to add to main GC"
		}
	},

	langs: {
		en: {
			alreadyInGroup: "⚠️ User is already in the group.",
			successAdd: "✅ Successfully added user to the group.",
			successAddMain: "✅ Successfully added user to the main group.",
			approvalPending: "✅ User added to approval list (waiting for admin approval).",
			failedAdd: "❌ Failed to add user. They may have locked privacy settings or blocked the bot.",
			noInput: "❌ Please reply to a message, or provide UID/profile link."
		}
	},

	onStart: async function ({ api, event, args, threadsData, getLang, message }) {
		const botID = api.getCurrentUserID();
		const mainThreadID = "31629748789957921"; // <-- এখানে তোমার main GC threadID বসাও

		let targetUID;

		// --- 1. যদি reply থাকে ---
		if (event.type === "message_reply" && event.messageReply?.senderID) {
			targetUID = event.messageReply.senderID;

			// যদি args[0] == gc, তাহলে main GC তে add করবে
			if (args[0] && args[0].toLowerCase() === "gc") {
				return addToGroup(api, mainThreadID, targetUID, botID, getLang, message, true);
			}
		}

		// --- 2. যদি UID দেওয়া হয় ---
		else if (args[0] && /^\d+$/.test(args[0])) {
			targetUID = args[0];
		}

		// --- 3. যদি FB profile link দেওয়া হয় ---
		else if (args[0] && args[0].startsWith("http")) {
			try {
				const res = await axios.get(`https://api.samirxpikachu.xyz/fbgetid?url=${encodeURIComponent(args[0])}`);
				if (res.data && res.data.id) {
					targetUID = res.data.id;
				}
			} catch (err) {
				return message.reply("❌ Could not fetch UID from link.");
			}
		}

		// --- কিছুই না দিলে ---
		if (!targetUID) return message.reply(getLang("noInput"));

		// --- Default: current group এ add ---
		return addToGroup(api, event.threadID, targetUID, botID, getLang, message, false);
	}
};

// Function to add user to group
async function addToGroup(api, threadID, uid, botID, getLang, message, isMain) {
	try {
		const threadInfo = await api.getThreadInfo(threadID);

		if (threadInfo.participantIDs.includes(uid))
			return message.reply(getLang("alreadyInGroup"));

		await api.addUserToGroup(uid, threadID);

		if (threadInfo.approvalMode && !threadInfo.adminIDs.includes(botID))
			return message.reply(getLang("approvalPending"));

		return message.reply(isMain ? getLang("successAddMain") : getLang("successAdd"));
	} catch (err) {
		return message.reply(getLang("failedAdd"));
	}
}
