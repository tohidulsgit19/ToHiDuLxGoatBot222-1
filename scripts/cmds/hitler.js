const DIG = require('discord-image-generation');
const https = require('https');
const fs = require('fs');

module.exports = {
  config: {
    name: 'hitler',
    version: '1.0',
    author: 'AceGun',
    description: 'Generates an image with Hitler effect applied to the user\'s avatar.',
    category: 'media',
    usage: '{prefix}hitler [@mention]',
  },

  onStart: async function ({ event, api }) {
    try {
      // জেনেরাল ইউজার id - ডিফল্ট: গ্রুপ থেকে র‍্যান্ডম
      let userID;

      // যদি মেনশন থাকে, ওকে নাও
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        userID = Object.keys(event.mentions)[0];
      } else {
        // না হলে গ্রুপ মেম্বার থেকে র্যান্ডম ইউজার নেওয়া
        const threadInfo = await api.getThreadInfo(event.threadID);
        const participants = threadInfo.participantIDs.filter(id => id !== api.getCurrentUserID()); // বট বাদে সবাই
        userID = participants[Math.floor(Math.random() * participants.length)];
      }

      // FB avatar url তৈরী
      const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // ছবি ডাউনলোড
      const avatar = await fetchImage(avatarUrl);

      // DIG দিয়ে ইফেক্ট তৈরি
      const hitlerImage = await new DIG.Hitler().getImage(avatar);

      // ফাইল পাথ
      const pathHitler = __dirname + '/cache/hitler.png';
      fs.writeFileSync(pathHitler, hitlerImage);

      // মেসেজ বডি - মেনশন থাকলে ট্যাগ করবো
      let bodyText = 'This guy is worse than Hitler!';
      let mentions = [];
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        const mentionID = Object.keys(event.mentions)[0];
        const mentionName = event.mentions[mentionID];
        bodyText = `This guy is worse than Hitler! (${mentionName})`;
        mentions.push({ id: mentionID, tag: mentionName });
      }

      // মেসেজ পাঠানো
      api.sendMessage({
        body: bodyText,
        mentions,
        attachment: fs.createReadStream(pathHitler)
      }, event.threadID, (err) => {
        if (err) return console.error(err);
        fs.unlinkSync(pathHitler); // ফাইল ডিলিট
      });

    } catch (e) {
      console.error(e);
      api.sendMessage('Something went wrong. Please try again later.', event.threadID);
    }
  }
};

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        fetchImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch image. Status code: ${res.statusCode}`));
        return;
      }
      let data = Buffer.from([]);
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}
