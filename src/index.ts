import {CandleStick, CandleStickGraph} from "./utils/candlestickChart";
import * as fs from 'fs'

import {Move} from "./utils/models";

function renderChartOnCanvas(canvas: any, candleArray: CandleStick[], moves: Move[], fileName: string | undefined) {
    const gen: CandleStickGraph = new CandleStickGraph({
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

    moves.forEach((el) => gen.addTrade(el))

    gen.draw()

    const buffer = canvas.toBuffer("image/png");

    if (fileName) {
        fs.writeFileSync(fileName, buffer);
    }

    return buffer;
}

// Draw cat with lime helmet
const candleStickToPNG = (
    candleArray:CandleStick[],
    moves:Move[] = [],
    fileName?:string
) =>{
    try{
        //const createCanvas = require('/opt/nodejs/node_modules/canvas').createCanvas
        const createCanvas = require('canvas').createCanvas
        const canvas = createCanvas(800, 800)
        return renderChartOnCanvas(canvas, candleArray, moves, fileName);
    }catch (e) {
        console.error('Error fetching canvas library',e)
        return null;
    }
}

export {
    candleStickToPNG
}