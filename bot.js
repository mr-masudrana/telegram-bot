const axios = require("axios");

// Secrets from GitHub
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ---------- বাংলা দিনের নাম ----------
const banglaWeekdays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

// ---------- বাংলা মাস ----------
const banglaMonths = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
];

// ---------- ইসলামিক তারিখ (static approximation) ----------
const hijriMonths = [
  "মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি",
  "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান",
  "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"
];

// ---------- ঢাকা নামাজের সময় (স্থির) ----------
const prayerTimes = {
  fazar: "০৪:৩০-০৫:৪৫",
  johor: "১১:৫৭-০৩:২১",
  asor: "০৪:১৯-০৫:৩১",
  magrib: "০৬:০৫-০৬:৫১",
  isha: "০৭:১৮-০১:০০",
  sunrise: "০৫:৪৫",
  sunset: "০৬:০৫"
};

// ---------- Helper: Convert English numbers to Bangla ----------
function toBanglaNumber(num) {
  return num
    .toString()
    .replace(/0/g, "০")
    .replace(/1/g, "১")
    .replace(/2/g, "২")
    .replace(/3/g, "৩")
    .replace(/4/g, "৪")
    .replace(/5/g, "৫")
    .replace(/6/g, "৬")
    .replace(/7/g, "৭")
    .replace(/8/g, "৮")
    .replace(/9/g, "৯");
}

// ---------- বাংলা তারিখ ক্যালকুলেশন ----------
function getBanglaDate(date) {
  const bdMonths = [
    31, 31, 31, 31, 31, 30,
    30, 30, 30, 30, 29, 30
  ];

  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  year -= 593;

  if (month < 3 || (month === 3 && day < 14)) {
    year--;
  }

  const banglaMonth = banglaMonths[(month + 8) % 12];
  const banglaDay = toBanglaNumber(day);

  return { day: banglaDay, month: banglaMonth, year: toBanglaNumber(year) };
}

// ---------- Approximate Hijri Date ----------
function getHijriDate(date) {
  const start = new Date("2024-07-08"); // Hijri 1446 start
  const diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24));

  let hijriDay = (diffDays % 30) + 1;
  let hijriMonthIndex = Math.floor(diffDays / 30) % 12;

  return {
    day: toBanglaNumber(hijriDay),
    month: hijriMonths[hijriMonthIndex],
    year: "১৪৪৬"
  };
}

// ---------- MAIN FUNCTION ----------
async function sendDailyMessage() {
  const today = new Date();

  const weekday = banglaWeekdays[today.getDay()];
  const englishDate = `${toBanglaNumber(today.getDate())} ${today.toLocaleString("bn-BD", { month: "long" })} ${toBanglaNumber(today.getFullYear())}`;
  
  const bd = getBanglaDate(today);
  const hijri = getHijriDate(today);

  const message = `
আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্।
🟧আজ ${weekday}।
🟩${englishDate} খ্রিষ্টাব্দ।
🟦${bd.day} ${bd.month} ${bd.year} বঙ্গাব্দ।
🟪${hijri.day} ${hijri.month} ${hijri.year} হিজরী।
🌅ঋতু- শরৎকাল।

⬛ফজর- ${prayerTimes.fazar} মিনিট।
🟨যোহর- ${prayerTimes.johor} মিনিট।
🟫আসর- ${prayerTimes.asor} মিনিট।
🔲মাগরিব- ${prayerTimes.magrib} মিনিট।
⬜ইশা- ${prayerTimes.isha} মিনিট।

🌄সূর্যোদয়- ${prayerTimes.sunrise} মিনিট।
⏺সূর্যাস্ত- ${prayerTimes.sunset} মিনিট।

বি.দ্র: ঢাকার টাইম অনুযায়ী।
`;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "HTML"
  });

  console.log("Daily message sent!");
}

sendDailyMessage();
