import dotenv from 'dotenv';
dotenv.config();

import { createClient, connect, readBits, readWords, S7AreaPE, S7AreaPA } from '../worker_common/plc';

const client = createClient();
const ip = process.env.PLC_IP!;
const rack = Number(process.env.PLC_RACK);
const slot = Number(process.env.PLC_SLOT);

async function readCycle() {
    await readBits(client, S7AreaPE, 0, 4, 'I');
    await readBits(client, S7AreaPE, 20, 16, 'I');
    await readBits(client, S7AreaPA, 0, 4, 'Q');
    await readBits(client, S7AreaPA, 20, 16, 'Q');
    await readWords(client, S7AreaPE, 100, 3, (w) => (w / 27648) * 10, 'Pressure_IW', 'bar');
    await readWords(client, S7AreaPE, 108, 12, (w) => (w / 27648) * 200 - 50, 'Temp_IW', '°C');
}

async function startWorker() {
    try {
        await connect(client, ip, rack, slot);
        console.log(`✅ Connected to PLC ${ip}`);
        await readCycle();
        // Для циклического чтения:
        // setInterval(readCycle, 3000);
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

startWorker();
