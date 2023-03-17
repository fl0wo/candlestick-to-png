export interface Move {
    type:MoveType;
    timestamp:number;
    cryptoValue?:number;
    currencyType:string;
}

export interface Drop{
    fromTime : number
    toTime : number
    fromCrypto: number
    toCrypto : number
    diff : number
}

export enum MoveType {
    BUY = 'buy',
    SELL = 'sell'
}

export interface Candle {
    openTimeInISO: string;
    volume: number;
    sizeInMillis: number;
    high: number;
    productId: string;
    low: number;
    openTimeInMillis: number;
    counter: string;
    close: number;
    open: number;
    base: string;
}

export interface LamboCandle extends Returnable<LamboCandle>{
    candle: Candle;
    openTimeInMillis: number;
}

export interface Returnable<T>{
    parse(r:Response):T;
}
