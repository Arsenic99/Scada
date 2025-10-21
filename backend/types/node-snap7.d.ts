declare module 'node-snap7' {
    export class S7Client {
        ConnectTo(ip: string, rack: number, slot: number, callback?: (err: number) => void): void;
        Disconnect(): void;
        Connected(): boolean;
        ReadArea(area: number, dbNumber: number, start: number, amount: number, wordLen: number, callback: (err: number, res: Buffer) => void): void;
        WriteArea(area: number, dbNumber: number, start: number, amount: number, wordLen: number, buffer: Buffer, callback: (err: number) => void): void;
        ErrorText(err: number): string;
    }
}
