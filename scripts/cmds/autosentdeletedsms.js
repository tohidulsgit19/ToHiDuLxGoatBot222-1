
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "cache", "unsentMessages.json");
const CONFIG_FILE = path.join(__dirname, "..", "cache", "unsentConfig.json");
const DELETE_AFTER = 30 * 60 * 1000; // 30 minutes

// Target thread ID - add your group thread ID here
let TARGET_THREAD_ID = "9826242237455305";

// Ensure cache file exists
function ensureCacheFile() {
  const folder = path.dirname(CACHE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}");
}

// Config file functions
function ensureConfigFile() {
  const folder = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ targetThreadID: "9826242237455305" }, null, 2));
  }
}

function loadConfig() {
  ensureConfigFile();
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    TARGET_THREAD_ID = config.targetThreadID || "9826242237455305";
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    TARGET_THREAD_ID = "9826242237455305";
    return { targetThreadID: "9826242237455305" };
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    TARGET_THREAD_ID = config.targetThreadID;
  } catch (error) {
    console.error("Error saving config:", error);
  }
}

function loadStore() {
  ensureCacheFile();
  try {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data) || {};
  } catch (error) {
    console.error("Error loading unsent store:", error);
    return {};
  }
}

function saveStore(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving unsent store:", error);
  }
}

// Bengali time format
function formatTime(date) {
  try {
    const options = {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Dhaka'
    };
    return new Intl.DateTimeFormat('bn-BD', options).format(date);
  } catch (error) {
    return new Date(date).toLocaleString();
  }
}

// Get attachment type in Bengali
function getAttachmentType(attachment) {
  if (!attachment || !attachment.type) return '📎 সংযুক্তি';
  
  const type = attachment.type.toLowerCase();
  switch (type) {
    case 'photo': 
    case 'image': 
      return '📸 ছবি';
    case 'video': 
      return '🎥 ভিডিও';  
    case 'audio': 
    case 'voice': 
      return '🎵 অডিও';
    case 'file': 
      return '📄 ফাইল';
    case 'sticker': 
      return '😀 স্টিকার';
    case 'animated_image': 
    case 'gif': 
      return '🎭 GIF';
    default: 
      return '📎 সংযুক্তি';
  }
}

// Get user info safely
async function getUserInfo(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo && userInfo[userID] ? userInfo[userID].name : `User ${userID}`;
  } catch (error) {
    return `User ${userID}`;
  }
}

// Safe cleanup function
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("File cleanup error:", error.message);
  }
}

module.exports = {
  config: {
    name: "autosentdeletedsms",
    version: "8.0",
    author: "Tohidul (Photo/Image Fixed Version)",
    shortDescription: "Auto detect unsent messages with photo support",
    longDescription: "Automatically detects and logs unsent messages including photos, images and all attachments in Bengali",
    category: "utility",
    guide: {
      en: "This command automatically tracks all unsent messages including photos and images.\n\nCommands:\n- setgc <threadID> - Set target group for unsend reports\n- checkgc - Check current target group\n- removegc - Remove target group (send to original thread)",
      vi: "Tự động theo dõi và ghi lại các tin nhắn bị thu hồi bao gồm cả hình ảnh."
    }
  },

  // Initialize system when bot starts
  onStart: async function ({ api, args, message, event }) {
    // Handle commands
    if (args[0]) {
      const command = args[0].toLowerCase();
      
      if (command === "setgc") {
        const threadID = args[1];
        if (!threadID || !/^\d+$/.test(threadID)) {
          return message.reply("❌ সঠিক Thread ID দিন!\nউদাহরণ: setgc 123456789");
        }
        
        try {
          // Check if thread exists and bot has access
          await api.getThreadInfo(threadID);
          const config = { targetThreadID: threadID };
          saveConfig(config);
          
          return message.reply(`✅ সফলভাবে টার্গেট গ্রুপ সেট করা হয়েছে!\n🆔 Thread ID: ${threadID}\n\nএখন সব unsend রিপোর্ট এই গ্রুপে পাঠানো হবে।`);
        } catch (error) {
          return message.reply("❌ অবৈধ Thread ID বা বট এই গ্রুপে নেই!");
        }
      }
      
      if (command === "checkgc") {
        const config = loadConfig();
        if (!config.targetThreadID) {
          return message.reply("❌ কোনো টার্গেট গ্রুপ সেট করা হয়নি।\n\nসেট করতে: setgc <threadID>");
        }
        
        try {
          const threadInfo = await api.getThreadInfo(config.targetThreadID);
          return message.reply(`📋 বর্তমান টার্গেট গ্রুপ:\n🆔 ID: ${config.targetThreadID}\n📝 নাম: ${threadInfo.threadName || 'নাম নেই'}\n👥 সদস্য: ${threadInfo.participantIDs.length} জন`);
        } catch (error) {
          return message.reply(`⚠️ টার্গেট গ্রুপ: ${config.targetThreadID}\n❌ গ্রুপ অ্যাক্সেস করা যাচ্ছে না!`);
        }
      }
      
      if (command === "removegc") {
        const config = { targetThreadID: null };
        saveConfig(config);
        return message.reply("✅ টার্গেট গ্রুপ রিমুভ করা হয়েছে!\nএখন unsend রিপোর্ট মূল গ্রুপেই পাঠানো হবে।");
      }
      
      return message.reply("❌ অজানা কমান্ড!\n\nব্যবহার:\n- setgc <threadID>\n- checkgc\n- removegc");
    }
    
    ensureCacheFile();
    loadConfig(); // Load target thread ID
    
    // Clean old messages every 60 seconds
    setInterval(() => {
      const store = loadStore();
      let changed = false;
      const now = Date.now();
      
      for (const id in store) {
        if (now - store[id].timestamp > DELETE_AFTER) {
          delete store[id];
          changed = true;
        }
      }
      
      if (changed) {
        saveStore(store);
        console.log(`🧹 পুরানো unsend রেকর্ড পরিষ্কার করা হয়েছে`);
      }
    }, 60000);

    console.log("✅ Enhanced Auto Unsend Detector সিস্টেম চালু হয়েছে!");
    if (TARGET_THREAD_ID) {
      console.log(`📍 Target Group: ${TARGET_THREAD_ID}`);
    }
  },

  // Store all messages
  onChat: async function ({ event, api }) {
    // Only process valid message events
    if (!event || !event.messageID || event.type !== "message") return;
    
    const store = loadStore();
    
    // Get user info safely
    let senderName = "Unknown User";
    try {
      senderName = await getUserInfo(api, event.senderID);
    } catch (error) {
      senderName = `User ${event.senderID}`;
    }

    // Enhanced attachment processing - IMPROVED for photos/images
    let processedAttachments = [];
    if (event.attachments && Array.isArray(event.attachments) && event.attachments.length > 0) {
      processedAttachments = event.attachments.map((att, index) => {
        if (!att) return null;
        
        // Collect all possible URL sources for better success rate
        const urlSources = [
          att.url,
          att.previewUrl, 
          att.largePreview,
          att.thumbnailUrl,
          att.hiresUrl,
          att.preview_url,
          att.large_preview_url,
          att.thumbnail_url,
          att.hires_url
        ].filter(url => url && typeof url === 'string');
        
        return {
          type: att.type || 'unknown',
          url: urlSources[0] || null, // Primary URL
          previewUrl: att.previewUrl || att.preview_url || null,
          largePreview: att.largePreview || att.large_preview_url || null,
          thumbnailUrl: att.thumbnailUrl || att.thumbnail_url || null,
          hiresUrl: att.hiresUrl || att.hires_url || null,
          filename: att.filename || `attachment_${Date.now()}_${index}`,
          ID: att.ID || att.id || null,
          width: att.width || null,
          height: att.height || null,
          size: att.size || null,
          allUrls: urlSources // Keep all URLs for fallback
        };
      }).filter(att => att !== null && (att.url || att.allUrls.length > 0));
    }

    // Store message data - FIXED mentions handling
    store[event.messageID] = {
      senderID: event.senderID,
      senderName: senderName,
      threadID: event.threadID,
      body: event.body || "",
      attachments: processedAttachments,
      mentions: event.mentions || {}, // Always ensure it's an object
      timestamp: Date.now(),
      messageReply: event.messageReply || null,
      isGroup: event.isGroup || false,
      originalEvent: {
        type: event.type,
        logMessageType: event.logMessageType || null,
        logMessageData: event.logMessageData || null
      }
    };
    
    // Debug log for all attachment types
    if (processedAttachments.length > 0) {
      const types = processedAttachments.map(att => att.type).join(', ');
      console.log(`📎 Message with attachments stored: ${event.messageID} from ${senderName} (${types})`);
    }
    
    saveStore(store);
  },

  // Handle any event - this is key for catching unsend events
  onAnyEvent: async function ({ api, event }) {
    // Only handle message_unsend events
    if (event.type !== "message_unsend") return;

    console.log(`🚨 Unsend detected: ${event.messageID}`);

    const store = loadStore();
    const savedMsg = store[event.messageID];
    
    // Check if we have the message stored
    if (!savedMsg) {
      console.log(`⚠️ No saved message found for: ${event.messageID}`);
      return;
    }

    // Skip if the unsend is by the bot itself
    const botID = api.getCurrentUserID();
    if (savedMsg.senderID === botID) {
      console.log(`🤖 Bot unsend detected, skipping report: ${event.messageID}`);
      delete store[event.messageID];
      saveStore(store);
      return;
    }

    // Check if message is too old
    if (Date.now() - savedMsg.timestamp > DELETE_AFTER) {
      console.log(`⚠️ Message too old: ${event.messageID}`);
      delete store[event.messageID];
      saveStore(store);
      return;
    }

    try {
      // Create report message - FIXED null handling
      let reportMsg = `🚨 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱 🚨\n`;
      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportMsg += `👤 প্রেরক: ${savedMsg.senderName || 'Unknown User'}\n`;
      reportMsg += `🆔 ইউজার আইডি: ${savedMsg.senderID || 'Unknown'}\n`;
      reportMsg += `🕒 সময়: ${formatTime(new Date())}\n`;
      reportMsg += `📨 মেসেজ আইডি: ${event.messageID || 'Unknown'}\n`;
      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // Add message content - FIXED null handling
      if (savedMsg.body && String(savedMsg.body).trim()) {
        reportMsg += `📝 মেসেজ:\n"${String(savedMsg.body)}"\n\n`;
      } else {
        reportMsg += `📝 মেসেজ: [খালি বা মিডিয়া মেসেজ]\n\n`;
      }

      // Add mentions - FIXED to handle null/undefined safely
      if (savedMsg.mentions && typeof savedMsg.mentions === 'object' && savedMsg.mentions !== null) {
        try {
          const mentionEntries = Object.entries(savedMsg.mentions);
          if (mentionEntries.length > 0) {
            reportMsg += `👥 উল্লেখিত ব্যক্তিরা:\n`;
            for (const [uid, name] of mentionEntries) {
              if (name && uid) {
                reportMsg += `• ${String(name).replace('@', '')} (${uid})\n`;
              }
            }
            reportMsg += `\n`;
          }
        } catch (mentionError) {
          console.error("Mention processing error:", mentionError.message);
        }
      }

      // Add reply info - FIXED null handling
      if (savedMsg.messageReply && savedMsg.messageReply.body) {
        reportMsg += `↩️ রিপ্লাই করা মেসেজ: "${String(savedMsg.messageReply.body)}"\n\n`;
      }

      // Handle attachments - ENHANCED with better photo/image support
      const attachmentFiles = [];
      if (savedMsg.attachments && Array.isArray(savedMsg.attachments) && savedMsg.attachments.length > 0) {
        reportMsg += `📎 সংযুক্তি: ${savedMsg.attachments.length}টি\n`;
        
        for (let i = 0; i < Math.min(savedMsg.attachments.length, 10); i++) {
          const att = savedMsg.attachments[i];
          if (!att) continue;
          
          const attType = getAttachmentType(att);
          reportMsg += `${i + 1}. ${attType}\n`;
          
          // Enhanced URL collection for photos/images
          const possibleUrls = [
            att.url,
            att.previewUrl, 
            att.largePreview,
            att.hiresUrl,
            att.thumbnailUrl,
            att.preview_url,
            att.large_preview_url,
            att.hires_url,
            att.thumbnail_url
          ].filter(url => url && typeof url === 'string' && url.length > 0);
          
          let downloaded = false;
          
          // Try downloading from each URL
          for (const url of possibleUrls) {
            if (downloaded) break;
            
            try {
              console.log(`📥 Downloading ${attType} ${i} from: ${url.substring(0, 100)}...`);
              
              const response = await axios.get(url, { 
                responseType: "arraybuffer",
                timeout: 20000, // Increased timeout
                maxContentLength: 100 * 1024 * 1024, // 100MB limit
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'image/*, video/*, audio/*, */*',
                  'Accept-Encoding': 'gzip, deflate, br',
                  'Connection': 'keep-alive'
                }
              });
              
              if (response.data && response.data.byteLength > 0) {
                // Better extension detection
                let ext = '.bin';
                
                // Try to get extension from URL first
                try {
                  const urlPath = new URL(url).pathname;
                  const urlExt = path.extname(urlPath).toLowerCase();
                  if (urlExt && urlExt.length > 1) {
                    ext = urlExt;
                  }
                } catch (urlError) {
                  // Fallback to content-type
                  const contentType = response.headers['content-type'] || '';
                  if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) ext = '.jpg';
                  else if (contentType.includes('image/png')) ext = '.png';
                  else if (contentType.includes('image/gif')) ext = '.gif';
                  else if (contentType.includes('image/webp')) ext = '.webp';
                  else if (contentType.includes('video/mp4')) ext = '.mp4';
                  else if (contentType.includes('video/')) ext = '.mp4';
                  else if (contentType.includes('audio/')) ext = '.mp3';
                  else if (contentType.includes('image/')) ext = '.jpg';
                }
                
                const fileName = `unsend_${Date.now()}_${i}${ext}`;
                const filePath = path.join(__dirname, "..", "cache", fileName);
                
                // Write file
                await fs.writeFile(filePath, response.data);
                
                // Verify file and add to attachment list
                if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                  attachmentFiles.push(fs.createReadStream(filePath));
                  downloaded = true;
                  const sizeKB = (response.data.byteLength / 1024).toFixed(1);
                  reportMsg += `  ✅ ডাউনলোড সফল (${sizeKB}KB) - ${ext.toUpperCase()}\n`;
                  
                  // Set cleanup for this specific file
                  setTimeout(() => cleanupFile(filePath), 15000);
                } else {
                  cleanupFile(filePath);
                  reportMsg += `  ❌ ফাইল সেভ ব্যর্থ\n`;
                }
              } else {
                reportMsg += `  ❌ খালি ফাইল রেসপন্স\n`;
              }
              
            } catch (downloadError) {
              const errorMsg = downloadError.message || 'Unknown error';
              console.error(`❌ Attachment ${i} download error from ${url.substring(0, 50)}:`, errorMsg);
              reportMsg += `  ❌ ডাউনলোড ব্যর্থ: ${errorMsg.substring(0, 30)}\n`;
            }
          }
          
          if (!downloaded) {
            reportMsg += `  ⚠️ সব URL থেকে ডাউনলোড ব্যর্থ (${possibleUrls.length} টি চেষ্টা)\n`;
            
            // Debug info for failed downloads
            if (possibleUrls.length > 0) {
              console.log(`Failed URLs for attachment ${i}:`, possibleUrls.map(u => u.substring(0, 100)));
            }
          }
        }
        
        if (savedMsg.attachments.length > 10) {
          reportMsg += `... এবং আরো ${savedMsg.attachments.length - 10}টি সংযুক্তি\n`;
        }
        reportMsg += `\n`;
      }

      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // Prepare message options - ENHANCED
      const messageOptions = {
        body: reportMsg.trim() // Remove any trailing whitespace
      };

      // Only add attachments if we have valid ones
      if (attachmentFiles.length > 0) {
        messageOptions.attachment = attachmentFiles;
        console.log(`📎 Adding ${attachmentFiles.length} attachments to unsend report`);
      }

      // Send report to target thread or same thread
      const targetThreadID = TARGET_THREAD_ID || savedMsg.threadID;
      
      // Add source group info if sending to different thread
      if (TARGET_THREAD_ID && TARGET_THREAD_ID !== savedMsg.threadID) {
        try {
          const sourceThreadInfo = await api.getThreadInfo(savedMsg.threadID);
          const sourceGroupName = sourceThreadInfo.threadName || `Group ${savedMsg.threadID}`;
          
          // Update message with source info
          messageOptions.body = reportMsg + `🏠 সোর্স গ্রুপ: ${sourceGroupName}\n🆔 গ্রুপ আইডি: ${savedMsg.threadID}\n`;
          messageOptions.body += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          messageOptions.body += `⚡ Enhanced Unsend Detector v8.0\n`;
          messageOptions.body += `🛡️ ছবি ও মিডিয়া সহ সব মেসেজ ট্র্যাক!`;
        } catch (error) {
          console.error("Error getting source thread info:", error);
          messageOptions.body += `⚡ Enhanced Unsend Detector v8.0\n`;
          messageOptions.body += `🛡️ ছবি ও মিডিয়া সহ সব মেসেজ ট্র্যাক!`;
        }
      } else {
        messageOptions.body += `⚡ Enhanced Unsend Detector v8.0\n`;
        messageOptions.body += `🛡️ ছবি ও মিডিয়া সহ সব মেসেজ ট্র্যাক!`;
      }

      // Ensure message body is not empty or just whitespace
      if (!messageOptions.body || messageOptions.body.trim().length === 0) {
        messageOptions.body = `🚨 Unsend Detected!\n👤 ${savedMsg.senderName || 'Unknown'}\n📝 Content recovery failed`;
      }
      
      // Send the report
      try {
        const info = await api.sendMessage(messageOptions, targetThreadID);
        console.log(`✅ Unsend report sent successfully: ${event.messageID} with ${attachmentFiles.length} attachments`);
        
        // Clean up files after a delay
        setTimeout(() => {
          attachmentFiles.forEach(file => {
            if (file && file.path) {
              cleanupFile(file.path);
            }
          });
        }, 20000); // Increased delay
        
      } catch (sendError) {
        console.error("Report send error:", sendError.message);
        
        // Clean up files immediately on error
        attachmentFiles.forEach(file => {
          if (file && file.path) {
            cleanupFile(file.path);
          }
        });
        
        // Enhanced fallback for different error types
        try {
          let fallbackMsg = `🚨 Unsend Alert!\n`;
          fallbackMsg += `👤 ${savedMsg.senderName || 'Unknown User'}\n`;
          fallbackMsg += `🆔 ${savedMsg.senderID || 'Unknown'}\n`;
          fallbackMsg += `📝 "${String(savedMsg.body || 'মিডিয়া কন্টেন্ট').substring(0, 100)}"\n`;
          
          if (savedMsg.attachments && savedMsg.attachments.length > 0) {
            fallbackMsg += `📎 ${savedMsg.attachments.length}টি সংযুক্তি (ডাউনলোড ব্যর্থ)\n`;
            // Add attachment types info
            const types = savedMsg.attachments.map(att => getAttachmentType(att)).join(', ');
            fallbackMsg += `📋 প্রকার: ${types}\n`;
          }
          
          const fallbackTargetID = TARGET_THREAD_ID || savedMsg.threadID;
          if (TARGET_THREAD_ID && TARGET_THREAD_ID !== savedMsg.threadID) {
            fallbackMsg += `🏠 From Group: ${savedMsg.threadID}`;
          }
          
          await api.sendMessage(fallbackMsg, fallbackTargetID);
          console.log(`📤 Fallback message sent for: ${event.messageID}`);
          
        } catch (fallbackError) {
          console.error("Fallback message error:", fallbackError.message);
          
          // Last resort: very simple message
          try {
            const simpleMsg = `🚨 Unsend: ${savedMsg.senderName || 'User'} - ${savedMsg.attachments?.length || 0} files`;
            const lastTargetID = TARGET_THREAD_ID || savedMsg.threadID;
            await api.sendMessage(simpleMsg, lastTargetID);
            console.log(`📤 Simple fallback sent for: ${event.messageID}`);
          } catch (simpleError) {
            console.error("Simple fallback failed:", simpleError.message);
          }
        }
      }

      // Remove from store
      delete store[event.messageID];
      saveStore(store);

    } catch (error) {
      console.error("Handler error:", error.message, error.stack);
      
      // Emergency fallback - FIXED to avoid null conversion
      try {
        let emergencyMsg = `🚨 Unsend Alert!\n`;
        emergencyMsg += `👤 ${savedMsg.senderName || 'Unknown User'}\n`;
        emergencyMsg += `🆔 ${savedMsg.senderID}\n`;
        emergencyMsg += `📝 "${savedMsg.body || 'Content not available'}"\n`;
        emergencyMsg += `📎 ${(savedMsg.attachments && savedMsg.attachments.length) || 0} attachments\n`;
        
        const emergencyTargetID = TARGET_THREAD_ID || savedMsg.threadID;
        if (TARGET_THREAD_ID && TARGET_THREAD_ID !== savedMsg.threadID) {
          emergencyMsg += `🏠 From Group: ${savedMsg.threadID}`;
        }
        
        await api.sendMessage(emergencyMsg, emergencyTargetID);
        console.log(`🆘 Emergency message sent for: ${event.messageID}`);
        
      } catch (emergencyError) {
        console.error("Emergency fallback error:", emergencyError.message);
      } finally {
        // Always clean up store
        delete store[event.messageID];
        saveStore(store);
      }
    }
  }
};
