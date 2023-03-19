import {CandleStick, CandleStickColors, CandleStickGraph, CandleStickGraphOptions} from "./utils/candlestickChart";
import * as fs from 'fs'

import {createCanvas} from 'canvas'
import {Move} from "./utils/models";

function executeOnCanvas(
    createCanvas:any,
    candleArray: CandleStick[],
    moves: Move[],
    candleStickGraphOptions:Partial<CandleStickGraphOptions>,
    candleChartColors: Partial<CandleStickColors>,
    fileName?: string
) {

    const canvas = createCanvas(800, 800)

    const basicOptions:CandleStickGraphOptions = {
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
        zoomSpeed: 0,
        wantGrid: false,
        wantStats:true,
        ...candleStickGraphOptions
    }

    const colors:CandleStickColors = {
        gridColor: "rgb(24,24,24)",
        gridTextColor: "#ffffff",
        mouseHoverBackgroundColor: "#84817a",
        lineColor: "rgba(238,238,238,0.34)",
        mouseHoverTextColor: "#000000",
        greenColor: "#77E15E",
        redColor: "#E94334FF",
        greenHoverColor: "#77E15E",
        redHoverColor: "#E94334FF",
        debugLineColor: "#D11538",
        growLineColor: "rgba(255,255,255,0.67)",
        blackColor: "#000000",
        whiteColor:"#eeeeee",
        yellowColor: "#f9ca24",
        purpleColor: "#e056fd",
        purpleColorTransparent:"rgba(217,86,253,0.21)",
        yellowColorTransparent:"rgba(253,206,86,0.2)",
        whiteColorTrasparent: 'rgba(255,255,255,0.55)',
        blueColor:'#4ac4e0',
        greenAreaColor:'rgba(119,255,1,0.27)',
        redAreaColor:'rgba(255,1,22,0.27)',
        greenAreaColorIntens:'rgba(119,255,1,0.57)',
        redAreaColorIntes:'rgba(255,1,22,0.57)',
        whiteColorMoreTrasparent: 'rgba(255,255,255,0.25)',
        ...candleChartColors
    }

    const gen: CandleStickGraph = new CandleStickGraph(basicOptions)

    gen.applyColors(colors)

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


/**
 * Return buffer
 * @param candleArray
 * @param moves
 * @param candleStickGraphOptions
 * @param candleChartColors
 * @param fileName
 */
const candleStickToPNG = (
    candleArray:CandleStick[],
    moves:Move[] = [],
    candleStickGraphOptions:Partial<CandleStickGraphOptions> = {},
    candleChartColors:Partial<CandleStickColors> = {},
    fileName?:string
) =>{
    try{
        return executeOnCanvas(
            createCanvas,
            candleArray,
            moves,
            candleStickGraphOptions,
            candleChartColors,
            fileName
        );
    }catch (e) {
        console.error(e);
    }

    return null;
}

export {
    candleStickToPNG
}