# ⚔️ GUERRA BOT MD

<p align="center">
  <img src="https://api.dix.lat/me/92dbd94f-eb3d-40d8-ac61-fd42f95c73ff.jpg" width="300">
</p>

<p align="center">
  <strong>Sistema modular de automatización para WhatsApp basado en Baileys Multi-Device</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-00ff88?style=for-the-badge">
  <img src="https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge">
  <img src="https://img.shields.io/badge/Baileys-MD-25D366?style=for-the-badge">
</p>

## 📌 Descripción
GUERRA BOT MD es un sistema modular para WhatsApp Multi-Device basado en Baileys. Está diseñado para ser escalable, rápido y totalmente personalizable mediante plugins.

## ⚙️ Arquitectura
Core principal (index.js), sistema de plugins dinámicos, eventos en tiempo real, reconexión automática, cache optimizado, workers para tareas paralelas, base de datos MongoDB o SQLite.

## 🚀 Características
Multi-Device estable, sistema modular de comandos, hot reload de plugins, manejo de eventos globales, sistema de permisos, reconexión automática inteligente, soporte MongoDB y local fallback, arquitectura ESM moderna, workers para rendimiento.

## 🧱 Stack Tecnológico
Node.js LTS, Baileys WebSocket, MongoDB, SQLite, ESM Modules, Worker Threads.

## 📦 Instalación
Requisitos: Node.js 18+, Git.

Termux/Linux:
pkg update && pkg upgrade -y
pkg install git nodejs-lts ffmpeg imagemagick -y

Clonar:
git clone https://github.com/TU-USUARIO/guerra-bot-md
cd guerra-bot-md

Instalar:
npm install

Iniciar:
npm start

## 🖥️ Producción VPS
npm install -g pm2
pm2 start index.js --name guerra-bot
pm2 save
pm2 startup

## 🧩 Sistema de plugins
export default {
  name: "ping",
  alias: ["p"],
  run: async (m, { conn }) => {
    await conn.reply(m.chat, "pong", m)
  }
}

## 🔐 Seguridad
Manejo de sesiones con SQLite, control de errores global, protección contra desconexiones críticas, validación de eventos.

## 👨‍💻 Autor
Kevin Santiago Roncancio Guerra - Desarrollador principal de GUERRA BOT MD

## 📢 Canal oficial
https://whatsapp.com/channel/120363427020147321

## ⚖️ Licencia
MIT License - Uso libre con atribución obligatoria.
