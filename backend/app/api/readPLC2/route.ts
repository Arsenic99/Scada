import { S7Client } from 'node-snap7';

const S7AreaMK = 0x83; // Маркеры (M)
const S7AreaPA = 0x82; // Выходы (Outputs)
const S7AreaPE = 0x81; // Входы (Inputs)
////////////////////////////////////////////////////////////////////////
const S7WLByte = 0x02; // Тип данных — байт
const S7WLWord = 0x04; // Тип данных — слово (2 байта)

const client = new S7Client();

const ip = '172.28.66.2'; // IP ПЛК
const rack = 0;
const slot = 1;

const disconnect = () => {
    client.Disconnect();
    console.log('🔌 Disconnected from PLC.');
};

client.ConnectTo(ip, rack, slot, (err) => {
    if (err) {
        console.error('❌ Connection failed:', client.ErrorText(err));
        return;
    }
    console.log('✅ Connected to PLC.');

    const readDataFromPLC = setInterval(() => {

        // ✅ Чтение входов от I0.0 до I3.7

        /*
        client.ReadArea(S7AreaPE, 0, 0, 4, S7WLByte, (err, res) => {
            if (err) {
                console.error('Ошибка чтения входов:', client.ErrorText(err));
            } else {
                for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                    const byte = res.readUInt8(byteIndex);
                    for (let bit = 0; bit < 8; bit++) {
                        const bitValue = (byte & (1 << bit)) !== 0;
                        console.log(`I${byteIndex}.${bit} = ${bitValue}`);
                    }
                }
            }
        });

        // ✅ Чтение входов от I20.0 до I35.7
        client.ReadArea(S7AreaPE, 0, 20, 16, S7WLByte, (err, res) => {
            if (err) {
                console.error('Ошибка чтения входов:', client.ErrorText(err));
            } else {
                for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                    const byte = res.readUInt8(byteIndex);
                    for (let bit = 0; bit < 8; bit++) {
                        const bitValue = (byte & (1 << bit)) !== 0;
                        console.log(`I${byteIndex + 20}.${bit} = ${bitValue}`);
                    }
                }
            }
        });

*/

        // ✅ Чтение выходов от IW100 до IW104 измерение давления
        client.ReadArea(S7AreaPE, 0, 100, 3, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Inputs IW100 - IW104:');
                for (let i = 0; i < resWords.length; i += 2) {
                    const wordIndex = i + 100;
                    const word = resWords.readUInt16BE(i);
                    const pressure = (word / 27648) * 10;
                    console.log(`IW${wordIndex} = ${pressure.toFixed(2)}бар`);
                }
            }
        });

        client.ReadArea(S7AreaPE, 0, 106, 1, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Input IW106:');
                    console.log(`IW106 = Резерв`);
                }
            }
        );

                // ✅ Чтение выходов от IW108 до IW130 измерение температуры
        client.ReadArea(S7AreaPE, 0, 108, 12, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Inputs IW108 - IW130:');
                for (let i = 0; i < resWords.length; i += 2) {
                    const wordIndex = i + 108;
                    const word = resWords.readUInt16BE(i);
                    const temperature = (word / 27648) * 200 - 50;
                    console.log(`IW${wordIndex} = ${temperature.toFixed(2)}C`);
                }
            }
        });

        // ✅ Чтение выходов от IW132 до IW134 измерение уровня
        client.ReadArea(S7AreaPE, 0, 132, 2, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Inputs IW132 - IW134:');
                for (let i = 0; i < resWords.length; i += 2) {
                    const wordIndex = i + 132;
                    const word = resWords.readUInt16BE(i);
                    const level = (word / 27648) * 5;
                    console.log(`IW${wordIndex} = ${level.toFixed(2)}m`);
                }
            }
        });

        // ✅ Чтение выходов от IW136 до IW146 измерение уровня
        client.ReadArea(S7AreaPE, 0, 136, 6, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Inputs IW136 - IW146:');
                for (let i = 0; i < resWords.length; i += 2) {
                    const wordIndex = i + 136;
                    console.log(`IW${wordIndex} = Резерв`);
                }
            }
        });

        // ✅ Чтение выходов от IW148 до IW152 измерение уровня открытия
        client.ReadArea(S7AreaPE, 0, 148, 3, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Inputs IW148 - IW152:');
                for (let i = 0; i < resWords.length; i += 2) {
                    const wordIndex = i + 148;
                    const word = resWords.readUInt16BE(i);
                    const level = (word / 27648) * 100;
                    console.log(`IW${wordIndex} = ${level.toFixed(2)}%`);
                }
            }
        });

        // ✅ Чтение выходов от IW154 до IW162 измерение уровня
        client.ReadArea(S7AreaPE, 0, 154, 5, S7WLWord, (err, resWords) => {
            if (err) {
                console.error('❌ Error reading inputs words:', client.ErrorText(err));
            } else {
                console.log('📦 Inputs IW154 - IW162:');
                for (let i = 0; i < resWords.length; i += 2) {
                    const wordIndex = i + 154;
                    console.log(`IW${wordIndex} = Резерв`);
                }
            }
        });

        /////////////////////////////////////////////////////////////////////////////


        /*
        // ✅ Чтение выходов от Q0.0 до Q3.7
        client.ReadArea(S7AreaPA, 0, 0, 4, S7WLByte, (err, res) => {
            if (err) {
                console.error('Ошибка чтения входов:', client.ErrorText(err));
            } else {
                for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                    const byte = res.readUInt8(byteIndex);
                    for (let bit = 0; bit < 8; bit++) {
                        const bitValue = (byte & (1 << bit)) !== 0;
                        console.log(`Q${byteIndex}.${bit} = ${bitValue}`);
                    }
                }
            }
        });

        // ✅ Чтение выходов от Q20.0 до Q35.7
        client.ReadArea(S7AreaPA, 0, 20, 16, S7WLByte, (err, res) => {
            if (err) {
                console.error('Ошибка чтения входов:', client.ErrorText(err));
            } else {
                for (let byteIndex = 0; byteIndex < res.length; byteIndex++) {
                    const byte = res.readUInt8(byteIndex);
                    for (let bit = 0; bit < 8; bit++) {
                        const bitValue = (byte & (1 << bit)) !== 0;
                        console.log(`Q${byteIndex + 20}.${bit} = ${bitValue}`);
                    }
                }
            }
        });
*/
    }, 3000)

    //disconnect();
});





    /*
        client.DBRead(10, 498, 4, (err, res) => {
            if (err) {
                console.error('❌ DBRead error:', client.ErrorText(err));
            } else {
                const realValue = res.readFloatBE(0);
                console.log('📦 DB7 REAL value:', realValue);
            }
        });
    
    client.DBRead(10, 504, 20, (err, res) => {
        if (err) {
            console.error('❌ DBRead error:', client.ErrorText(err));
        } else {
            for (let i = 0; i < 4; i++) {
                console.log(`📦 DB10.DBD${504 + i * 4} =`, res);
                const realValue = res.readFloatBE(i*4);
                console.log(`📦 DB10.DBD${504 + i * 4} =`, realValue);
            }
        }
    
       // client.Disconnect();
       // console.log('🔌 Disconnected from PLC.');
    });
    */
    // Чтение маркера M10.0 через MBRead
    /* client.MBRead(10, 1, (err, res) => {
         if (err) {
             console.error('❌ MBRead error:', client.ErrorText(err));
         } else {
             const bitValue = (res[0] & (1 << 0)) !== 0;
             console.log('🔎 M10.0 (via MBRead):', bitValue);
         }
     });*/

    // Чтение M10.0 через ReadArea
    /*client.ReadArea(S7AreaMK, 0, 10, 1, S7WLByte, (err, res) => {
        if (err) {
            console.error('❌ ReadArea (M10.0) error:', client.ErrorText(err));
        } else {
            const bitValue = (res.readUInt8(0) & (1 << 0)) !== 0;
            console.log('🔍 M10.0 (via ReadArea):', bitValue);
        }
    });*/
    /*
                client.ReadArea(S7AreaPE, 0, 60, 7, S7WLWord, (err, resWords) => {
                if (err) {
                    console.error('❌ Error reading inputs words:', client.ErrorText(err));
                } else {
                    console.log('📦 Inputs IW60 - IW66 (7 words):');
                    for (let i = 0; i < resWords.length; i += 2) {
                        const wordIndex = i / 2 + 60;
                        const word = resWords.readUInt16BE(i);
                        console.log(`IW${wordIndex} = 0x${word.toString(16).padStart(4, '0')} (${word})`);
                    }
                }
            });
    */
