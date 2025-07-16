import type { CollisionDetection } from "./collision"
import { MANHOLE_WIDTH_DEGREES } from "./constants"
import { getManholeVisibleSectionHeightMeters, getPipeCenterElevation, type PipeConf, type System } from "./types"

const LOG_TAG = "[canvas.ts]" as const;
export const MANHOLE_CANVAS_PERCENT = 0.8

export class ManholeCanvas {
    canvasElm: HTMLCanvasElement
    context: CanvasRenderingContext2D

    manholeWidthPx?: number
    manholeHeightPx?: number
    /** 0Degrees, HEIGHTm */
    manholeTopLeft!: [number, number]
    /** 360Degrees, 0m */
    manholeBottomRight!: [number, number]
    
    constructor(querySelector: string) {
        const elm = document.querySelector<HTMLCanvasElement>(querySelector)
        if (elm === null) {
            throw new Error("Invalid query selector string.")
        }
        this.canvasElm = elm
        this.context = elm.getContext("2d")!

        
        const dpr = window.devicePixelRatio;
        const rect = this.canvasElm.getBoundingClientRect();
        
        this.canvasElm.width = rect.width * dpr;
        this.canvasElm.height = rect.height * dpr;

        // Set the "drawn" size of the canvas
        this.canvasElm.style.width = `${rect.width}px`;
        this.canvasElm.style.height = `${rect.height}px`;

        this.context.strokeStyle = this.canvasPenColorHex;
        this.context.fillStyle = this.canvasPenColorHex;
        this.context.textBaseline = "middle";
        this.context.textAlign = "center";
        this.context.font = "14px Monospace";
    }
    
    get centerX(): number {
        return this.canvasElm.width / 2
    }
    
    get centerY(): number {
        return this.canvasElm.height / 2
    }

    get canvasPenColorHex(): string {
        const style = window.getComputedStyle(document.body)
        return style.getPropertyValue("--color-heading")
    }

    degToPx(deg: number) {
        if (deg > 360) {
            deg -= 360 
        }
        return (this.manholeWidthPx! / MANHOLE_WIDTH_DEGREES) * deg
    }

    metersToPx(metersX: number, system: System) {
        return (this.manholeWidthPx!/ system.manhole.diameterMeters) * (metersX) 
    }

    metersYToPx(metersX: number, system: System) {
        return (this.manholeWidthPx!/ system.manhole.diameterMeters) * (metersX - system.manholeVisibleSectionBottomElevation) 
    }

    drawManhole(system: System) {
        const manholeHeightMeters = getManholeVisibleSectionHeightMeters(system)
        console.debug(LOG_TAG, manholeHeightMeters);
        
        // draw manhole laid out from 0degrees to 360degrees
        this.context.beginPath();
        this.context.rect(this.manholeTopLeft[0], this.manholeTopLeft[1], this.manholeBottomRight[0] - this.manholeTopLeft[0], this.manholeBottomRight[1] - this.manholeTopLeft[1]);
        this.context.lineWidth = 5;
        this.context.stroke();
        // draw x axis
        this.context.fillText('0°', this.manholeTopLeft[0], this.manholeTopLeft[1] - 10 - 7);
        this.context.fillText('360°', this.manholeBottomRight[0], this.manholeTopLeft[1] - 10 - 7);
        this.context.fillText(`← ${system.manhole.diameterMeters} meters →`, this.manholeTopLeft[0] + this.manholeWidthPx! / 2, this.manholeTopLeft[1] - 10 - 7);
        // draw y axis
        const topXAxisText = `${system.manhole.rimElevationMeters.toFixed(2)} meters`
        const bottomXAxisText = `${(system.manholeVisibleSectionBottomElevation).toFixed(2)} meters`
        this.context.fillText(topXAxisText, this.manholeTopLeft[0] - 10 - this.context.measureText(topXAxisText).width / 2, this.manholeTopLeft[1]);
        this.context.fillText(bottomXAxisText, this.manholeTopLeft[0] - 10- this.context.measureText(bottomXAxisText).width / 2, this.manholeBottomRight[1]);
        
    }

    drawPipeCutout(o: {
        pipe: PipeConf, system: System, index: number
    }) {
        const radiusPx = this.metersToPx(o.pipe.radiusMeters, o.system)
        const materialThicknessPx = this.metersToPx(o.pipe.materialThicknessMM / 1000, o.system)
        const spacingPx = this.metersToPx(o.system.manhole.minSpacingMeters, o.system)
        const xPx = this.manholeTopLeft[0] + this.degToPx(o.pipe.xDegrees)
        const yPx = this.manholeBottomRight[1] - this.metersYToPx(getPipeCenterElevation(o.pipe), o.system)
        const invertYPx = yPx + radiusPx

        // internal circle of pipe
        this.context.beginPath();
        this.context.arc(xPx, yPx, radiusPx, 0, 2 * Math.PI, false);
        this.context.lineWidth = 2;
        this.context.stroke();
        // external circle of pipe (shows material thickness)
        this.context.beginPath();
        this.context.arc(xPx, yPx, radiusPx + materialThicknessPx, 0, 2 * Math.PI, false);
        this.context.lineWidth = 4;
        this.context.stroke();
        // helper circle, shows collision zone of pipe
        this.context.beginPath();
        this.context.arc(xPx, yPx, radiusPx + materialThicknessPx + spacingPx, 0, 2 * Math.PI, false);
        this.context.lineWidth = 4;
        this.context.strokeStyle = 'red'
        this.context.setLineDash([8,8]);
        this.context.stroke();
        this.context.strokeStyle = this.canvasPenColorHex;
        this.context.setLineDash([0]);
        // if pipe falls off the start of the manhole, show a dotted representation of it on the other side
        if (xPx < (this.manholeTopLeft[0] + radiusPx)) {
            this.context.beginPath();
            this.context.arc(xPx + this.manholeWidthPx!, yPx, radiusPx, 0, 2 * Math.PI, false);
            this.context.lineWidth = 2;
            this.context.setLineDash([8,8]);
            this.context.stroke();
            this.context.beginPath();
            this.context.arc(xPx + this.manholeWidthPx!, yPx, radiusPx + materialThicknessPx, 0, 2 * Math.PI, false);
            this.context.lineWidth = 4;
            this.context.stroke();
            this.context.setLineDash([0]);
        }
        // draw a dotted line through the manhole and center of pipe
        this.context.beginPath();
        this.context.lineTo(xPx, this.manholeTopLeft[1] - 40);
        this.context.lineTo(xPx, this.manholeBottomRight[1] + 40);
        this.context.lineWidth = 2;
        this.context.setLineDash([8,8]);
        this.context.stroke();
        this.context.setLineDash([0]);
        // write label for manhole
        this.context.fillText(`Pipe ${o.index + 1}`, xPx, this.manholeBottomRight[1] + 40 + 7);
        // draw a dotted line veritcally to show measure of invert to rim (measure down)
        if (Math.abs(invertYPx - this.manholeBottomRight[1]) > 10) {
            const measureDownMeters = o.system.manhole.rimElevationMeters - o.pipe.invertElevationMeters
            const lineXPx = xPx - radiusPx - materialThicknessPx - 10
            const lineTopYPx = this.manholeTopLeft[1] + 10
            const measureDownText = `${measureDownMeters.toFixed(2)}m`
            const textWidth = this.context.measureText(measureDownText).width
            this.context.beginPath();
            this.context.lineTo(lineXPx, lineTopYPx);
            this.context.lineTo(lineXPx, invertYPx);
            this.context.lineWidth = 2;
            this.context.setLineDash([8,8]);
            this.context.stroke();
            this.context.setLineDash([0]);
            this.context.beginPath();
            this.context.lineTo(lineXPx - 10, invertYPx);
            this.context.lineTo(lineXPx + 10, invertYPx);
            this.context.stroke();
            this.context.beginPath();
            this.context.lineTo(lineXPx - 10, lineTopYPx);
            this.context.lineTo(lineXPx + 10, lineTopYPx);
            this.context.stroke();
            this.context.fillText(measureDownText, lineXPx - textWidth + 10, (invertYPx + lineTopYPx) / 2);
        }
    }

    drawCollision(collision: [PipeConf, PipeConf], system: System, collisionDetection: CollisionDetection) {
        const xPx1 = this.manholeTopLeft[0] + this.degToPx(collision[0].xDegrees)
        const yPx1 = this.manholeBottomRight[1] - this.metersYToPx(getPipeCenterElevation(collision[0]), system)
        const xPx2 = this.manholeTopLeft[0] + this.degToPx(collision[1].xDegrees)
        const yPx2 = this.manholeBottomRight[1] - this.metersYToPx(getPipeCenterElevation(collision[1]), system)
        const xBtwnPx = (xPx1 + xPx2) / 2
        const yBtwnPx = (yPx1 + yPx2) / 2
        const dstBtwn = collisionDetection.distanceBetween(collision[0], collision[1])
        
        const text = `← ◬${dstBtwn.toFixed(3)}m →`
        const textMsr = this.context.measureText(text)
        const textHeight = textMsr.actualBoundingBoxAscent + textMsr.actualBoundingBoxDescent + 10
        const textWidth = textMsr.width + 10
        this.context.clearRect(xBtwnPx - textWidth / 2, yBtwnPx - textHeight / 2, textWidth, textHeight);
        this.context.strokeStyle = 'orange'
        this.context.fillStyle = 'orange'
        this.context.strokeRect(xBtwnPx - textWidth / 2, yBtwnPx - textHeight / 2, textWidth, textHeight);
        this.context.fillText(text, xBtwnPx, yBtwnPx);
        this.context.strokeStyle = this.canvasPenColorHex
        this.context.fillStyle = this.canvasPenColorHex
    }

    render(system: System, collisionDetection: CollisionDetection) {
        // We want either the height or width of the manhole to be 80% of that direction of the canvas
        const manholeHeightMeters = getManholeVisibleSectionHeightMeters(system)
        this.manholeWidthPx = this.canvasElm.width * MANHOLE_CANVAS_PERCENT
        this.manholeHeightPx = (manholeHeightMeters / system.manhole.diameterMeters) * this.manholeWidthPx
        if (this.manholeHeightPx > this.canvasElm.height * MANHOLE_CANVAS_PERCENT) {
            this.manholeHeightPx = this.canvasElm.height * MANHOLE_CANVAS_PERCENT
            this.manholeWidthPx = (system.manhole.diameterMeters / manholeHeightMeters) * this.manholeHeightPx
        }

        console.debug(LOG_TAG, manholeHeightMeters, this.manholeHeightPx);
        
        
        // setup manhole coords 
        this.manholeTopLeft = [this.centerX - (this.manholeWidthPx / 2), this.centerY - (this.manholeHeightPx / 2)] as const
        this.manholeBottomRight = [this.centerX + (this.manholeWidthPx / 2), this.centerY + (this.manholeHeightPx / 2)] as const
        
        // draw manhole
        this.drawManhole(system)
        
        // draw pipes
        let i = 0;
        for (const pipe of system.pipes) {
            this.drawPipeCutout({
                pipe,
                system,
                index: i,
            })
            i++
        }
        
        // draw collision warnings
        for (const collision of collisionDetection.collisions) {
            this.drawCollision(collision, system, collisionDetection)
        }

        console.debug(LOG_TAG, "Rendered canvas.");
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvasElm.width, this.canvasElm.height)
    }
}