import { S7Client } from 'node-snap7';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const client = new S7Client();

// IP ПЛК берём из переменной окружения
const ip = process.env.PLC_IP || '127.0.0.1';
const rack = 0;
const slot = 1;

const S7AreaPE = 0x81;
const S7AreaPA = 0x82;
const S7WLByte = 0x02;
const S7WLWord = 0x04;

async function save(tag: string, value: number, unit: string = '') {
    try {
        await prisma.plcRecord.create({
            data: { tag, value, unit },
        });
    } catch (err: any) {
        console.error('❌ DB save error:', err.message);
    }
}

function connectPLC(): Promise<void> {
    return new Promise((resolve, reject) => {
        client.ConnectTo(ip, rack, slot, (err) => {
            if (err) reject(client.ErrorText(err));
            else resolve();
        });
    });
}

function readBits(area: number, start: number, size: number, labelPrefix: string) {
    return new Promise<void>((resolve) => {
        client.ReadArea(area, 0, start, size, S7WLByte, async (err, res) => {
            if (err) { console.error(err); resolve(); return; }
            for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                const byte = res.readUInt8(byteIndex);
                for (let bit = 0; bit < 8; bit++) {
                    const value = (byte & (1 << bit)) !== 0 ? 1 : 0;
                    const tag = `${labelPrefix}${byteIndex + start}.${bit}`;
                    await save(tag, value);
                }
            }
            resolve();
        });
    });
}

function readWords(area: number, start: number, count: number, scaleFn: (w: number) => number, labelPrefix: string, unit: string) {
    return new Promise<void>((resolve) => {
        client.ReadArea(area, 0, start, count, S7WLWord, async (err, res) => {
            if (err) { console.error(err); resolve(); return; }
            for (let i = 0; i < res.length; i += 2) {
                const raw = res.readUInt16BE(i);
                const value = scaleFn(raw);
                const tag = `${labelPrefix}${start + i}`;
                await save(tag, value, unit);
            }
            resolve();
        });
    });
}

async function readCycle() {
    console.log(`📡 Reading PLC ${ip}...`);
    await readBits(S7AreaPE, 0, 4, 'I');    // входы
    await readBits(S7AreaPE, 20, 16, 'I');
    await readBits(S7AreaPA, 0, 4, 'Q');    // выходы
    await readBits(S7AreaPA, 20, 16, 'Q');
    await readWords(S7AreaPE, 100, 3, w => (w / 27648) * 10, 'Pressure_IW', 'bar');
    await readWords(S7AreaPE, 108, 12, w => (w / 27648) * 200 - 50, 'Temp_IW', '°C');
    await readWords(S7AreaPE, 132, 2, w => (w / 27648) * 5, 'Level_IW', 'm');
    await readWords(S7AreaPE, 148, 3, w => (w / 27648) * 100, 'Open_IW', '%');
    console.log(`✅ Cycle complete for PLC ${ip}`);
}

async function startWorker() {
    try {
        console.log(`🔌 Connecting to PLC ${ip}...`);
        await connectPLC();
        console.log(`✅ Connected to PLC ${ip}`);
        setInterval(readCycle, 3000);
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

startWorker();
