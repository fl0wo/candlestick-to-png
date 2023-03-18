// @ts-nocheck

import {CandleStick, CandleStickColors, CandleStickGraphOptions} from "../src/utils/candlestickChart";
import {candleStickToPNG} from "../src";
import {daysBefore} from "../src/utils/general";
import {LamboCandle, MoveType} from "../src/utils/models";
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
    const moves = [
        {
            currencyType: 'BTC',
            timestamp: daysBefore(new Date(),0.08).getTime(),
            type: MoveType.BUY
        },{
            currencyType: 'BTC',
            timestamp: daysBefore(new Date(),0.02).getTime(),
            type: MoveType.SELL
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

        wantGrid:false
    }

    const colorsDarkTheme:CandleStickColors = {
        gridColor: "#e2e2e2",
        gridTextColor: "#a0a0a0",
        mouseHoverBackgroundColor: "#f5f5f5",
        lineColor: "#a0a0a0",
        mouseHoverTextColor: "#000000",
        greenColor: "#2ecc71",
        redColor: "#e74c3c",
        greenHoverColor: "#27ae60",
        redHoverColor: "#c0392b",
        debugLineColor: "#D11538",
        growLineColor: "#a0a0a0",
        blackColor: "#000000",
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
        whiteColorMoreTrasparent: 'rgba(255,255,255,0.25)'
    }


    const buffer = candleStickToPNG(
        array,
        moves,
        options,
        colorsDarkTheme
    );
    fs.writeFileSync('./test2.png', buffer);
}

init()
    .then(()=>console.log('Done!'))
