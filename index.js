const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');
const SunCalc = require('suncalc');

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(token);

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (n) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

async function sendMessage() {
    try {
        // ১. সময় এবং তারিখ সেটআপ
        const now = moment().tz("Asia/Dhaka");
        
        // বার এবং ইংরেজি তারিখ
        const dayName = now.locale('bn').format('dddd');
        const dateEng = now.locale('bn').format('D MMMM YYYY');
        
        // বাংলা ও হিজরি তারিখ (Intl API)
        const hijriDate = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-umalqura-nu-beng', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date());

        const banglaDate = new Intl.DateTimeFormat('bn-BD-u-ca-beng-nu-beng', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date());

        // ঋতু নির্ণয়
        const month = parseInt(now.format('M'));
        let season = "";
        if (month === 12 || month === 1) season = "শীতকাল ❄️";
        else if (month === 2 || month === 3) season = "বসন্তকাল 🌸";
        else if (month === 4 || month === 5) season = "গ্রীষ্মকাল ☀";
        else if (month === 6 || month === 7) season = "বর্ষাকাল 🌧";
        else if (month === 8 || month === 9) season = "শরৎকাল 🍂";
        else season = "হেমন্তকাল 🌾";

        // সূর্যোদয় ও সূর্যাস্ত
        const sunTimes = SunCalc.getTimes(now.toDate(), 23.8103, 90.4125);
        const sunrise = moment(sunTimes.sunrise).tz("Asia/Dhaka").locale('bn').format('hh:mm A');
        const sunset = moment(sunTimes.sunset).tz("Asia/Dhaka").locale('bn').format('hh:mm A');

        // ২. প্রফেশনাল মেসেজ ফরম্যাট (Markdown ব্যবহার করে)
        const message = `
🌙 **নিত্যদিনের আপডেট** 🌙
──────────────────

👋 **আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্**

🗓 **আজকের তারিখ:**
▫️ ইংরেজি: \`${dateEng}\`
▫️ বাংলা: \`${banglaDate}\`
▫️ হিজরি: \`${hijriDate}\`

🌤 **প্রকৃতি ও সময়:**
▫️ আজকের বার: **${dayName}**
▫️ ঋতু: ${season}

🌞 **সূর্যের সময়সূচি (ঢাকা):**
⬆️ সূর্যোদয়: \`${sunrise}\`
⬇️ সূর্যাস্ত: \`${sunset}\`

✨ _আপনার দিনটি বরকতময় হোক!_
──────────────────
`;

        // ৩. মেসেজ পাঠানো (parse_mode: 'Markdown' খুবই গুরুত্বপূর্ণ)
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        
        console.log("Professional message sent!");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

sendMessage();
  
