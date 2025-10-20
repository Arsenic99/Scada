import { S7Client } from 'node-snap7';

export const S7AreaPE = 0x81;
export const S7AreaPA = 0x82;
export const S7WLByte = 0x02;
export const S7WLWord = 0x04;

export function createClient() {
    return new S7Client();
}

export function connect(client: S7Client, ip: string, rack: number, slot: number) {
    return new Promise<void>((resolve, reject) => {
        client.ConnectTo(ip, rack, slot, (err) => {
            if (err) reject(client.ErrorText(err));
            else resolve();
        });
    });
}

export function readBits(client: S7Client, area: number, start: number, size: number, labelPrefix: string) {
    return new Promise<void>((resolve) => {
        client.ReadArea(area, 0, start, size, S7WLByte, (err, res) => {
            if (err) {
                console.error(`❌ Error reading ${labelPrefix}:`, client.ErrorText(err));
                resolve();
                return;
            }
            for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                const byte = res.readUInt8(byteIndex);
                for (let bit = 0; bit < 8; bit++) {
                    const bitValue = (byte & (1 << bit)) !== 0;
                    console.log(`${labelPrefix}${byteIndex + start}.${bit} = ${bitValue}`);
                }
            }
            resolve();
        });
    });
}

export function readWords(
    client: S7Client,
    area: number,
    start: number,
    count: number,
    scaleFn: (raw: number) => number,
    labelPrefix: string,
    unit: string
) {
    return new Promise<void>((resolve) => {
        client.ReadArea(area, 0, start, count, S7WLWord, (err, res) => {
            if (err) {
                console.error(`❌ Error reading ${labelPrefix}:`, client.ErrorText(err));
                resolve();
                return;
            }
            for (let i = 0; i < res.length; i += 2) {
                const wordIndex = start + i;
                const raw = res.readUInt16BE(i);
                const value = scaleFn(raw);
                console.log(`${labelPrefix}${wordIndex} = ${value.toFixed(2)} ${unit}`);
            }
            resolve();
        });
    });
}
