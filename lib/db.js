import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    monedas: { type: Number, default: 0 },
    casado: { type: String, default: null },
    name: { type: String, default: 'Usuario' },
    exp: { type: Number, default: 0 },
    warnAntiLink: { type: Number, default: 0 },
    col: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    gender: { type: String, default: 'No definido' },
    identity: { type: String, default: 'No definido' },
    age: { type: Number, default: 0 },
    description: { type: String, default: '' }
}, { strict: false });

const User = mongoose.model('User', userSchema);

export const database = {
    async connect(url) {
        await mongoose.connect(url, { 
            serverSelectionTimeoutMS: 5000, 
            family: 4,
            maxPoolSize: 10
        });
        this.startGarbageCollector();
    },

    async getProfile(jid) {
        const user = await User.findOne({ id: jid }).lean();
        return { data: user || {}, isLegit: !!user };
    },

    async update(jid, updateData) {
        await User.findOneAndUpdate(
            { id: jid }, 
            { ...updateData, lastSeen: new Date() }, 
            { upsert: true, new: true }
        );
    },

    startGarbageCollector() {
        setInterval(async () => {
            try {
                const result = await User.deleteMany({
                    monedas: { $lte: 0 },
                    exp: { $lte: 0 },
                    casado: null,
                    banned: false,
                    age: { $lte: 0 },
                    $or: [
                        { description: '' },
                        { description: 'Hola' },
                        { description: { $exists: false } }
                    ],
                    gender: 'No definido',
                    identity: 'No definido'
                });
                if (result.deletedCount > 0) {
                    console.log(`[DB] Limpieza completada: ${result.deletedCount} usuarios fantasma eliminados.`);
                }
            } catch (e) {
                console.error('[DB Error] Error en el recolector de basura:', e);
            }
        }, 1000 * 60 * 60 * 2); 
    }
};

export { User };
