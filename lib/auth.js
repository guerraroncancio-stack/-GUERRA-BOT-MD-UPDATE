import Database from 'better-sqlite3'
import {
    proto,
    initAuthCreds,
    BufferJSON
} from '@whiskeysockets/baileys'

export default function useSQLiteAuthState(dbPath) {

    const db = new Database(dbPath)

    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')

    db.prepare(`
        CREATE TABLE IF NOT EXISTS auth (
            id TEXT PRIMARY KEY,
            value TEXT
        )
    `).run()

    const readData = (id) => {
        const row = db
            .prepare('SELECT value FROM auth WHERE id = ?')
            .get(id)

        if (!row) return null

        try {
            return JSON.parse(row.value, BufferJSON.reviver)
        } catch (e) {
            return null
        }
    }

    const writeData = (id, value) => {
        db.prepare(`
            INSERT OR REPLACE INTO auth
            (id, value)
            VALUES (?, ?)
        `).run(
            id,
            JSON.stringify(value, BufferJSON.replacer)
        )
    }

    const removeData = (id) => {
        db.prepare('DELETE FROM auth WHERE id = ?').run(id)
    }

    // 🔴 FIX IMPORTANTE: credenciales seguras y mutables
    let creds = readData('creds')
    if (!creds) creds = initAuthCreds()

    const setCreds = (newCreds) => {
        creds = newCreds
        writeData('creds', creds)
    }

    return {
        state: {
            creds,

            keys: {
                get: async (type, ids) => {
                    const data = {}

                    for (const id of ids) {
                        let value = readData(`${type}-${id}`)

                        // 🔴 FIX seguro para app-state-sync-key
                        if (value && type === 'app-state-sync-key') {
                            try {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value)
                            } catch (e) {
                                value = null
                            }
                        }

                        data[id] = value
                    }

                    return data
                },

                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id]
                            const key = `${category}-${id}`

                            if (value) {
                                writeData(key, value)
                            } else {
                                removeData(key)
                            }
                        }
                    }
                }
            }
        },

        // 🔴 FIX: persistencia correcta de creds
        saveCreds: async () => {
            writeData('creds', creds)
        },

        // 🔴 EXTRA: útil para debug o sync externo
        setCreds
    }
}
