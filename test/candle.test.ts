// @ts-nocheck

import {CandleStick} from "../src/utils/candlestickChart";
import {candleStickToPNG} from "../src";
import {daysBefore} from "../src/utils/general";
import {LamboCandle} from "../src/utils/models";
import {fetchCandles} from "./fetch-candles-util";
import fs from "fs";

async function testFetch(ticker: string): Promise<CandleStick[]> {

    const allCandles:LamboCandle[] = (await fetchCandles(ticker,daysBefore(new Date(),0.1).getTime()))
        .data
        .body

    return allCandles.map((candle)=>{
        const x:CandleStick = {
            close: candle.candle.close,
            high: candle.candle.high,
            low: candle.candle.low,
            open: candle.candle.open,
            timestamp: candle.openTimeInMillis
        }
        return x;
    })
}

const init = async () => {
    const array = await testFetch('BTC')
    const buffer = candleStickToPNG(array);
    fs.writeFileSync('./test.png', buffer);
}

init()
    .then(()=>console.log('Done!'))
