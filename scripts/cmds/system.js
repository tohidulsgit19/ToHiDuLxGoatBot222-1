const si = require('systeminformation');
const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: "system",
    aliases: [],
    version: "1.0",
    author: "fixedByChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Show system stats",
    longDescription: "Get CPU, RAM, Disk, and OS info",
    category: "utility",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const timeStart = Date.now();

    try {
      const cpuInfo = await si.cpu();
      const tempInfo = await si.cpuTemperature();
      const loadInfo = await si.currentLoad();
      const diskInfo = await si.diskLayout();
      const memInfo = await si.mem();
      const osInfo = await si.osInfo();

      const totalMem = this.formatBytes(memInfo.total);
      const availableMem = this.formatBytes(memInfo.available);
      const diskSize = this.formatBytes(diskInfo[0].size);

      const uptime = process.uptime();
      const hours = String(Math.floor(uptime / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
      const seconds = String(Math.floor(uptime % 60)).padStart(2, '0');

      const systemInfo = 
`𝗦𝘆𝘀𝘁𝗲𝗺 𝗜𝗻𝗳𝗼 🖥️
━━━━━━━━━━━━━━━━
🧠 CPU: ${cpuInfo.manufacturer} ${cpuInfo.brand} ${cpuInfo.speed}GHz
🧩 Cores: ${cpuInfo.physicalCores}, Threads: ${cpuInfo.cores}
🌡️ Temp: ${tempInfo.main || "N/A"}°C
📊 CPU Load: ${loadInfo.currentLoad.toFixed(1)}%

🧬 RAM:
- Total: ${totalMem}
- Available: ${availableMem}

💽 Disk:
- Model: ${diskInfo[0].name}
- Size: ${diskSize}
- Type: ${diskInfo[0].type}

🧾 OS: ${osInfo.platform} (${osInfo.build})
🕓 Uptime: ${hours}:${minutes}:${seconds}
⚡ Ping: ${Date.now() - timeStart}ms`;

      const link = [
        "https://i.imgur.com/u1WkhXi.jpg",
        "https://i.imgur.com/zuUMUDp.jpg",
        "https://i.imgur.com/skHrcq9.jpg",
        "https://i.imgur.com/TE9tH8w.jpg",
        "https://i.imgur.com/on9p0FK.jpg",
        "https://i.imgur.com/mriBW5m.jpg",
        "https://i.imgur.com/ju7CyHo.jpg",
        "https://i.imgur.com/KJunp2s.jpg",
        "https://i.imgur.com/6knPOgd.jpg",
        "https://i.imgur.com/Nxcbwxk.jpg",
        "https://i.imgur.com/FgtghTN.jpg"
      ];

      const imgPath = __dirname + "/cache/system.jpg";
      const randomImg = link[Math.floor(Math.random() * link.length)];

      request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage(
            {
              body: systemInfo,
              attachment: fs.createReadStream(imgPath)
            },
            event.threadID,
            () => fs.unlinkSync(imgPath),
            event.messageID
          );
        });

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ সিস্টেম তথ্য আনতে সমস্যা হয়েছে!", event.threadID);
    }
  },

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }
};
