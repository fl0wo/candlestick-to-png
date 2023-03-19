
import {SMA,EMA,RSI,TRIX,BollingerBands} from "technicalindicators";
import {LamboCandle, Move} from "./models";

export interface CandleStickGraphOptions{
    wantLines: boolean;
    wantCandles: boolean;
    zoom: number;
    zoomSpeed: number
    wantTrades: boolean;
    wantSMA:boolean;
    wantEMA:boolean ;
    wantRSI:boolean ;
    granularity: number;
    wantMACD: boolean;
    wantBollingerBands: boolean;
    wantGrid:boolean;
    wantStats:boolean;
}

class CandleStickDrag{
    public dragging:boolean = false;
    public dragEnd:CandleStickPoint = CandleStickPoint.origin;
    public dragStart:CandleStickPoint = CandleStickPoint.origin;
}

export interface CandleStickColors{
    gridColor: string;
    gridTextColor: string;
    lineColor: string;
    mouseHoverTextColor: string;
    greenColor: string;
    redColor: string;
    greenHoverColor: string;
    redHoverColor: string;
    mouseHoverBackgroundColor: string;
    growLineColor: string;
    blackColor: string;
    whiteColor: string;
     yellowColor: string;
     purpleColor: string;
     purpleColorTransparent: string;
     yellowColorTransparent: string;
     debugLineColor: string;
     whiteColorTrasparent: string;
     blueColor: string;

     greenAreaColor: string;
     redAreaColor: string;

     greenAreaColorIntens: string;
     redAreaColorIntes: string;

     whiteColorMoreTrasparent: string;
}

class CandleStickPoint{
    public x:number = 0;
    public y:number = 0;
    public static origin:CandleStickPoint = {x:0,y:0}
}



export class CandleStickGraph {

    private options:CandleStickGraphOptions = {
        wantLines:false,
        wantCandles:true,
        zoom: 0,
        zoomSpeed:0.15,
        wantTrades:false,
        wantSMA:false,
        wantEMA:false,
        granularity:1,
        wantRSI:true,
        wantMACD:true,
        wantBollingerBands:true,
        wantGrid:true,
        wantStats:false,
    }

    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    private candlesticks: CandleStick[] = [];
    private selectedCandleStick: any[] = [];
    private moves: MoveTrade[] = [];
    private drops: Drop[] = [];

    private rightCandlesOffset: number = 0;
    private curRightCandleOffset: number = 0;

    private dragInfo:CandleStickDrag = {
        dragging:false,
        dragStart:CandleStickPoint.origin,
        dragEnd:CandleStickPoint.origin
    }

    private colorInfo:CandleStickColors = {
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
    }

    private width!: number;
    private height!: number;
    private candleWidth!: number;
    private marginLeft!: number;
    private marginRight!: number;
    private marginTop!: number;
    private marginBottom!: number;
    private yStart!: number;
    private yEnd!: number;
    private yRange!: number;
    private yPixelRange!: number;
    private xStart!: number;
    private xEnd!: number;
    private xRange!: number;
    private xPixelRange!: number;
    private xGridCells!: number;
    private yGridCells!:number;
    private b_drawMouseOverlay!: boolean;
    private mousePosition!: { x: number; y: number };
    private xMouseHover!: number;
    private yMouseHover!:number;
    private hoveredCandlestickID!: number;
    private leftAxis!: { y1: number; x1: number; y2: number; x2: number };
    private rightAxis!: { y1: number; x1: number; y2: number; x2: number };
    private getIncreaseMsg!: (tradeBuy: any, tradeSell: any) => string;

    private readonly GENERAL_FONT_SIZE = 12;
    private readonly TEXT_FONT_SIZE = 20;
    private readonly BASE_FONT = "Montserrat";

    constructor(options: CandleStickGraphOptions | undefined) {
        this.apply(options)
    }

    public toCandleStick(candle:LamboCandle) : CandleStick{

        if (!candle.candle) {
            return {
                timestamp:0, open:0,close:0,high:0,low:0
            }
        }

        return {
            timestamp : candle.openTimeInMillis,
            open : candle.candle.open,
            close : candle.candle.close,
            high: candle.candle.high,
            low : candle.candle.low
        }
    }

    public reset() {
        this.clean()
        this.rightCandlesOffset = 0;
        this.curRightCandleOffset = 0;
        this.options.zoom = 0;
    }

    public clean() {
        this.candlesticks = [];
        this.selectedCandleStick = [];
        this.moves = [];
        this.drops=[]
    }

    public apply(options: CandleStickGraphOptions | undefined) {
        if (options) {
            this.options = options;
        }
    }

    public applyColors(options: CandleStickColors) {
        this.colorInfo = options;
    }

    private _initCanvas(canvas: HTMLCanvasElement,canvasId?: string){
        // @ts-ignore
        this.canvas = canvas
        // @ts-ignore
        this.width = parseInt(this.canvas.width);
        // @ts-ignore
        this.height = parseInt(this.canvas.height);
        // @ts-ignore
        this.context = this.canvas.getContext("2d");
        /*
            const scale = 2;
            this.canvas.width = this.width * scale;
            this.canvas.height = this.height * scale;
        */

        // this.canvas.style.backgroundColor = "#000";

        this.context.lineWidth = 1;
        this.candleWidth = 5;

        this.marginLeft = 10;
        this.marginRight = 100;
        this.marginTop = 10;
        this.marginBottom = 30;

        this.yStart = 0;
        this.yEnd = 0;
        this.yRange = 0;
        this.yPixelRange = this.height - this.marginTop - this.marginBottom;

        this.xStart = 0;
        this.xEnd = 0;
        this.xRange = 0;
        this.xPixelRange = this.width - this.marginLeft - this.marginRight;

        this.xGridCells = 16;
        this.yGridCells = 16;

        this.b_drawMouseOverlay = false;
        this.mousePosition = {x: 0, y: 0};
        this.xMouseHover = 0;
        this.yMouseHover = 0;
        this.hoveredCandlestickID = 0;

        this.context.font = CandleStickGraph.getFont(this.GENERAL_FONT_SIZE,this.BASE_FONT);

        this.leftAxis = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: this.yPixelRange
        };

        this.rightAxis = {
            x1: this.xPixelRange,
            y1: 0,
            x2: this.xPixelRange,
            y2: this.yPixelRange
        };

        this.reset();
    }

    public initCanvasHeadless(canvas: HTMLCanvasElement) {
        this._initCanvas(canvas)
    }

    public initCanvas(canvas: HTMLCanvasElement, canvasId?: string) {
        this._initCanvas(canvas)
        this.bindCanvasListeners();
    }

    private bindCanvasListeners() {
        this.canvas.addEventListener("mousedown", (e) => {
            if (this.areSelectedCandlesNotNull()) {
                this.mouseDown(e);
            }
        });
        this.canvas.addEventListener("mouseup", (e) => {
            if (this.areSelectedCandlesNotNull()) {
                this.mouseUp();
            }
        });
        this.canvas.addEventListener("mousemove", (e) => {
            if (this.areSelectedCandlesNotNull()) {
                this.mouseMove(e);
                this.mouseDrag(e);
            }
        });
        this.canvas.addEventListener("mouseout", (e) => {
            if (this.areSelectedCandlesNotNull()) {
                this.mouseOut(e);
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            if (this.areSelectedCandlesNotNull()) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                this.mouseWheel(e);
            }
        }, false);
    }

    private static getFont(fontSize: number, baseFont: string) {
        return fontSize + "px " + baseFont;
    }

    private areSelectedCandlesNotNull() {
        return this.selectedCandleStick && this.selectedCandleStick.length > 0;
    }

    public draw = () => {

        this.context.clearRect(0, 0, this.width, this.height);
        this.fillRect(0,0,this.width,this.height,this.colorInfo.blackColor)

        this.selectedCandleStick = this.getSelectedCandleStick();

        this.calculateYRange(this.selectedCandleStick);
        this.calculateXRange(this.selectedCandleStick);
        this.drawGrid();

        this.candleWidth = this.calculateCandleWidth();

        let points: any[] = [];

        if(this.options.wantRSI){
            const rsiAreas = this.calculateRsi();
            this.drawOverAreas(rsiAreas);
        }

        if (this.options.wantBollingerBands) {
            const bollingerBandsRanges = this.calculateBollingerBands(18);
            this.drawBollingRangeArea(bollingerBandsRanges,this.colorInfo.purpleColorTransparent);
        }

        if (this.options.wantMACD) {
            const emaPoints12 = this.calculateEma(12);
            this.drawLines(emaPoints12,this.colorInfo.purpleColor);

            const emaPoints26 = this.calculateEma(26);
            this.drawLines(emaPoints26,this.colorInfo.purpleColor);

            this.drawMACD(emaPoints12,emaPoints26);
        }

        if (this.options.wantSMA) {
            const smaPoints = this.calculateSma();
            this.drawLines(smaPoints,this.colorInfo.yellowColor);
        }

        if (this.options.wantEMA) {
            const emaPoints26 = this.calculateEma(26);
            this.drawLines(emaPoints26,this.colorInfo.purpleColor);
        }

        for (let i = 0; i < this.selectedCandleStick.length; ++i) {
            this.drawCandlesAndValuatePoints(i,
                points);
        }

        if (this.options.wantLines) {
            this.drawLines(points,this.colorInfo.lineColor);
        }

        if (this.options.wantTrades){
            this.drawMoves();
        }

        // draw mouse hover
        if (this.b_drawMouseOverlay) {
            // price line
            const {str, textWidth} = this.drawPriceLine();

            // time line
            this.drawTimeLine(str, textWidth);

            // data
            this.drawInfoLabel();
        }

        if(this.options.wantStats){

            try{
                this.drawStatsLabel()
            }catch (e) {
                console.error(e);
            }

            try{
                this.drawLogo()
            }catch (e) {
                console.error(e);
            }
        }

    }

    private calculateCandleWidth() {
        let ww = (this.xPixelRange / this.selectedCandleStick.length) -1;
        if (ww % 2 === 0) ww--;
        return ww;
    }

    private getSelectedCandleStick() {
        let nCandlesSkipFromLeft = Math.max(0,this.options.zoom);
        let untilFromRight = Math.floor(Math.max(0, this.rightCandlesOffset + this.curRightCandleOffset));
        return this.candlesticks.slice(Math.max(0, nCandlesSkipFromLeft - untilFromRight), this.candlesticks.length - untilFromRight);
    }

    private drawRectangleWithText(textX: number, textY: number, str: any) {
        let oldFont = this.context.font;
        this.context.font = CandleStickGraph.getFont((this.TEXT_FONT_SIZE+2),this.BASE_FONT);
        const textWidth = this.context.measureText(str).width;
        this.fillRect(textX - textWidth / 2 - 10, textY - 20, textWidth + 20, 40, this.colorInfo.whiteColor);
        this.context.fillStyle = this.colorInfo.blackColor;
        this.context.fillText(str, textX - textWidth / 2, textY + 5);
        this.context.font = oldFont;
    }

    private drawMoves() {
        this.getIncreaseMsg = function (tradeBuy, tradeSell) {
            function twoDecimalsOf(number: number) {
                // @ts-ignore
                return number.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
            }

            let from = (tradeBuy.cryptoValue);
            let to = (tradeSell.cryptoValue);
            let diffPercentage = twoDecimalsOf(100 * ((to - from) / (from)));

            return /*twoDecimalsOf(from) + "-" + twoDecimalsOf(to) + " -> " + */ diffPercentage +
                "% " + ((from > to) ? "down" : "up");
        }

        for (let i = 0; i < this.moves.length; i++) {
            const TRIANGLE_SIZE = 10;
            let x = Math.min(
                Math.max(TRIANGLE_SIZE * 4, this.xToPixelCoords(this.moves[i].timestamp)),
                this.xPixelRange + TRIANGLE_SIZE * 4);

            let y = Math.max(TRIANGLE_SIZE * 4, this.yToPixelCoords(this.moves[i].cryptoValue));
            if (this.moves[i].type === "buy") {
                this.drawTriangleUp(x, y, TRIANGLE_SIZE, this.colorInfo.greenColor);
            } else {
                this.drawTriangleDown(x, y, TRIANGLE_SIZE, this.colorInfo.redColor);
            }

            if (i !== 0 && this.moves[i].type === "sell") {
                let xSell = this.xToPixelCoords(this.moves[i].timestamp);
                let ySell = this.yToPixelCoords(this.moves[i].cryptoValue);
                let xBuy = this.xToPixelCoords(this.moves[i-1].timestamp);
                let yBuy = this.yToPixelCoords(this.moves[i-1].cryptoValue);

                // this.context.setLineDash([30, 10]);
                this.drawLine(xSell, ySell, xBuy, yBuy, this.colorInfo.growLineColor);
                // this.context.setLineDash([]);

                let leftIntersect = this.lineIntersect(
                    xSell,ySell,
                    xBuy,yBuy,
                    this.leftAxis.x1,this.leftAxis.y1,
                    this.leftAxis.x2,this.leftAxis.y2
                );

                let rightIntersect = this.lineIntersect(
                    xSell,ySell,
                    xBuy,yBuy,
                    this.rightAxis.x1,this.rightAxis.y1,
                    this.rightAxis.x2,this.rightAxis.y2
                );

                if (leftIntersect !== false) {
                    this.drawRectangleWithText((xSell + leftIntersect.x)/2, (ySell + leftIntersect.y)/2,
                        this.getIncreaseMsg(this.moves[i-1],this.moves[i]));
                } else if (rightIntersect !== false) {
                    this.drawRectangleWithText((xBuy + rightIntersect.x)/2, (yBuy + rightIntersect.y)/2,
                        this.getIncreaseMsg(this.moves[i-1],this.moves[i]));
                }else{
                    this.drawRectangleWithText((xBuy + xSell)/2, (yBuy + ySell)/2,
                        this.getIncreaseMsg(this.moves[i-1],this.moves[i]));
                }

            }
        }
    }

    private drawDrops() {
        this.drops.forEach(drop => {
            let wl = 10;
            let x1 = this.xToPixelCoords(drop.fromTime);
            let x2 = this.xToPixelCoords(drop.toTime);
            let y1 = this.yToPixelCoords(drop.fromCrypto);
            let y2 = this.yToPixelCoords(drop.toCrypto);
            this.setLineWidth(2)
            this.drawLine(
                x2 - wl, y2,
                x2 + wl, y2,
                this.colorInfo.redColor
            );
            this.resetLineWidth()
        });
    }


    private drawLines(points: string | any[], color: any) {
        for (let i = 0; i < points.length - 1; i++) {
            this.drawLine(points[i].x,
                points[i].y,
                points[i + 1].x,
                points[i + 1].y,
                color);
        }
    }

    private drawOverAreas(points:any[]){
        for (let i = 0; i < points.length - 1; i++) {
            if (points[i].y>70){
                // should sell (overbought)
                this.fillRect(points[i].x- Math.floor(this.candleWidth / 2),0,this.candleWidth,this.height,this.colorInfo.redAreaColor);
            } else if (points[i].y<30){
                // should buy (oversell)
                this.fillRect(points[i].x - Math.floor(this.candleWidth / 2),0,this.candleWidth,this.height,this.colorInfo.greenAreaColor);
            }
        }
    }

    private drawCandlesAndValuatePoints(i: number, points: any[]) {
        let isRising = (this.selectedCandleStick[i].close > this.selectedCandleStick[i].open);
        let color = isRising ? this.colorInfo.greenColor : this.colorInfo.redColor;
        if (i === this.hoveredCandlestickID) {
            if (isRising) color = this.colorInfo.greenHoverColor;
            else color = this.colorInfo.redHoverColor;
        }

        let xOnGraph = this.xToPixelCoords(this.selectedCandleStick[i].timestamp);
        let yTopOnGraph = this.yToPixelCoords(this.selectedCandleStick[i].open);
        let yDownOnGraph = this.yToPixelCoords(this.selectedCandleStick[i].close);
        let height = yDownOnGraph - yTopOnGraph;
        points.push({x: xOnGraph, y: yTopOnGraph + height});

        let yLineLow = this.yToPixelCoords(this.selectedCandleStick[i].low);
        let yLineHigh = this.yToPixelCoords(this.selectedCandleStick[i].high);

        // draw the candle and the wick
        if (this.options.wantCandles) {
            if (isRising) {
                this.drawRect(xOnGraph - Math.floor(this.candleWidth / 2),
                    yTopOnGraph,
                    this.candleWidth, height, color);
                this.drawLine(xOnGraph, yDownOnGraph, xOnGraph, yLineHigh, color);
                this.drawLine(xOnGraph, yTopOnGraph, xOnGraph, yLineLow, color);

            } else {
                this.drawLine(xOnGraph, yLineLow, xOnGraph, yLineHigh, color);
                this.fillRect(xOnGraph - Math.floor(this.candleWidth / 2), yTopOnGraph,
                    this.candleWidth, height, color);
            }
        }
    }

    private drawPriceLine() {
        this.context.setLineDash([5, 5]);
        this.drawLine(0, this.mousePosition.y, this.width, this.mousePosition.y, this.colorInfo.mouseHoverBackgroundColor);
        this.context.setLineDash([]);
        const str = this.roundPriceValue(this.yMouseHover);
        const textWidth = this.context.measureText(String(str)).width;
        this.fillRect(this.width - 70, this.mousePosition.y - 10, 70, 20, this.colorInfo.whiteColor);
        this.context.fillStyle = this.colorInfo.blackColor;
        this.context.fillText(String(str), this.width - textWidth - 5, this.mousePosition.y + 5);
        return {str, textWidth};
    }

    private drawTimeLine(str: any, textWidth: number) {
        this.context.setLineDash([5, 5]);
        this.drawLine(this.mousePosition.x, 0, this.mousePosition.x, this.height, this.colorInfo.mouseHoverBackgroundColor);
        this.context.setLineDash([]);
        str = this.formatDate(new Date(this.xMouseHover));
        textWidth = this.context.measureText(str).width;
        this.fillRect(this.mousePosition.x - textWidth / 2 - 5, this.height - 20, textWidth + 10, 20, this.colorInfo.whiteColor);
        this.context.fillStyle = this.colorInfo.blackColor;
        this.context.fillText(str, this.mousePosition.x - textWidth / 2, this.height - 5);
    }

    private drawInfoLabel() {
        let yPos = this.mousePosition.y - 95;
        if (yPos < 0) yPos = this.mousePosition.y + 15;

        this.fillRect(this.mousePosition.x + 15, yPos, 100, 80, this.colorInfo.whiteColor);
        const color = (this.selectedCandleStick[this.hoveredCandlestickID].close > this.selectedCandleStick[this.hoveredCandlestickID].open) ? this.colorInfo.greenColor : this.colorInfo.redColor;
        this.fillRect(this.mousePosition.x + 15, yPos, 10, 80, color);
        this.context.lineWidth = 2;
        this.drawRect(this.mousePosition.x + 15, yPos, 100, 80, color);
        this.context.lineWidth = 1;

        this.context.fillStyle = this.colorInfo.mouseHoverTextColor;
        this.context.fillText("O: " + this.selectedCandleStick[this.hoveredCandlestickID].open, this.mousePosition.x + 30, yPos + 15);
        this.context.fillText("C: " + this.selectedCandleStick[this.hoveredCandlestickID].close, this.mousePosition.x + 30, yPos + 35);
        this.context.fillText("H: " + this.selectedCandleStick[this.hoveredCandlestickID].high, this.mousePosition.x + 30, yPos + 55);
        this.context.fillText("L: " + this.selectedCandleStick[this.hoveredCandlestickID].low, this.mousePosition.x + 30, yPos + 75);
    }

    public addTrade(move:Move) {

        const goalTs = move.timestamp;
        const closestOnTs = this.candlesticks.reduce((prev, curr)=> {
            return (Math.abs(curr.timestamp - goalTs) < Math.abs(prev.timestamp - goalTs) ? curr : prev);
        });

        const cryptoValue = closestOnTs.close
        this.moves.push({
            timestamp:move.timestamp,
            type:move.type,
            cryptoValue:move.cryptoValue ? move.cryptoValue : cryptoValue,
            currencyType:move.currencyType
        });
        return this;
    }

    public addCandlestick = (candlestick: CandleStick, adaptZoom: boolean) => {
        this.candlesticks.push(candlestick);

        if(adaptZoom){
            this.selectedCandleStick = this.candlesticks.slice(Math.max(0,this.options.zoom));
            if ((this.xPixelRange / this.selectedCandleStick.length) < 3) {
                this.options.zoom+=2;
            }
        }

    }

    concatCandleSticks(canvasCandleSticks: CandleStick[], adaptZoom: boolean=false) {
        canvasCandleSticks = canvasCandleSticks.concat(this.candlesticks);
        const actualZoom = this.options.zoom;

        this.candlesticks = [];
        this.selectedCandleStick=[];
        canvasCandleSticks.forEach((c)=>{
            this.addCandlestick(c,adaptZoom)
        })
        if(!adaptZoom) {
            this.options.zoom = actualZoom;
            this.selectedCandleStick = this.candlesticks.slice(Math.max(0,this.options.zoom));
        }
        /*
        this.candlesticks.sort((a,b)=>{
          return a.timestamp - b.timestamp;
        })
         */
        return this;
    }

    private mouseMove = (e: MouseEvent) => {
        const getMousePos = (e: MouseEvent) => {
            // @ts-ignore
            const rect = this.canvas.getBoundingClientRect();
            return {x: e.clientX - rect.left, y: e.clientY - rect.top};
        };
        this.mousePosition = getMousePos(e);
        this.mousePosition.x += this.candleWidth / 2;

        this.b_drawMouseOverlay = this.mousePosition.x >= this.marginLeft;
        if (this.mousePosition.x > this.width - this.marginRight + this.candleWidth) this.b_drawMouseOverlay = false;
        if (this.mousePosition.y > this.height - this.marginBottom) this.b_drawMouseOverlay = false;
        if (this.b_drawMouseOverlay) {
            this.yMouseHover = this.yToValueCoords(this.mousePosition.y);
            this.xMouseHover = this.xToValueCoords(this.mousePosition.x);
            // snap to candlesticks
            const candlestickDelta = this.selectedCandleStick[1].timestamp - this.selectedCandleStick[0].timestamp;
            this.hoveredCandlestickID = Math.floor((this.xMouseHover - this.selectedCandleStick[0].timestamp) / candlestickDelta);
            this.xMouseHover = Math.floor(this.xMouseHover / candlestickDelta) * candlestickDelta;
            this.mousePosition.x = this.xToPixelCoords(this.xMouseHover);
            this.draw();
        } else this.draw();
    }

    private mouseUp = () => {
        this.b_drawMouseOverlay = false;
        this.dragInfo.dragging = false;
        this.dragInfo.dragStart = this.dragInfo.dragEnd;
        this.curRightCandleOffset =
            Math.max(0,this.rightCandlesOffset + this.curRightCandleOffset);
        this.rightCandlesOffset = 0;
    }

    private mouseDown = (e: MouseEvent) => {
        this.b_drawMouseOverlay = false;
        this.dragInfo.dragStart = {
            x: e.pageX - this.canvas.offsetLeft,
            y: e.pageY - this.canvas.offsetTop
        }
        this.dragInfo.dragging = true;
    }

    private mouseDrag = (e: MouseEvent) => {
        this.b_drawMouseOverlay = false;
        if (this.dragInfo.dragging) {
            this.dragInfo.dragEnd = {
                x: e.pageX - this.canvas.offsetLeft,
                y: e.pageY - this.canvas.offsetTop
            }
            this.rightCandlesOffset = (this.dragInfo.dragEnd.x - this.dragInfo.dragStart.x)/this.candleWidth;
            this.draw()
        }
    }

    private mouseOut = (e: MouseEvent) => {
        this.b_drawMouseOverlay = false;
        this.mouseUp();
        this.draw();
    }

    private mouseWheel  = (e: WheelEvent) => {

        const AT_LEAST_CANDLES = 20;
        let zoomFactor = Math.min(15,e.deltaY * - this.options.zoomSpeed)
        let noNegativeZoom = this.options.zoom + zoomFactor > 0;
        let noTooManyCandles = zoomFactor > 0 || (this.xPixelRange / (this.selectedCandleStick.length + zoomFactor)) > 2;
        let noSoFewCandles = zoomFactor < 0 || this.selectedCandleStick.length > Math.max(AT_LEAST_CANDLES,20);

        if(noNegativeZoom && noTooManyCandles && noSoFewCandles) {
            this.options.zoom += zoomFactor;
            this.draw();
        }
    }

    private drawGrid = () => {
        const yGridSize = (this.yRange) / this.yGridCells;
        let niceNumber = Math.pow(10, Math.ceil(Math.log10(yGridSize)));
        if (yGridSize < 0.25 * niceNumber) niceNumber = 0.25 * niceNumber;
        else if (yGridSize < 0.5 * niceNumber) niceNumber = 0.5 * niceNumber;
        const yStartRoundNumber = Math.ceil(this.yStart / niceNumber) * niceNumber;
        const yEndRoundNumber = Math.floor(this.yEnd / niceNumber) * niceNumber;
        for (let y = yStartRoundNumber; y <= yEndRoundNumber; y += niceNumber) {
            if(this.options.wantGrid)
            this.drawLine(0, this.yToPixelCoords(y), this.width, this.yToPixelCoords(y), this.colorInfo.gridColor);
            const textWidth = this.context.measureText(String(this.roundPriceValue(y))).width;
            this.context.fillStyle = this.colorInfo.gridTextColor;
            this.context.fillText(String(this.roundPriceValue(y)), this.width - textWidth - 5, this.yToPixelCoords(y) - 5);
        }
        const xGridSize = (this.xRange) / this.xGridCells;
        niceNumber = Math.pow(10, Math.ceil(Math.log10(xGridSize)));
        if (xGridSize < 0.25 * niceNumber) niceNumber = 0.25 * niceNumber;
        else if (xGridSize < 0.5 * niceNumber) niceNumber = 0.5 * niceNumber;
        const xStartRoundNumber = Math.ceil(this.xStart / niceNumber) * niceNumber;
        const xEndRoundNumber = Math.floor(this.xEnd / niceNumber) * niceNumber;
        let b_formatAsDate = false;
        if (this.xRange > 60 * 60 * 24 * 1000 * 5) b_formatAsDate = true;

        for (let x = xStartRoundNumber; x <= xEndRoundNumber; x += niceNumber) {
            if(this.options.wantGrid)
            this.drawLine(this.xToPixelCoords(x), 0, this.xToPixelCoords(x), this.height, this.colorInfo.gridColor);
            const date = new Date(x);
            let dateStr = "";
            if (b_formatAsDate) {
                let day:any = date.getDate();
                if (day < 10) day = "0" + day;
                let month: any = date.getMonth() + 1;
                if (month < 10) month = "0" + month;
                dateStr = day + "." + month;
            } else {
                let minutes: any = date.getMinutes();
                if (minutes < 10) minutes = "0" + minutes;
                dateStr = date.getHours() + ":" + minutes;
            }
            this.context.fillStyle = this.colorInfo.gridTextColor;
            this.context.fillText(dateStr, this.xToPixelCoords(x) + 5, this.height - 5);
        }
    }

    private calculateYRange = (candlesticks: string | any[]) => {
        for (let i = 0; i < candlesticks.length; ++i) {
            if (i === 0) {
                this.yStart = candlesticks[i].low;
                this.yEnd = candlesticks[i].high;
            } else {
                if (candlesticks[i].low < this.yStart) {
                    this.yStart = candlesticks[i].low;
                }
                if (candlesticks[i].high > this.yEnd) {
                    this.yEnd = candlesticks[i].high;
                }
            }
        }
        this.yRange = this.yEnd - this.yStart;
    }

    private calculateXRange = (candlesticks: string | any[]) => {
        this.xStart = candlesticks[0].timestamp;
        this.xEnd = candlesticks[candlesticks.length - 1].timestamp;
        this.xRange = this.xEnd - this.xStart;
    }

    private yToPixelCoords = (y: number) => {
        return this.height - this.marginBottom - (y - this.yStart) * this.yPixelRange / this.yRange;
    }

    private xToPixelCoords = (x: number) => {
        return this.marginLeft + (x - this.xStart) * this.xPixelRange / this.xRange;
    }

    private yToValueCoords = (y: number) => {
        return this.yStart + (this.height - this.marginBottom - y) * this.yRange / this.yPixelRange;
    }

    private xToValueCoords = (x: number) => {
        return this.xStart + (x - this.marginLeft) * this.xRange / this.xPixelRange;
    }

    private drawLine = (xStart: number, yStart: number, xEnd: number, yEnd: number, color: string) => {
        this.context.beginPath();
        // to get a crisp 1 pixel wide line, we need to add 0.5 to the coords
        this.context.moveTo(xStart + 0.5, yStart + 0.5);
        this.context.lineTo(xEnd + 0.5, yEnd + 0.5);
        this.context.strokeStyle = color;
        this.context.stroke();
    }

    private fillRect = (x: number, y: number, width: number, height: number, color: string) => {
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.rect(x, y, width, height);
        this.context.fill();
    }

    private fillPolygon(points: { x: number; y: number }[], greenColor: string) {
        this.context.beginPath();
        this.context.fillStyle = greenColor;
        this.context.moveTo(points[0].x, points[0].y);

        for(let i=0;i<points.length;i++)
            this.context.lineTo(points[i].x, points[i].y);
        this.context.lineTo(points[0].x, points[0].y);

        this.context.closePath();
        this.context.fill();
    }

    private drawTriangleUp = (x: number, y: number, lat: number, color: string)=> {
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.moveTo(x + lat, y + lat);
        this.context.lineTo(x, y - lat/1.5);
        this.context.lineTo(x - lat, y + lat);
        this.context.fill();
    }

    private drawTriangleDown = (x: number, y: number, lat: number, color: string) => {
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.moveTo(x + lat, y - lat);
        this.context.lineTo(x, y + lat/1.5);
        this.context.lineTo(x - lat, y - lat);
        this.context.fill();
    }

    private drawRect = (x: number, y: number, width: number, height: number, color: string) => {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.rect(x, y, width, height);
        this.context.stroke();
    }

    private formatDate = (date: Date) => {
        let day:any = date.getDate();
        if (day < 10) day = "0" + day;
        let month:any = date.getMonth() + 1;
        if (month < 10) month = "0" + month;
        let hours:any = date.getHours();
        if (hours < 10) hours = "0" + hours;
        let minutes:any = date.getMinutes();
        if (minutes < 10) minutes = "0" + minutes;
        return day + "." + month + "." + date.getFullYear() + " - " + hours + ":" + minutes;
    }

    private roundPriceValue =  (value: number)=> {
        if (value > 1.0) return Math.round(value * 100) / 100;
        if (value > 0.001) return Math.round(value * 1000) / 1000;
        if (value > 0.00001) return Math.round(value * 100000) / 100000;
        if (value > 0.0000001) return Math.round(value * 10000000) / 10000000;
        else return Math.round(value * 1000000000) / 1000000000;
    }


// MATH UTILS

    private lineIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {
        //console.log("line interpolation : " + x3 + ','+ y3 + '-'+ x4 + ','+ y4);

        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false
        }

        let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

        // Lines are parallel
        if (denominator === 0) {
            return false
        }

        let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
        let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false
        }
        // Return object with the x and y coordinates of the intersection
        let x = x1 + ua * (x2 - x1)
        let y = y1 + ua * (y2 - y1)
        return {x, y}
    }

    cleanCandleSticks() {
        this.selectedCandleStick = []
    }

    private setLineWidth(number: number) {
        this.context.lineWidth = number;
    }

    private resetLineWidth(){
        this.setLineWidth(1)
    }

    private calculateSma(period:number=26) {
        let values = this.candlesticks;
        let valuesY = this.candlesticks.map((c)=>c.close);
        const indicators = SMA.calculate({period : period, values : valuesY});

        const newCandleSticks = values.map((el,i)=>{
            return {
                ...el,
                close: (i> (valuesY.length - indicators.length)) ? indicators[i-period] : el.close
            }
        });

        return newCandleSticks.map((c)=>{
            let xOnGraph = this.xToPixelCoords(c.timestamp);
            let yTopOnGraph = this.yToPixelCoords(c.open);
            let yDownOnGraph = this.yToPixelCoords(c.close);
            let height = yDownOnGraph - yTopOnGraph;
            return {x: xOnGraph, y: yTopOnGraph + height};
        });
    }

    private calculateEma(period:number=26) {
        let values = this.candlesticks;
        let valuesY = this.candlesticks.map((c)=>c.close);
        const indicators = EMA.calculate({period : period, values : valuesY});

        const newCandleSticks = values.map((el,i)=>{
            return {
                ...el,
                close: (i> (valuesY.length - indicators.length)) ? indicators[i-period] : el.close
            }
        });

        return newCandleSticks.map((c)=>{
            let xOnGraph = this.xToPixelCoords(c.timestamp);
            let yTopOnGraph = this.yToPixelCoords(c.open);
            let yDownOnGraph = this.yToPixelCoords(c.close);
            let height = yDownOnGraph - yTopOnGraph;
            return {x: xOnGraph, y: yTopOnGraph + height};
        });
    }

    //FIXME: trix is too low valued to be displayed
    private calculateTrix() {
        let period = 30;
        let values = this.candlesticks;
        let valuesY = this.candlesticks.map((c)=>c.close);
        const indicators =
            TRIX.calculate({period : period, values : valuesY});

        const newCandleSticks = values.map((el,i)=>{
            return {
                ...el,
                close: (i> (valuesY.length - indicators.length)) ? indicators[i-period] : el.close
            }
        });

        return newCandleSticks.map((c)=>{
            let xOnGraph = this.xToPixelCoords(c.timestamp);
            let yTopOnGraph = this.yToPixelCoords(c.open);
            let yDownOnGraph = this.yToPixelCoords(c.close);
            let height = yDownOnGraph - yTopOnGraph;
            return {x: xOnGraph, y: yTopOnGraph + height};
        });
    }

    private calculateRsi() {
        let period = 8;
        let values = this.candlesticks;
        let valuesY = this.candlesticks.map((c)=>c.close);
        const indicators =
            RSI.calculate({period : period, values : valuesY});

        const newCandleSticks = values.map((el,i)=>{
            return {
                ...el,
                close: (i> (valuesY.length - indicators.length)) ? indicators[i-period] : el.close
            }
        });

        return newCandleSticks.map((c)=>{
            let xOnGraph = this.xToPixelCoords(c.timestamp);
            return {x: xOnGraph, y: c.close};
        });
    }


    private drawMACD(emaPoints1: {x: number; y: number}[], emaPoints2: {x: number; y: number}[]) {
        this.fillPolygon(emaPoints1.concat(emaPoints2.reverse()),this.colorInfo.whiteColorMoreTrasparent);
        emaPoints2.reverse();

        for(let i=0;i<Math.min(emaPoints1.length,emaPoints2.length);i++){
            const h = (emaPoints1[i].y - emaPoints2[i].y);
            const colorMACD = h>0?this.colorInfo.greenAreaColorIntens:this.colorInfo.redAreaColorIntes;
            this.fillRect(emaPoints1[i].x,emaPoints1[i].y,this.candleWidth,-h,colorMACD)
        }

    }

    private calculateBollingerBands(period: number) {
        let values = this.candlesticks;
        let valuesY = this.candlesticks.map((c)=>c.close);
        const indicators =
            BollingerBands.calculate({period : period, values : valuesY,stdDev : 2});

        const newCandleSticks = values.map((el,i)=>{
            return {
                ...el,
                open: (i> (valuesY.length - indicators.length)) ? indicators[i-period].upper : el.open,
                close: (i> (valuesY.length - indicators.length)) ? indicators[i-period].lower : el.close
            }
        });

        return newCandleSticks.map((c)=>{
            let xOnGraph = this.xToPixelCoords(c.timestamp);
            return {
                x: xOnGraph,
                y: c.open,
                y2:c.close
            };
        });
    }

    private drawBollingRangeArea(bollingerBandsRanges: { x: number; y: number; y2: number }[], color: string) {
        this.drawLines(bollingerBandsRanges.map((el)=>{
            let yTopOnGraph = this.yToPixelCoords(el.y);
            return{
                x: el.x,
                y: yTopOnGraph
            }
        }),color);
        this.drawLines(bollingerBandsRanges.map((el)=>{
            let yTopOnGraph = this.yToPixelCoords(el.y2);
            return{
                x: el.x,
                y: yTopOnGraph
            }
        }),color);
        const polygonPoints =
            bollingerBandsRanges
                .map((el)=>{
                    let yTopOnGraph = this.yToPixelCoords(el.y);
                    return{
                        x:el.x,
                        y:yTopOnGraph
                    }
                })
                .concat(
                    bollingerBandsRanges
                        .map((el)=>{
                            let yTopOnGraph = this.yToPixelCoords(el.y2);
                            return{
                                x:el.x,
                                y:yTopOnGraph
                            }
                        }).reverse()
                );
        this.fillPolygon(polygonPoints,color);
    }

    private formatDateNoHours = (date: Date) => {
        let day:any = date.getDate();
        if (day < 10) day = "0" + day;
        let month:any = date.getMonth() + 1;
        if (month < 10) month = "0" + month;
        return day + "." + month + "." + date.getFullYear();
    }

    private drawStatsLabel() {
        const preFont = this.context.font
        const preColor = this.context.fillStyle;

        const paddingLeft = 80;
        const paddingTop = 60;
        const textSize = (40)

        this.context.font = CandleStickGraph.getFont(textSize,this.BASE_FONT);
        this.context.fillStyle = this.colorInfo.whiteColor;

        this.context.fillText(this.moves[0].currencyType + "/EUR", 10 + paddingLeft, textSize);

        this.context.fillStyle = this.colorInfo.whiteColorTrasparent;
        this.context.font = CandleStickGraph.getFont(textSize/2,this.BASE_FONT);
        const day = new Date(this.candlesticks[Math.floor(this.candlesticks.length/2)].timestamp)
        this.context.fillText(this.formatDateNoHours(day), 10 + paddingLeft, textSize + textSize/2);

        this.context.fillStyle = preColor;
        this.context.font = preFont
    }

    private drawLogo() {
        const SVGIcons = {
            "logo_only_wave_black.svg": {
                draw: function (ctx) {
                    ctx.save();
                    ctx.strokeStyle = "rgba(0,0,0,0)";
                    ctx.miterLimit = 4;
                    ctx.font = "15px ''";
                    ctx.font = "   15px ''";
                    ctx.translate(0.5540540540540562, 0);
                    ctx.scale(0.5675675675675675, 0.5675675675675675);
                    ctx.save();
                    ctx.fillStyle = "#fff";
                    ctx.strokeStyle = "rgba(0,0,0,0)";
                    ctx.font = "   15px ''";
                    ctx.beginPath();
                    ctx.moveTo(3.468657, 112);
                    ctx.bezierCurveTo(4.020682, 110.817299, 4.825206, 109.280014, 6.094991, 108.505936);
                    ctx.bezierCurveTo(21.296396, 99.238838, 34.968487, 88.210617, 44.995117, 73.342888);
                    ctx.bezierCurveTo(50.24588, 65.556938, 53.777756, 56.854958, 53.971645, 47.214466);
                    ctx.bezierCurveTo(54.098431, 40.910656, 49.403709, 36.394333, 43.021671, 35.966431);
                    ctx.bezierCurveTo(32.913063, 35.288681, 23.390165, 37.276749, 13.563206, 42.203903);
                    ctx.bezierCurveTo(16.78842, 31.64435, 20.66403, 22.60828, 28.800495, 15.462938);
                    ctx.bezierCurveTo(35.724667, 9.382215, 43.249119, 5.420638, 52.264214, 3.928263);
                    ctx.bezierCurveTo(61.730152, 2.361255, 71.043755, 2.495655, 80.439186, 4.763796);
                    ctx.bezierCurveTo(95.638657, 8.433086, 108.042816, 16.535461, 118.391975, 27.9454);
                    ctx.bezierCurveTo(127.008179, 37.444775, 132.411224, 48.666054, 134.99324, 61.223808);
                    ctx.bezierCurveTo(138.522568, 78.388939, 135.801132, 94.988892, 130.683777, 111.666382);
                    ctx.bezierCurveTo(88.645775, 112, 46.291542, 112, 3.468657, 112);
                    ctx.moveTo(35.521973, 17.985134);
                    ctx.bezierCurveTo(31.913422, 22.007553, 28.304873, 26.029974, 24.611584, 30.146849);
                    ctx.bezierCurveTo(31.886415, 29.730671, 38.266277, 28.570263, 44.471703, 29.181328);
                    ctx.bezierCurveTo(56.280746, 30.344191, 61.625313, 38.039322, 60.023434, 49.94173);
                    ctx.bezierCurveTo(59.939613, 50.564533, 60.156376, 51.227787, 60.445763, 53.655109);
                    ctx.bezierCurveTo(63.584568, 50.26371, 65.973213, 47.883102, 68.131683, 45.309452);
                    ctx.bezierCurveTo(72.790947, 39.753975, 76.516441, 40.059505, 80.033485, 46.463547);
                    ctx.bezierCurveTo(81.581734, 49.282703, 82.759308, 52.355904, 84.644165, 54.91711);
                    ctx.bezierCurveTo(85.506744, 56.089203, 87.645317, 56.620827, 89.262398, 56.755348);
                    ctx.bezierCurveTo(89.741348, 56.795193, 90.919563, 54.485046, 90.90345, 53.263275);
                    ctx.bezierCurveTo(90.858521, 49.856037, 89.930351, 46.42281, 90.183434, 43.06255);
                    ctx.bezierCurveTo(90.351166, 40.835518, 91.389603, 37.979366, 93.041145, 36.719131);
                    ctx.bezierCurveTo(95.616463, 34.753994, 98.297409, 36.349041, 99.967766, 38.931087);
                    ctx.bezierCurveTo(102.061996, 42.168354, 103.658569, 45.787243, 106.09317, 48.724934);
                    ctx.bezierCurveTo(107.897293, 50.901863, 110.776886, 53.75631, 113.032768, 53.634323);
                    ctx.bezierCurveTo(116.71669, 53.435123, 117.701836, 49.508595, 118.018204, 45.958389);
                    ctx.bezierCurveTo(118.623749, 39.16328, 115.103226, 33.990963, 110.868752, 29.535463);
                    ctx.bezierCurveTo(102.017853, 20.222555, 91.340195, 13.894811, 78.653564, 10.890461);
                    ctx.bezierCurveTo(63.46563, 7.293773, 49.090187, 7.807244, 35.521973, 17.985134);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                    ctx.restore();
                }

            }
        };
        for(const name in SVGIcons){
           SVGIcons[name].draw(this.context)
        }
    }
}

class MoveTrade {
    timestamp:number=0;
    type:string=''
    cryptoValue:number=0
    currencyType:string=''
}

class Drop{
    fromTime : number=0
    toTime : number=0
    fromCrypto: number=0
    toCrypto : number=0
    diff : number=0
}

export interface CandleStick {
    timestamp:number;
    open:number;
    close:number;
    high:number;
    low:number;
}

