// @ts-nocheck

import {CandleStick, CandleStickColors, CandleStickGraphOptions} from "../src/utils/candlestickChart";
import {candleStickToPNG} from "../src";
import {LamboCandle, MoveType} from "../src/utils/models";
import * as fs from "fs";
import {CandleChartResult} from "binance-api-node";
import {fetchCandles} from "../lib";

async function testFetch(ticker: string): Promise<CandleStick[]> {

    const allCandles:CandleChartResult[] = (await fetchCandles(
        ticker,
        new Date('2023-03-10').getTime(),
        new Date('2023-03-20').getTime()
    ))

    const lamboCandles:LamboCandle[] = allCandles.map((candle)=>{
        const x:LamboCandle = {
            close: parseFloat(candle.close),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            open: parseFloat(candle.open),
            openTimeInMillis: candle.openTime,
            volume: parseFloat(candle.volume)
        }
        return x;
    });

    // const resizedCandles:Candle[] = resizeCandlesBasedOnMaxNCandle(
    //     lamboCandles,
    //     Math.min(100,lamboCandles.length)
    // )

    return lamboCandles.map((candle)=>{
        const x:CandleStick = {
            close: candle.close,
            high: candle.high,
            low: candle.low,
            open: candle.open,
            timestamp: candle.openTimeInMillis
        }
        return x;
    })
}

const init = async () => {
    const array = await testFetch('ETH')
    const moves = [
        {
            currencyType: 'ETH',
            timestamp: new Date('2023-03-11 16:02:20').getTime(),
            type: MoveType.BUY,
            baseType:'USD'

        },{
            currencyType: 'ETH',
            timestamp:  new Date('2023-03-19 01:10:20').getTime(),
            type: MoveType.SELL,
            baseType:'USD'
        }]


    const options:Partial<CandleStickGraphOptions> = {

        wantCandles:true,
        wantTrades:true,

        wantRSI:false,
        wantSMA:false,
        wantLines:false,
        wantMACD:false,
        wantEMA:false,

        wantBollingerBands:false,

        wantGrid:false,

        wantStats: true,

        triangleSize: 20,
        lineWidth: 1,

        lineWidthGreen: 1,
        lineWidthRed: 2,

        wantSideMarksMove:true,
        baseFontName:'gilroy-semibold',

    }

    const colorsDarkTheme:CandleStickColors = {
        gridColor: "#e2e2e2",
        gridTextColor: "#a0a0a0",
        mouseHoverBackgroundColor: "#f5f5f5",
        lineColor: "#a0a0a0",
        mouseHoverTextColor: "#000000",
        greenColor: "#C1FF72",
        redColor: "#CB6CE6",
        greenHoverColor: "#27ae60",
        redHoverColor: "#c0392b",
        debugLineColor: "#D11538",
        growLineColor: "#a0a0a0",
        blackColor: "#131422",
        whiteColor:"#ffffff",
        yellowColor: "#f9ca24",
        purpleColor: "#9b59b6",
        purpleColorTransparent:"rgba(155,89,182,0.21)",
        yellowColorTransparent:"rgba(249,202,36,0.2)",
        whiteColorTrasparent: 'rgba(255,255,255,0.55)',
        blueColor:'#3498db',
        greenAreaColor:'rgba(46,204,113,0.27)',
        redAreaColor:'rgba(231,76,60,0.27)',
        greenAreaColorIntens:'rgba(46,204,113,0.57)',
        redAreaColorIntes:'rgba(231,76,60,0.57)',
        whiteColorMoreTrasparent: 'rgba(255,255,255,0.25)',
        logoColor: 'white'
    }

    const buffer = candleStickToPNG(
        array,
        moves,
        options,
        colorsDarkTheme
    );

    fs.writeFileSync('./candles.json', JSON.stringify(array));
    fs.writeFileSync('./moves.json', JSON.stringify(moves));
    fs.writeFileSync('./options.json', JSON.stringify(options));
    fs.writeFileSync('./colors.json', JSON.stringify(colorsDarkTheme));
    fs.writeFileSync('./buffer.png', buffer);
}

init()
    .then(()=>console.log('Done!'))
