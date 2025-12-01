const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');
const SunCalc = require('suncalc');
const { Coordinates, CalculationMethod, PrayerTimes, Madhab } = require('adhan');

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(token);

// ১. বাংলা সংখ্যায় রূপান্তর
const toBengaliNumber = (n) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

// ২. বাংলা তারিখ বের করার ফাংশন
function getBanglaDate(date) {
    const months = ["বৈশাখ", "জৈষ্ঠ্য", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    const year = date.getFullYear();
    
    // পহেলা বৈশাখ বছরের কত তম দিন? ( লিপ ইয়ার লজিক সহ )
    let banglaNewYearDayOfYear = 31 + 28 + 31 + 13;
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        banglaNewYearDayOfYear = 31 + 29 + 31 + 13;
    }

    const startOfYear = new Date(year, 0, 1);
    const diff = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    
    let banglaYear = diff >= banglaNewYearDayOfYear ? year - 593 : year - 594;
    
    // সিম্পল বাংলা তারিখ ম্যাপিং (Bangladesh Standard)
    const day = date.getDate();
    const month = date.getMonth(); 
    let banglaMonthIndex = 0;
    let banglaDay = 0;

    if (month === 0) { banglaMonthIndex = day <= 13 ? 8 : 9; banglaDay = day <= 13 ? day + 17 : day - 13; }
    else if (month === 1) { banglaMonthIndex = day <= 12 ? 9 : 10; banglaDay = day <= 12 ? day + 17 : day - 12; }
    else if (month === 2) { banglaMonthIndex = day <= 14 ? 10 : 11; banglaDay = day <= 14 ? day + 15 : day - 14; }
    else if (month === 3) { banglaMonthIndex = day <= 13 ? 11 : 0; banglaDay = day <= 13 ? day + 16 : day - 13; }
    else if (month === 4) { banglaMonthIndex = day <= 14 ? 0 : 1; banglaDay = day <= 14 ? day + 17 : day - 14; }
    else if (month === 5) { banglaMonthIndex = day <= 14 ? 1 : 2; banglaDay = day <= 14 ? day + 17 : day - 14; }
    else if (month === 6) { banglaMonthIndex = day <= 15 ? 2 : 3; banglaDay = day <= 15 ? day + 16 : day - 15; }
    else if (month === 7) { banglaMonthIndex = day <= 15 ? 3 : 4; banglaDay = day <= 15 ? day + 16 : day - 15; }
    else if (month === 8) { banglaMonthIndex = day <= 15 ? 4 : 5; banglaDay = day <= 15 ? day + 16 : day - 15; }
    else if (month === 9) { banglaMonthIndex = day <= 15 ? 5 : 6; banglaDay = day <= 15 ? day + 15 : day - 15; }
    else if (month === 10) { banglaMonthIndex = day <= 14 ? 6 : 7; banglaDay = day <= 14 ? day + 15 : day - 14; }
    else if (month === 11) { banglaMonthIndex = day <= 14 ? 7 : 8; banglaDay = day <= 14 ? day + 15 : day - 14; }

    return `${toBengaliNumber(banglaDay)} ${months[banglaMonthIndex]} ${toBengaliNumber(banglaYear)}`;
}

async function sendMessage() {
    try {
        const now = moment().tz("Asia/Dhaka");
        const dateObj = new Date(now.format());

        // ১. সাধারণ তারিখ ও সময়
        const dayName = now.locale('bn').format('dddd');
        const dateEng = now.locale('bn').format('D MMMM YYYY');
        const banglaDate = getBanglaDate(dateObj);
        
        // হিজরি তারিখ
        const hijriDate = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-umalqura-nu-beng', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date()).replace(' হিজরি', '').replace(' যুগ', '');

        // ঋতু
        const month = parseInt(now.format('M'));
        let season = "";
        if (month === 12 || month === 1) season = "শীতকাল ❄️";
        else if (month === 2 || month === 3) season = "বসন্তকাল 🌸";
        else if (month === 4 || month === 5) season = "গ্রীষ্মকাল ☀";
        else if (month === 6 || month === 7) season = "বর্ষাকাল 🌧";
        else if (month === 8 || month === 9) season = "শরৎকাল 🍂";
        else season = "হেমন্তকাল 🌾";

        // সূর্যোদয় ও সূর্যাস্ত (SunCalc)
        const sunTimes = SunCalc.getTimes(now.toDate(), 23.8103, 90.4125);
        const sunrise = moment(sunTimes.sunrise).tz("Asia/Dhaka").locale('bn').format('hh:mm');
        const sunset = moment(sunTimes.sunset).tz("Asia/Dhaka").locale('bn').format('hh:mm');

        // ২. নামাজের সময়সূচী (Adhan Library)
        const coordinates = new Coordinates(23.8103, 90.4125); // ঢাকা
        const params = CalculationMethod.Karachi(); // বাংলাদেশের জন্য স্ট্যান্ডার্ড
        params.madhab = Madhab.Hanafi; // আসরের সময় (হানাফী)
        
        const prayerTimes = new PrayerTimes(coordinates, dateObj, params);
        
        // সময় ফরম্যাট করার ফাংশন
        const fmt = (t) => moment(t).tz("Asia/Dhaka").locale('bn').format('hh:mm');

        // ইশার শেষ সময় (নোট: ইসলামিক নিয়মে ইশা ফজরের আগ পর্যন্ত থাকে, তবে এখানে আমরা রাত ১টা বা মধ্যরাত পর্যন্ত দেখাতে পারি, অথবা শুধু শুরুর সময়। স্ট্যান্ডার্ড হলো পরের ওয়াক্ত শুরু হওয়া পর্যন্ত)
        // আমরা এখানে রেঞ্জ দেখাচ্ছি:
        
        const fajrTime = `${fmt(prayerTimes.fajr)} - ${sunrise} মি.`;
        const dhuhrTime = `${fmt(prayerTimes.dhuhr)} - ${fmt(prayerTimes.asr)} মি.`;
        const asrTime = `${fmt(prayerTimes.asr)} - ${sunset} মি.`;
        const maghribTime = `${sunset} - ${fmt(prayerTimes.isha)} মি.`;
        const ishaTime = `${fmt(prayerTimes.isha)} - ${fmt(prayerTimes.fajr)}* মি.`; // *পরের দিন ফজর পর্যন্ত

        // ৩. ফাইনাল মেসেজ
        const message = `
🌙 **নিত্যদিনের আপডেট** 🌙
──────────────────

👋 **আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্**

🗓 **আজকের তারিখ:**
▫️ ইংরেজি: \`${dateEng}\`
▫️ বাংলা: \`${banglaDate} বঙ্গাব্দ\`
▫️ হিজরি: \`${hijriDate} হিজরী\`

🌤 **প্রকৃতি ও সময়:**
▫️ আজকের বার: **${dayName}**
▫️ ঋতু: ${season}

🕌 **নামাজের সময়সূচী (ঢাকা):**
▫️ ফজর: \`${fajrTime}\`
▫️ যোহর: \`${dhuhrTime}\`
▫️ আসর: \`${asrTime}\`
▫️ মাগরিব: \`${maghribTime}\`
▫️ ইশা: \`${ishaTime}\`
_(বি:দ্র: ইশা'র ওয়াক্ত সুবহে সাদিক পর্যন্ত থাকে)_

🌞 **সূর্যের সময়সূচি:**
⬆️ সূর্যোদয়: \`${sunrise}\` মি.
⬇️ সূর্যাস্ত: \`${sunset}\` মি.

✨ _নামাজ বেহেশতের চাবি। সময়মত নামাজ আদায় করুন।_
──────────────────
`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log("Message with prayer times sent!");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

sendMessage();
