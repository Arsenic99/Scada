import snap7 from "node-snap7";

const { S7Client } = snap7;
const client = new S7Client();

const IP = "172.28.66.2";
const RACK = 0;
const SLOT = 1;

const S7AreaPE = 0x81; // Входы
const S7AreaPA = 0x82; // Выходы
const S7WLByte = 0x02;
const S7WLWord = 0x04;

let isConnecting = false;

// 🔌 Подключение с автоповтором
function connectPLC() {
    if (!client.Connected() && !isConnecting) {
        isConnecting = true;
        client.ConnectTo(IP, RACK, SLOT, (err) => {
            isConnecting = false;
            if (err) {
                console.error("❌ Ошибка подключения:", client.ErrorText(err));
            } else {
                console.log("✅ Подключено к ПЛК");
            }
        });
    }
}

// Интервал переподключения каждые 10 секунд
setInterval(() => {
    if (!client.Connected()) {
        console.warn("⚠️ Попытка переподключения к PLC...");
        connectPLC();
    }
}, 10000);

// Универсальное чтение области
function readAreaPromise(area, dbNumber, start, amount, wordLen) {
    return new Promise((resolve, reject) => {
        client.ReadArea(area, dbNumber, start, amount, wordLen, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

// Парсинг битов
function parseBits(res, prefix, offset = 0) {
    const bits = {};
    for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
        const byte = res.readUInt8(byteIndex);
        for (let bit = 0; bit < 8; bit++) {
            bits[`${prefix}${byteIndex + offset}.${bit}`] = (byte & (1 << bit)) !== 0;
        }
    }
    return bits;
}

// Парсинг слов с масштабированием
function parseWords(res, prefix, startAddr, scaleFn) {
    const values = {};
    for (let i = 0; i < res.length; i += 2) {
        const word = res.readUInt16BE(i);
        const value = scaleFn ? scaleFn(word) : word;
        values[`${prefix}${startAddr + i}`] = value;
    }
    return values;
}

// Основная функция чтения всех данных
async function readAllPLCData() {
    if (!client.Connected()) return null;

    try {
        const results = await Promise.all([
            readAreaPromise(S7AreaPE, 0, 0, 4, S7WLByte),    // I0.0 - I3.7
            readAreaPromise(S7AreaPE, 0, 20, 16, S7WLByte),  // I20.0 - I35.7
            readAreaPromise(S7AreaPE, 0, 100, 3, S7WLWord),  // Давление IW100-104
            readAreaPromise(S7AreaPE, 0, 106, 1, S7WLWord),  // Резерв IW106
            readAreaPromise(S7AreaPE, 0, 108, 12, S7WLWord), // Температура IW108-130
            readAreaPromise(S7AreaPE, 0, 132, 2, S7WLWord),  // Уровень IW132-134
            readAreaPromise(S7AreaPE, 0, 136, 6, S7WLWord),  // Резерв IW136-146
            readAreaPromise(S7AreaPE, 0, 148, 3, S7WLWord),  // Открытие IW148-152
            readAreaPromise(S7AreaPE, 0, 154, 5, S7WLWord),  // Резерв IW154-162
            readAreaPromise(S7AreaPA, 0, 0, 4, S7WLByte),    // Q0.0 - Q3.7
            readAreaPromise(S7AreaPA, 0, 20, 16, S7WLByte),  // Q20.0 - Q35.7
        ]);

        const [
            I0_3, I20_35, IW100_104, IW106, IW108_130,
            IW132_134, IW136_146, IW148_152, IW154_162,
            Q0_3, Q20_35
        ] = results;

        const inputs = {
            ...parseBits(I0_3, "I"),
            ...parseBits(I20_35, "I", 20),
            ...parseWords(IW100_104, "IW", 100, (w) => (w / 27648) * 10),
            ...parseWords(IW106, "IW", 106, () => "Резерв"),
            ...parseWords(IW108_130, "IW", 108, (w) => (w / 27648) * 200 - 50),
            ...parseWords(IW132_134, "IW", 132, (w) => (w / 27648) * 5),
            ...parseWords(IW136_146, "IW", 136, () => "Резерв"),
            ...parseWords(IW148_152, "IW", 148, (w) => (w / 27648) * 100),
            ...parseWords(IW154_162, "IW", 154, () => "Резерв"),
        };

        const outputs = {
            ...parseBits(Q0_3, "Q"),
            ...parseBits(Q20_35, "Q", 20),
        };

        return { timestamp: new Date(), inputs, outputs };
    } catch (err) {
        console.error("❌ Ошибка чтения:", err.message);
        client.Disconnect();
        return null;
    }
}

// Интервал чтения данных каждые 3 секунды
setInterval(async () => {
    const data = await readAllPLCData();
    if (data) {
        console.clear();
        console.log("📅 Цикл:", data.timestamp.toISOString());
        console.log("🟢 Входы:", data.inputs);
        console.log("🔵 Выходы:", data.outputs);
    }
}, 3000);

// Первая попытка подключения
connectPLC();
