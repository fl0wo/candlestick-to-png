import {CandleStick, CandleStickColors, CandleStickGraph, CandleStickGraphOptions} from "./utils/candlestickChart";
import * as fs from 'fs'
// MOVE THE FOLLOWING LINE TO "IN-CALL" FUNCTION
import {createCanvas} from 'canvas'
import {Candle, LamboCandle, Move} from "./utils/models";
import Binance, {CandleChartResult} from 'binance-api-node'
const client = Binance()

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

const resizeCandlesBasedOnMaxNCandle = (myCandles: Array<LamboCandle>, resizeDataOnMaxCandles: number) :Candle[] => {

    const newCandles: Candle[] = [];

    const groupSize = Math.floor(myCandles.length/resizeDataOnMaxCandles)

    for (let i = 0; i < myCandles.length; i += groupSize) {
        const group = myCandles.slice(i, i + groupSize);
        if (group.length > 0) {
            const newCandle:Candle = {
                base: group[0].candle.base,
                counter: group[0].candle.counter,
                openTimeInISO: group[0].candle.openTimeInISO,
                openTimeInMillis: group[0].candle.openTimeInMillis,
                productId: group[0].candle.productId,
                sizeInMillis: group[0].candle.sizeInMillis,
                open: group[0].candle.open,
                high: Math.max(...group.map(candle => candle.candle.high)),
                low: Math.min(...group.map(candle => candle.candle.low)),
                close: group[group.length - 1].candle.close,
                volume: group.reduce((acc, candle) => acc + candle.candle.volume, 0)
            };
            newCandles.push(newCandle);
        }
    }

    return newCandles;
}

const fetchCandles = async (asset: string, startMillis: number, endMillis?:number):Promise<CandleChartResult[]> => {
    return await client.candles({
        interval: '15m', // <-- calculate based on the duration
        symbol: 'ETHBTC',
        startTime: startMillis,
        endTime: endMillis
    });
}

export {
    candleStickToPNG,
    resizeCandlesBasedOnMaxNCandle,
    fetchCandles
}