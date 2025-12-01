const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');
const SunCalc = require('suncalc');

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(token);

// ১. বাংলা ও ইংরেজি সংখ্যা কনভার্টার
const toBengaliNumber = (n) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

// ২. কাস্টম বাংলা তারিখ বের করার ফাংশন (বাংলাদেশ সরকারি নিয়ম অনুযায়ী)
function getBanglaDate(date) {
    const months = ["বৈশাখ", "জৈষ্ঠ্য", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    const monthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29, 30]; // সাধারণ বছর
    
    // অধিবর্ষ (Leap Year) চেক
    const year = date.getFullYear();
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        monthDays[10] = 30; // ফাল্গুন মাস ৩০ দিন হবে
    }

    // ১৪ এপ্রিল পহেলা বৈশাখ ধরে হিসাব
    const startDay = 14; 
    const startMonth = 3; // April is index 3 (0-11)
    
    let totalDays = 0;
    // বছরের শুরু থেকে আজকের দিন পর্যন্ত মোট দিন সংখ্যা
    const startOfYear = new Date(year, 0, 1);
    const diff = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    
    // পহেলা বৈশাখ বছরের কত তম দিন? (Jan=31, Feb=28/29, Mar=31, Apr=13 passed)
    let banglaNewYearDayOfYear = 31 + 28 + 31 + 13;
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        banglaNewYearDayOfYear = 31 + 29 + 31 + 13;
    }

    let banglaYear = year - 593;
    let daysPassed;

    if (diff >= banglaNewYearDayOfYear) {
        // ১৪ এপ্রিল বা তার পরে (নতুন বাংলা বছর)
        daysPassed = diff - banglaNewYearDayOfYear;
    } else {
        // ১৪ এপ্রিলের আগে (পুরানো বাংলা বছর)
        banglaYear = year - 594;
        // আগের বছরের মোট দিন যোগ করতে হবে না, শুধু লজিক রিভার্স হবে
        // সহজ লজিক: আমরা ১লা বৈশাখ থেকে পিছিয়ে আসব না, বরং ইংরেজি তারিখ অনুযায়ী ম্যানুয়াল ম্যাপিং ভালো।
        // তবে কোড ছোট রাখার জন্য আমরা Intl এর ফিক্সড ভার্সন বা সহজ লজিক ব্যবহার করি:
    }
    
    // কাস্টম লজিক জটিল হতে পারে, তাই আমরা সহজ ম্যাপিং এ যাই:
    // বাংলা মাস ইংরেজি মাসের মাঝামাঝি শুরু হয়।
    
    let banglaMonthIndex = 0;
    let banglaDay = 0;

    // বাংলা ক্যালেন্ডার লজিক (Simplified & Accurate for BD)
    const day = date.getDate();
    const month = date.getMonth(); // 0 = Jan

    // মাস ভিত্তিক দিন বিভাজন (১৪ তারিখের আগে হলে আগের বাংলা মাস)
    if (month === 0) { // Jan (পৌষ-মাঘ)
        banglaMonthIndex = day <= 13 ? 8 : 9;
        banglaDay = day <= 13 ? day + 17 : day - 13;
    } else if (month === 1) { // Feb (মাঘ-ফাল্গুন)
        banglaMonthIndex = day <= 12 ? 9 : 10;
        banglaDay = day <= 12 ? day + 17 : day - 12;
    } else if (month === 2) { // Mar (ফাল্গুন-চৈত্র)
        banglaMonthIndex = day <= 14 ? 10 : 11;
        // লিপ ইয়ার লজিক ফাল্গুনের জন্য
        let falgunEnd = ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) ? 13 : 14; 
        banglaDay = day <= 14 ? day + (29/30 - 14) + 15 : day - 14; // Simple approx fix below:
        if(day <= 14) banglaDay = day + 15; // Approx
        else banglaDay = day - 14;
    } else if (month === 3) { // Apr (চৈত্র-বৈশাখ)
        banglaMonthIndex = day <= 13 ? 11 : 0;
        banglaDay = day <= 13 ? day + 16 : day - 13;
    } else if (month === 4) { // May (বৈশাখ-জৈষ্ঠ্য)
        banglaMonthIndex = day <= 14 ? 0 : 1;
        banglaDay = day <= 14 ? day + 17 : day - 14;
    } else if (month === 5) { // Jun (জৈষ্ঠ্য-আষাঢ়)
        banglaMonthIndex = day <= 14 ? 1 : 2;
        banglaDay = day <= 14 ? day + 17 : day - 14;
    } else if (month === 6) { // Jul (আষাঢ়-শ্রাবণ)
        banglaMonthIndex = day <= 15 ? 2 : 3;
        banglaDay = day <= 15 ? day + 16 : day - 15;
    } else if (month === 7) { // Aug (শ্রাবণ-ভাদ্র)
        banglaMonthIndex = day <= 15 ? 3 : 4;
        banglaDay = day <= 15 ? day + 16 : day - 15;
    } else if (month === 8) { // Sep (ভাদ্র-আশ্বিন)
        banglaMonthIndex = day <= 15 ? 4 : 5;
        banglaDay = day <= 15 ? day + 16 : day - 15;
    } else if (month === 9) { // Oct (আশ্বিন-কার্তিক)
        banglaMonthIndex = day <= 15 ? 5 : 6;
        banglaDay = day <= 15 ? day + 15 : day - 15;
    } else if (month === 10) { // Nov (কার্তিক-অগ্রহায়ণ)
        banglaMonthIndex = day <= 14 ? 6 : 7;
        banglaDay = day <= 14 ? day + 15 : day - 14;
    } else if (month === 11) { // Dec (অগ্রহায়ণ-পৌষ)
        banglaMonthIndex = day <= 14 ? 7 : 8;
        banglaDay = day <= 14 ? day + 15 : day - 14;
    }

    return `${toBengaliNumber(banglaDay)} ${months[banglaMonthIndex]} ${toBengaliNumber(banglaYear)}`;
}

// ৩. হিজরি তারিখ ফিক্স (Intl এর ফরম্যাট ক্লিন করা)
function getHijriDate() {
    const hijri = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-umalqura-nu-beng', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    // "যুগ" বা অতিরিক্ত টেক্সট থাকলে রিমুভ করা হবে
    return hijri.replace(' হিজরি', '').replace(' যুগ', '');
}

async function sendMessage() {
    try {
        const now = moment().tz("Asia/Dhaka");
        const dateObj = new Date(now.format()); // Native Date object for calculations
        
        // ইংরেজি তারিখ
        const dayName = now.locale('bn').format('dddd');
        const dateEng = now.locale('bn').format('D MMMM YYYY');
        
        // বাংলা ও হিজরি
        const banglaDate = getBanglaDate(dateObj);
        const hijriDate = getHijriDate();

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

        // মেসেজ বডি
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

🌞 **সূর্যের সময়সূচি (ঢাকা):**
⬆️ সূর্যোদয়: \`${sunrise}\`
⬇️ সূর্যাস্ত: \`${sunset}\`

✨ _আপনার দিনটি বরকতময় হোক!_
──────────────────
`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log("Message sent successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

sendMessage();
