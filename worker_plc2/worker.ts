import { S7Client } from 'node-snap7';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const S7AreaPE = 0x81; // Inputs
const S7AreaPA = 0x82; // Outputs
const S7WLByte = 0x02;
const S7WLWord = 0x04;

const client = new S7Client();

const ip = process.env.PLC_IP!;
const rack = Number(process.env.PLC_RACK);
const slot = Number(process.env.PLC_SLOT);

const connect = () =>
    new Promise<void>((resolve, reject) => {
        client.ConnectTo(ip, rack, slot, (err) => {
            if (err) reject(client.ErrorText(err));
            else resolve();
        });
    });

async function save(tag: string, value: number, unit = '') {
    try {
        await prisma.plcRecord.create({
            data: { tag, value, unit },
        });
    } catch (err: any) {
        console.error('❌ DB save error:', err.message);
    }
}

function readBits(area: number, start: number, size: number, labelPrefix: string) {
    return new Promise<void>((resolve) => {
        client.ReadArea(area, 0, start, size, S7WLByte, async (err, res) => {
            if (err) {
                console.error(`❌ Error reading ${labelPrefix}:`, client.ErrorText(err));
                resolve();
                return;
            }
            for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                const byte = res.readUInt8(byteIndex);
                for (let bit = 0; bit < 8; bit++) {
                    const bitValue = (byte & (1 << bit)) !== 0;
                    const tag = `${labelPrefix}${byteIndex + start}.${bit}`;
                    console.log(`${tag} = ${bitValue}`);
                    await save(tag, bitValue ? 1 : 0);
                }
            }
            resolve();
        });
    });
}

function readWords(
    area: number,
    start: number,
    count: number,
    scaleFn: (w: number) => number,
    labelPrefix: string,
    unit: string
) {
    return new Promise<void>((resolve) => {
        client.ReadArea(area, 0, start, count, S7WLWord, async (err, res) => {
            if (err) {
                console.error(`❌ Error reading ${labelPrefix}:`, client.ErrorText(err));
                resolve();
                return;
            }
            for (let i = 0; i < res.length; i += 2) {
                const wordIndex = start + i;
                const raw = res.readUInt16BE(i);
                const value = scaleFn(raw);
                const tag = `${labelPrefix}${wordIndex}`;
                console.log(`${tag} = ${value.toFixed(2)} ${unit}`);
                await save(tag, value, unit);
            }
            resolve();
        });
    });
}

async function readCycle() {
    console.log(`📡 Reading PLC ${ip} data...`);

    await readBits(S7AreaPE, 0, 4, 'I');    // I0.0–I3.7
    await readBits(S7AreaPE, 20, 16, 'I');  // I20.0–I35.7

    await readBits(S7AreaPA, 0, 4, 'Q');    // Q0.0–Q3.7
    await readBits(S7AreaPA, 20, 16, 'Q');  // Q20.0–Q35.7

    await readWords(S7AreaPE, 100, 3, (w) => (w / 27648) * 10, 'Pressure_IW', 'bar');
    await readWords(S7AreaPE, 108, 12, (w) => (w / 27648) * 200 - 50, 'Temp_IW', '°C');
    await readWords(S7AreaPE, 132, 2, (w) => (w / 27648) * 5, 'Level_IW', 'm');
    await readWords(S7AreaPE, 148, 3, (w) => (w / 27648) * 100, 'Open_IW', '%');

    console.log(`✅ PLC ${ip} cycle complete\n`);
}

async function startWorker() {
    try {
        console.log(`🔌 Connecting to PLC ${ip}...`);
        await connect();
        console.log(`✅ Connected to PLC ${ip}`);
        setInterval(readCycle, 3000);
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

startWorker();
