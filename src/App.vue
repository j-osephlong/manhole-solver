<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import type { ManholeConf, PipeConf } from './types';
import PipeConfItem from './components/PipeConfItem.vue';
import ManholeConfItem from './components/ManholeConfItem.vue';

const LOG_TAG = "[App.vue]" as const;
const PIPE_WIDTH_DEGREES = 360

const canvasRef = useTemplateRef("canvas")
const context = ref<CanvasRenderingContext2D>()

function getCanvasPenColorHex(): string {
    const style = window.getComputedStyle(document.body)
    return style.getPropertyValue("--color-heading")
} 

function setupCanvas() {
    if (!canvasRef.value) return
    context.value = canvasRef.value.getContext("2d")!
    const dpr = window.devicePixelRatio;
    const rect = canvasRef.value.getBoundingClientRect();
    
    canvasRef.value.width = rect.width * dpr;
    canvasRef.value.height = rect.height * dpr;

    // context.value.scale(dpr, dpr);
    
    // Set the "drawn" size of the canvas
    canvasRef.value.style.width = `${rect.width}px`;
    canvasRef.value.style.height = `${rect.height}px`;

    context.value!.strokeStyle = getCanvasPenColorHex();
    context.value!.fillStyle = getCanvasPenColorHex();
    context.value.textBaseline = "middle";
    context.value.textAlign = "center";
    context.value.font = "14px Monospace";
}


const manhole = ref<ManholeConf>({
    heightMeters: 1.5,
    diameterMeters: 6,
    minSpacingMeters: 0.2,
})

const pipes = ref<PipeConf[]>([])
/**
 * Use spatial hashing to find collisions rather than check between every pipe
 * https://gamedev.stackexchange.com/questions/56590/c-how-to-implement-a-spatial-hash-for-a-2d-game
 * 
 * cell size is the min spacing between pipes PLUS the largest diameter of a pipe in the system
 * 
 * use x:y as hash
 * 
 * check all adjacent (including diagnol) cells
 */
const cellSize = computed(() => manhole.value.minSpacingMeters + Math.max(...pipes.value.map(p => p.radiusMeters + p.materialThicknessMeters)))
function cellhash(conf: PipeConf): string {
    const pipeXMeters = manhole.value.diameterMeters / PIPE_WIDTH_DEGREES * conf.xDegrees
    const cellX = Math.floor(pipeXMeters / cellSize.value)
    const cellY = Math.floor(conf.heightMeters / cellSize.value)
    return `${cellX}:${cellY}`
}
/** Pipes mapped into their spatial hashing cells  */
const pipeCollisionCells = computed(() => {
    const map = new Map<string, PipeConf[]>()
    for (const conf of pipes.value) {
        const hash = cellhash(conf)
        if (!map.has(hash))
            map.set(hash, [])
            map.get(hash)?.push(conf)
    }
    return map
})
/** Checks if two pipes are 'colliding' (closer than the min spacing) */
function isPipeColliding(conf1: PipeConf, conf2: PipeConf) {
    const pipe1XCenterMeters = manhole.value.diameterMeters / PIPE_WIDTH_DEGREES * conf1.xDegrees
    const pipe1TotalRadius = conf1.radiusMeters + conf1.materialThicknessMeters
    const pipe2XCenterMeters = manhole.value.diameterMeters / PIPE_WIDTH_DEGREES * conf2.xDegrees
    const pipe2TotalRadius = conf2.radiusMeters + conf2.materialThicknessMeters

    const distance = Math.sqrt((pipe2XCenterMeters - pipe1XCenterMeters) ** 2 + (conf2.heightMeters - conf1.heightMeters) ** 2)
    if (distance < pipe1TotalRadius + pipe2TotalRadius  + manhole.value.minSpacingMeters) {
        return true
    }
    return false
}
/** list all pipes colliding with this pipe.  */
function getCollisions(conf: PipeConf) {
    const collisions: PipeConf[] = []
    const hash = cellhash(conf)
    const [xStr, yStr] = hash.split(":")
    const x = Number.parseInt(xStr)
    const y = Number.parseInt(yStr)
    // list of all cells where a collision is possible
    const possibleCells = [
        [x-1, y-1],
        [x, y-1],
        [x+1, y-1],
        [x-1, y],
        [x, y],
        [x+1, y],
        [x-1, y + 1],
        [x, y + 1],
        [x+1, y + 1],
    ] 
    // iterate through possible cells
    for (const cell of possibleCells) {
        const hash = `${cell[0]}:${cell[1]}`
        // iterate through all pipes in those cells and check if they collide
        const confs = pipeCollisionCells.value.get(hash) ?? []
        for (const conf2 of confs) {
            if (conf2.uuid != conf.uuid && isPipeColliding(conf, conf2)) {
                collisions.push(conf2)
            }
        }
    }
    return collisions
}
/** list of all collisions in the system, by pipe uuid mapped to a list of colliding pipe uuids */
const collisions = computed(() => {
    const map = new Map<string, string[]>()
    // iterate through all pipes
    for (const conf of pipes.value) {
        // get collisions 
        const _collisions = getCollisions(conf)
        if (_collisions.length) {
            map.set(conf.uuid, [])
        }
        // make list of colliding pipe uuids and mad to current pipe
        for (const collision of _collisions) {
            map.get(conf.uuid)!.push(collision.uuid)
        }
    }
    return map
})

/** watch all state, and rerender the canvas on any changes */
watch(() => [pipes, manhole], () => {
    clearCanvas()
    render()
}, { deep: true })

function clearCanvas() {
    if (!canvasRef.value || !context.value) return
    context.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

// draw system on canvas
function render() {
    if (!canvasRef.value || !context.value) return
    // get canvas center
    const centerX = canvasRef.value.width / 2;
    const centerY = canvasRef.value.height / 2;
    // draw manhole with 10% spacing from canvas right and left sides
    const manholeWidthPx = canvasRef.value.width * 0.8
    // manhole height is the width of the manhole multiplied by the aspect radio of the manhole
    const manholeHeightPx = ( manhole.value.heightMeters / manhole.value.diameterMeters) * manholeWidthPx
    // get top left coord and bottom right coord of manhole rect
    const coord0Deg = [centerX - (manholeWidthPx / 2), centerY - (manholeHeightPx / 2)] as const
    const coord360Deg = [centerX + (manholeWidthPx / 2), centerY + (manholeHeightPx / 2)] as const
    
    function degToPx(deg: number) {
        if (deg > 360) {
            deg -= 360 
        }
        return (manholeWidthPx / PIPE_WIDTH_DEGREES) * deg
    }

    function metersXToPx(metersX: number) {
        return (manholeWidthPx/ manhole.value.diameterMeters) * metersX
    }

    function drawPipeCutout(conf: PipeConf, index: number) { 
        const radiusPx = metersXToPx(conf.radiusMeters)
        const materialThicknessPx = metersXToPx(conf.materialThicknessMeters)
        const spacingPx = metersXToPx(manhole.value.minSpacingMeters)
        const xPx = coord0Deg[0] + degToPx(conf.xDegrees)
        const yPx = coord360Deg[1] - metersXToPx(conf.heightMeters)
        // internal circle of pipe
        context.value!.beginPath();
        context.value!.arc(xPx, yPx, radiusPx, 0, 2 * Math.PI, false);
        context.value!.lineWidth = 2;
        context.value!.stroke();
        // external circle of pipe (shows material thickness)
        context.value!.beginPath();
        context.value!.arc(xPx, yPx, radiusPx + materialThicknessPx, 0, 2 * Math.PI, false);
        context.value!.lineWidth = 4;
        context.value!.stroke();
        // helper circle, shows collision zone of pipe
        context.value!.beginPath();
        context.value!.arc(xPx, yPx, radiusPx + materialThicknessPx + spacingPx, 0, 2 * Math.PI, false);
        context.value!.lineWidth = 4;
        context.value!.strokeStyle = 'red'
        context.value!.setLineDash([8,8]);
        context.value!.stroke();
        context.value!.strokeStyle = getCanvasPenColorHex();
        context.value!.setLineDash([0]);
        // if pipe falls off the start of the manhole, show a dotted representation of it on the other side
        if (xPx < (coord0Deg[0] + radiusPx)) {
            context.value!.beginPath();
            context.value!.arc(xPx + manholeWidthPx, yPx, radiusPx, 0, 2 * Math.PI, false);
            context.value!.lineWidth = 2;
            context.value!.setLineDash([8,8]);
            context.value!.stroke();
            context.value!.beginPath();
            context.value!.arc(xPx + manholeWidthPx, yPx, radiusPx + materialThicknessPx, 0, 2 * Math.PI, false);
            context.value!.lineWidth = 4;
            context.value!.stroke();
            context.value!.setLineDash([0]);
        }
        // draw a dotted line through the manhole and center of pipe
        context.value!.beginPath();
        context.value!.lineTo(xPx, coord0Deg[1] - 10);
        context.value!.lineTo(xPx, coord360Deg[1] + 10);
        context.value!.lineWidth = 2;
        context.value!.setLineDash([8,8]);
        context.value!.stroke();
        context.value!.setLineDash([0]);
        // write label for manhole
        context.value!.fillText(`Pipe ${index + 1}`, xPx, coord360Deg[1] + 10 + 7);
        context.value!.fillText(cellhash(conf), xPx, coord360Deg[1] + 10 + 31);
    }
    // draw manhole laid out from 0degrees to 360degrees
    context.value.beginPath();
    context.value.rect(coord0Deg[0], coord0Deg[1], coord360Deg[0] - coord0Deg[0], coord360Deg[1] - coord0Deg[1]);
    context.value.lineWidth = 5;
    context.value.stroke();
    // draw each pipe
    let i = 0;
    for (const pipe of pipes.value) {
        drawPipeCutout(pipe, i)
        i++
    }
}

// add new pipe to system
function addPipe() {
    pipes.value.push({
        heightMeters: manhole.value.heightMeters / 2,
        xDegrees: 0, 
        radiusMeters: .4,
        materialThicknessMeters: 0,
        uuid: crypto.randomUUID()
    })
}

// delete pipe at index
function removePipe(index: number) {
    pipes.value.splice(index, 1)
}

onMounted(() => {
    addPipe()
    setupCanvas()
    render()
})

</script>

<template>
  <header>
    Manhole Solver
  </header>

  <main>
    <canvas ref="canvas" id="canvas"></canvas>
    <h2>Manhole Settings</h2>
    <ManholeConfItem v-model="manhole"></ManholeConfItem>
    <div id="pipe-confs">
        <PipeConfItem v-for="_conf, index in pipes" :key="index" v-model="pipes[index]" :index @remove="removePipe(index)"/>
        <button class="box-btn" @click="addPipe">Add Pipe</button>
    </div>
    {{ pipeCollisionCells }}<br>
    <span style="color: red;">{{ collisions }}</span>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

#canvas {
  width: 100%;
  height: 100%;

  border: 1px var(--color-heading) solid;
}

main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

#pipe-confs {
    display: flex; 
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;

    .box-btn {
        width: 80px;
        height: 80px;
    }
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }
}
</style>
