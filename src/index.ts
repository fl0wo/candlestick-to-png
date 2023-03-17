import {CandleStick, CandleStickGraph} from "./utils/candlestickChart";
import * as fs from 'fs'

import { createCanvas } from 'canvas'
import {Move} from "./utils/models";

// Draw cat with lime helmet
const candleStickToPNG = (
    candleArray:CandleStick[],
    moves:Move[] = [],
    fileName?:string
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

    gen.concatCandleSticks(candleArray)

    moves.forEach((el)=>gen.addTrade(el))

    gen.draw()

    const buffer = canvas.toBuffer("image/png");

    if(fileName){
        fs.writeFileSync(fileName, buffer);
    }

    return buffer;
}

export {
    candleStickToPNG
}