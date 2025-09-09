const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "NTKhang (Styled by YOU)",
		category: "events"
	},

	langs: {
		vi: {
			session1: "🌅 sÁnG",
			session2: "🌞 tRuA",
			session3: "🌇 cHiềU",
			session4: "🌙 tỐi",
			welcomeMessage: "🤖 𝓒ả𝓶 ơ𝓷 𝓫ạ𝓷 đã 𝓶ờ𝓲 𝓽ô𝓲 𝓿à𝓸 𝓷𝓱ó𝓶!\n✨ 𝓟𝓻𝓮𝓯𝓲𝔁: %1\n📜 𝓧𝓮𝓶 𝓵ệ𝓷𝓱: %1help",
			multiple1: "𝓫ạ𝓷 🧑",
			multiple2: "𝓬á𝓬 𝓫ạ𝓷 👥",
			defaultWelcomeMessage: "👋 𝓧𝓲𝓷 𝓬𝓱à𝓸 {userName}!\n🎉 𝓒𝓱à𝓸 𝓶ừ𝓷𝓰 {multiple} đế𝓷 𝓿ớ𝓲 𝓷𝓱ó𝓶: {boxName}\n💫 𝓒𝓱ú𝓬 𝓫ạ𝓷 𝓬ó 𝓫𝓾ổ𝓲 {session} 𝓿𝓾𝓲 𝓿ẻ!"
		},
		en: {
			session1: "🌅 𝓶𝓸𝓻𝓷𝓲𝓷𝓰",
			session2: "🌞 𝓷𝓸𝓸𝓷",
			session3: "🌇 𝓪𝓯𝓽𝓮𝓻𝓷𝓸𝓸𝓷",
			session4: "🌙 𝓮𝓿𝓮𝓷𝓲𝓷𝓰",
			welcomeMessage: "🤖 𝓣𝓱𝓪𝓷𝓴 𝔂𝓸𝓾 𝓯𝓸𝓻 𝓲𝓷𝓿𝓲𝓽𝓲𝓷𝓰 𝓶𝓮!\n✨ 𝓑𝓸𝓽 𝓟𝓻𝓮𝓯𝓲𝔁: %1\n📜 𝓣𝓸 𝓼𝓮𝓮 𝓬𝓸𝓶𝓶𝓪𝓷𝓭𝓼: %1help",
			multiple1: "𝔂𝓸𝓾 🧑",
			multiple2: "𝔂𝓸𝓾 𝓰𝓾𝔂𝓼 👥",
			defaultWelcomeMessage: "👋 𝓗𝓮𝓵𝓵𝓸 {userName}!\n🎉 𝓦𝓮𝓵𝓬𝓸𝓶𝓮 {multiple} 𝓽𝓸 𝓽𝓱𝓮 𝓰𝓻𝓸𝓾𝓹: {boxName}\n💫 𝓗𝓪𝓿𝓮 𝓪 𝓷𝓲𝓬𝓮 {session} 😊"
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;

				// If bot is added
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(getLang("welcomeMessage", prefix));
				}

				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				// Add new members
				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);

				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;

					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const userName = [], mentions = [];
					let multiple = dataAddedParticipants.length > 1;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}

					if (userName.length == 0) return;

					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

					const form = {
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
					};

					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
						.replace(/\{session\}/g,
							hours <= 10 ? getLang("session1")
								: hours <= 12 ? getLang("session2")
								: hours <= 18 ? getLang("session3")
								: getLang("session4")
						);

					form.body = welcomeMessage;

					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.map(file => drive.getFile(file, "stream"));
						form.attachment = (await Promise.allSettled(attachments))
							.filter(({ status }) => status == "fulfilled")
							.map(({ value }) => value);
					}

					message.send(form);
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
