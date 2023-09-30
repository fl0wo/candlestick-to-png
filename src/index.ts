import {CandleStick, CandleStickColors, CandleStickGraph, CandleStickGraphOptions} from "./utils/candlestickChart";
import * as fs from 'fs'
// MOVE THE FOLLOWING LINE TO "IN-CALL" FUNCTION

import {Move} from "./utils/models";
import Binance, {CandleChartResult} from 'binance-api-node'
import {createCanvas, GlobalFonts} from "@napi-rs/canvas";
const client = Binance()

function executeOnCanvas(
    createCanvas:any,
    candleArray: CandleStick[],
    moves: Move[],
    candleStickGraphOptions:Partial<CandleStickGraphOptions>,
    candleChartColors: Partial<CandleStickColors>,
    fileName?: string
) {

    const canvas = createCanvas(800, 800);
    GlobalFonts.registerFromPath(`${__dirname}/fonts/gilroy/gilroy-bold-webfont.woff`,'gilroy-bold')
    GlobalFonts.registerFromPath(`${__dirname}/fonts/gilroy/gilroy-semibold-webfont.woff`,'gilroy-semibold')

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
        triangleSize:10,
        lineWidth:1,
        lineWidthGreen:1,
        lineWidthRed:1,
        wantSideMarksMove:false,
        baseFontName:'gilroy-bold',
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
        logoColor: 'white',
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
 * @param customCanvas
 * @param fileName
 */
const candleStickToPNG = (
    candleArray:CandleStick[],
    moves:Move[] = [],
    candleStickGraphOptions:Partial<CandleStickGraphOptions> = {},
    candleChartColors:Partial<CandleStickColors> = {},
    customCanvas2?:any,
    fileName?:string
) =>{
    try{
        return executeOnCanvas(
            customCanvas2 ? (a:any,b:any)=>customCanvas2 : createCanvas,
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

const fetchCandles = async (asset: string, startMillis: number, endMillis:number):Promise<CandleChartResult[]> => {

    const desiredIntervalString = calculateIntervalBasedOnDuration(startMillis, endMillis);

    return await client.candles({
        interval: desiredIntervalString, // <-- calculate based on the duration
        symbol: asset+'USDT',
        startTime: startMillis,
        endTime: endMillis
    });
}

function calculateIntervalBasedOnDuration(startMillis: number, endMillis: number) {
    const minutesDuration = (endMillis - startMillis) / 1000 / 60;
    const hoursDuration = minutesDuration / 60;

    if(minutesDuration < 60) {
        return '1m';
    }
    if(hoursDuration < 8) {
        return '5m';
    }
    if(hoursDuration < 15) {
        return '15m';
    }
    if(hoursDuration < 20) {
        return '15m';
    }
    if(hoursDuration < 1.5 * 24) {
        return '15m';
    }
    if(hoursDuration < 24 * 2) {
        return '15m';
    }
    if(hoursDuration < 24 * 3) {
        return '30m';
    }
    if(hoursDuration < 24 * 4) {
        return '1h';
    }
    if(hoursDuration < 24 * 6) {
        return '2h';
    }
    if(hoursDuration < 24 * 8) {
        return '2h';
    }
    if(hoursDuration < 24 * 12) {
        return '4h';
    }
    if(hoursDuration < 24 * 60) {
        return '6h';
    }
    if(hoursDuration < 24 * 90) {
        return '8h';
    }
    if(hoursDuration < 24 * 365) {
        return '12h';
    }
    if(hoursDuration < 24 * 3*365) {
        return '1d';
    }
    return '1w'
}

export {
    candleStickToPNG,
    fetchCandles
}