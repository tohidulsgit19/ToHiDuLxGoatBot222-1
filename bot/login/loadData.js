const chalk = require('chalk');
const path = require('path');
const { log, createOraDots, getText } = global.utils;

module.exports = async function (api, createLine) {
	// ———————————————————— LOAD DATA ———————————————————— //
	console.log(chalk.hex("#f5ab00")(createLine("DATABASE")));
	const controller = await require(path.join(__dirname, '..', '..', 'database/controller/index.js'))(api); // data is loaded here
	const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, sequelize } = controller;
	log.info('DATABASE', getText('loadData', 'loadThreadDataSuccess', global.db.allThreadData.filter(t => t.threadID.toString().length > 15).length));
	log.info('DATABASE', getText('loadData', 'loadUserDataSuccess', global.db.allUserData.length));
	if (api && global.GoatBot.config.database.autoSyncWhenStart == true) {
		console.log(chalk.hex("#f5ab00")(createLine("AUTO SYNC")));
		const spin = createOraDots(getText('loadData', 'refreshingThreadData'));
		try {
			api.setOptions({
				logLevel: 'silent'
			});
			spin._start();
			const threadDataWillSet = [];
			const allThreadData = [...global.db.allThreadData];

			// Add retry logic and better error handling with timeout
			let allThreadInfo;
			let retryCount = 0;
			const maxRetries = 3;

			while (retryCount < maxRetries) {
				try {
					// Set timeout for the request
					const timeoutPromise = new Promise((_, reject) => {
						setTimeout(() => reject(new Error('Request timeout')), 15000);
					});

					allThreadInfo = await Promise.race([
						api.getThreadList(50, null, 'INBOX'), // Further reduced limit for better compatibility
						timeoutPromise
					]);
					break; // Success, exit retry loop
				} catch (syncError) {
					retryCount++;
					log.warn('DATABASE', `Auto sync attempt ${retryCount} failed: ${syncError.message}`);

					if (retryCount >= maxRetries) {
						spin._stop();
						log.warn('DATABASE', 'Auto sync failed after multiple attempts. Continuing without sync...');
						log.info('DATABASE', 'Your MongoDB data is still intact and will be used normally.');
						return {
							threadModel: threadModel || null,
							userModel: userModel || null,
							dashBoardModel: dashBoardModel || null,
							globalModel: globalModel || null,
							threadsData,
							usersData,
							dashBoardData,
							globalData,
							sequelize
						};
					}

					// Wait before retry
					await new Promise(resolve => setTimeout(resolve, 2000));
				}
			}
			log.info('DATABASE', `Found ${allThreadInfo.length} threads from Facebook API`);
			let newGroups = 0;
			let updatedGroups = 0;

			for (const threadInfo of allThreadInfo) {
				if (threadInfo.isGroup) {
					const existingThread = allThreadData.find(thread => thread.threadID === threadInfo.threadID);
					if (!existingThread) {
						threadDataWillSet.push(await threadsData.create(threadInfo.threadID, threadInfo));
						newGroups++;
					} else {
						const threadRefreshed = await threadsData.refreshInfo(threadInfo.threadID, threadInfo);
						allThreadData.splice(allThreadData.findIndex(thread => thread.threadID === threadInfo.threadID), 1);
						threadDataWillSet.push(threadRefreshed);
						updatedGroups++;
					}
					global.db.receivedTheFirstMessage[threadInfo.threadID] = true;
				}
			}

			log.info('DATABASE', `Sync complete: ${newGroups} new groups added, ${updatedGroups} groups updated`);

			const allThreadDataDontHaveBot = allThreadData.filter(thread => !allThreadInfo.some(thread1 => thread.threadID === thread1.threadID));
			const botID = api.getCurrentUserID();
			for (const thread of allThreadDataDontHaveBot) {
				const findMe = thread.members.find(m => m.userID == botID);
				if (findMe) {
					findMe.inGroup = false;
					await threadsData.set(thread.threadID, { members: thread.members });
				}
			}
			global.db.allThreadData = [
				...threadDataWillSet,
				...allThreadDataDontHaveBot
			];
			spin._stop();
			log.info('DATABASE', getText('loadData', 'refreshThreadDataSuccess', global.db.allThreadData.filter(t => t.isGroup).length));
			log.info('DATABASE', `Total groups in database: ${global.db.allThreadData.filter(t => t.isGroup).length}`);
		}
		catch (err) {
			spin._stop();
			log.error('DATABASE', getText('loadData', 'refreshThreadDataError'), err);
		}
		finally {
			api.setOptions({
				logLevel: global.GoatBot.config.optionsFca.logLevel
			});
		}
	}
	// ————————————— ——————————— ———————————— ——————————— //
	// ———————————————————————————————————————————————————————————————————— //
	//                         SYNC WHITELIST DATA                        //
	// ———————————————————————————————————————————————————————————————————— //

	const syncWhitelistData = require("./syncWhitelistData.js");
	await syncWhitelistData();

	// ———————————————————————————————————————————————————————————————————— //
	//                            LOAD COMMANDS                           //
	// ———————————————————————————————————————————————————————————————————— //
	return {
		threadModel: threadModel || null,
		userModel: userModel || null,
		dashBoardModel: dashBoardModel || null,
		globalModel: globalModel || null,
		threadsData,
		usersData,
		dashBoardData,
		globalData,
		sequelize
	};
};