import {CandleStick, CandleStickGraph} from "./utils/candlestickChart";
import * as fs from 'fs'

import { createCanvas } from 'canvas'
import {daysBefore} from "./utils/general";
import {MoveType} from "./utils/models";

// Draw cat with lime helmet
export const candleStickToPNG = (
    candleArray:CandleStick[],
    fileName:string='./img.png'
) =>{

    const canvas = createCanvas(800, 800)

    const gen:CandleStickGraph = new CandleStickGraph({
        granularity: 1,
        wantBollingerBands: false,
        wantCandles: true,
        wantEMA: true,
        wantLines: true,
        wantMACD: false,
        wantRSI: false,
        wantSMA: false,
        wantTrades: true,
        zoom: 0,
        zoomSpeed: 0
    })

    // @ts-ignore
    gen.initCanvasHeadless(canvas)

    gen
        .concatCandleSticks(candleArray)
        .addTrade({
            cryptoValue: 25000,
            currencyType: 'BTC',
            timestamp: daysBefore(new Date(),0.08).getTime(),
            totAmount: 0,
            type: MoveType.BUY
        })
        .addTrade({
            cryptoValue: 24900,
            currencyType: 'BTC',
            timestamp: daysBefore(new Date(),0.02).getTime(),
            totAmount: 0,
            type: MoveType.SELL
        })

    gen.draw()

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(fileName, buffer);
}