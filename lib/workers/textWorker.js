import { parentPort } from 'worker_threads';

parentPort.on('message', async ({ sock, m, chatUpdate }) => {
    try {
        if (!m.text) return;

        if (global.subHandler) {
            await global.subHandler(sock, m, chatUpdate);
        }
    } catch (e) {
        parentPort.postMessage({ type: 'log', data: `Error en Worker Text: ${e.message}` });
    }
});
