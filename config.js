import { watchFile, unwatchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import axios from 'axios';
import moment from 'moment-timezone';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

/* =========================
   BRANDING CENTRALIZADO
========================= */
global.BOT_CONFIG = Object.freeze({
  primaryName: '𝐆𝐔𝐄𝐑𝐑𝐀 𝐁𝐎𝐓 ♛',
  aliases: [
    '𝒈𝒖𝒆𝒓𝒓𝒂 𝒃𝒐𝒕 ✰',
    '⧫ ɢᴜᴇʀʀᴀ - ʙᴏᴛ ⧫',
    '⌬ 🄶🅄🄴🅁🅁🄰 🄱🄾🅃 ⌬'
  ],
  developer: 'Kevin Santiago Roncancio Guerra'
});

/* =========================
   OWNER CONFIG (FIXED)
========================= */
global.owner = [
  ['573102286030'],
  ['19025051093']
];

global.dev1 = '573102286030';

/* =========================
   BOT MEDIA (UNCHANGED)
========================= */
global.botImages = [
  'https://cdn.dix.lat/me/92dbd94f-eb3d-40d8-ac61-fd42f95c73ff.jpg',
  'https://cdn.dix.lat/me/2e77962f-2cfb-4831-bc37-9a2af152380f.jpg',
  'https://cdn.dix.lat/me/d01987c8-d49f-4ea6-9afc-9fe670c75e05.jpg',
  'https://cdn.dix.lat/me/dc339f12-a4c3-4735-9269-4f28f21c0936.jpg'
];

global.botImages2 = [
  'https://cdn.dix.lat/me/1dcd8a62-8cbf-4d49-a18c-a5c0c0c956e8.jpg',
  'https://cdn.dix.lat/me/5e1a70ed-a5b0-4adf-b465-c8f0d14c2a9e.jpg',
  'https://cdn.dix.lat/me/e95afcb4-c242-4255-9163-74cab7135005.jpg',
  'https://cdn.dix.lat/me/de12636b-2e27-4bea-91cd-b7607cc58f6f.jpg',
  'https://cdn.dix.lat/me/81890b96-fe99-4034-a2fe-68a2a30eb1ef.jpg',
  'https://cdn.dix.lat/me/92dbd94f-eb3d-40d8-ac61-fd42f95c73ff.jpg'
];

/* =========================
   CHANNELS
========================= */
global.my = {
  canal1: '120363427020147321@newsletter',
  canal2: '120363427020147321@newsletter'
};

global.ch = global.my.canal1;

/* =========================
   GLOBAL UTILS SAFE
========================= */
global.bufferCache = global.bufferCache || new Map();

/* FIX: safe getBuffer */
global.getBuffer = async (url) => {
  if (!url) return null;

  if (global.bufferCache.has(url)) return global.bufferCache.get(url);

  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = res.data;
    global.bufferCache.set(url, data);

    if (global.bufferCache.size > 25) {
      global.bufferCache.delete(global.bufferCache.keys().next().value);
    }

    return data;
  } catch {
    return null;
  }
};

/* =========================
   VERSION SAFE
========================= */
try {
  global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
} catch {
  global.v = '1.0.0';
}

/* =========================
   BOT NAME (FIXED & SAFE)
========================= */
global.name = (conn) => {
  try {
    const c = conn || global.conn;
    if (!c?.user) return global.BOT_CONFIG.primaryName;

    const id = jidNormalizedUser(c.user.id);

    if (c.settings?.botName) return c.settings.botName;
    if (global.subbotConfig?.[id]?.botName) return global.subbotConfig[id].botName;

    const list = [global.BOT_CONFIG.primaryName, ...global.BOT_CONFIG.aliases];
    return list[Math.floor(Math.random() * list.length)];
  } catch {
    return global.BOT_CONFIG.primaryName;
  }
};

/* =========================
   IMAGE SELECTOR (SAFE)
========================= */
global.img = (conn) => {
  try {
    const c = conn || global.conn;
    const id = c?.user ? jidNormalizedUser(c.user.id) : null;

    if (c?.settings?.botImage) return c.settings.botImage;
    if (id && global.subbotConfig?.[id]?.botImage) return global.subbotConfig[id].botImage;

    return global.botImages[Math.floor(Math.random() * global.botImages.length)];
  } catch {
    return global.botImages[0];
  }
};

global.img2 = (conn) => {
  try {
    const c = conn || global.conn;

    if (c?.settings?.botImage) return c.settings.botImage;

    return global.botImages2[Math.floor(Math.random() * global.botImages2.length)];
  } catch {
    return global.botImages2[0];
  }
};

/* =========================
   CHANNEL META (BAILEYS SAFE)
========================= */
global.channelInfo = {
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: global.ch,
    newsletterName: `⚔️ ${global.BOT_CONFIG.primaryName} CHANNEL`
  }
};

/* =========================
   TIME SYSTEM FIXED
========================= */
const now = moment().tz('America/Bogota');

global.fecha = now.format('DD/MM/YYYY');
global.tiempo = now.format('hh:mm A');

const hour = parseInt(now.format('HH'));

global.saludo =
  hour < 12 ? 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅'
  : hour < 19 ? 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'
  : 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃';

/* =========================
   CONSTANTS
========================= */
global.rmr = String.fromCharCode(8206).repeat(850);
global.key = 'anty3vbmbg5gf';

/* =========================
   AUTO RELOAD SAFE
========================= */
const file = fileURLToPath(import.meta.url);

watchFile(file, () => {
  unwatchFile(file);
  console.log(chalk.yellowBright("⚡ config.js actualizado"));
  import(`${file}?update=${Date.now()}`);
});
