import { parentPort } from 'worker_threads';

parentPort.on('message', async ({ sock, m, messages }) => {
    try {
        if (!m || !m.message) return;

        const isDownloadable = m.mtype === 'imageMessage' || m.mtype === 'videoMessage' || m.mtype === 'audioMessage';

        if (isDownloadable) {
            parentPort.postMessage({ 
                type: 'log', 
                data: `Procesando Media de ${m.sender} en ${m.chat}` 
            });
        }
        
    } catch (e) {
        parentPort.postMessage({ type: 'log', data: `Error en Worker Media: ${e.message}` });
    }
});
