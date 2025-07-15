<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue';
import type { ManholeConf, ManholePreset, PipeConf } from './types';
import PipeConfItem from './components/PipeConfItem.vue';
import ManholeConfItem from './components/ManholeConfItem.vue';
import { ManholeCanvas } from './canvas';
import { CollisionDetection } from './collision';
import { useStorage } from '@vueuse/core';
import { DEFAULT_MANHOLE, ManholePresets, PipePresets } from './constants';

const manholeCanvas = shallowRef<ManholeCanvas>()

const manhole = useStorage<ManholeConf>('manholeConf', {
    ...DEFAULT_MANHOLE
})

const pipes = useStorage<PipeConf[]>('pipes', [])

const minManholePreset = ref<ManholePreset | null>(null)

// add new pipe to system
function addPipe() {
    pipes.value.push({
        presetName: PipePresets[0].name,
        heightMeters: manhole.value.heightMeters / 2,
        xDegrees: 0, 
        radiusMeters: PipePresets[0].diameterMeters / 2,
        materialThicknessMeters: PipePresets[0].materialThicknessMeters,
        uuid: crypto.randomUUID(),
        get centerYMeters() {
            return this.heightMeters + this.radiusMeters
        }
    })
}

// delete pipe at index
function removePipe(index: number) {
    pipes.value.splice(index, 1)
}

function reset() {
    pipes.value = []
    manhole.value = {...DEFAULT_MANHOLE}
    addPipe()
    update()
}

function findMinManholeSize(): ManholePreset | null {
    for (const preset of ManholePresets) {
        const cD = new CollisionDetection({...manhole.value, diameterMeters: preset.diameterMeters}, pipes.value)
        if (cD.collisions.length == 0) {
            return preset
        }
    }
    return null
}

function update() {
    manholeCanvas.value?.clearCanvas()
    manholeCanvas.value?.render(manhole.value, pipes.value, new CollisionDetection(manhole.value, pipes.value))
    minManholePreset.value = findMinManholeSize()
}

/** watch all state, and rerender the canvas on any changes */
watch(() => [pipes.value, manhole.value] as const, update, { deep: true })

onMounted(() => {
    manholeCanvas.value = new ManholeCanvas("#canvas")
    if (pipes.value.length == 0)
        addPipe()
    update()
})
</script>

<template>
  <header>
    Manhole Solver
  </header>

  <main>
    <canvas ref="canvas" id="canvas"></canvas>
    <h2>Minimum manhole size for structure: {{ minManholePreset?.name }}</h2>
    <h2>Manhole Settings</h2>
    <ManholeConfItem v-model="manhole"></ManholeConfItem>
    <div id="pipe-confs">
        <PipeConfItem v-for="_conf, index in pipes" :key="index" v-model="pipes[index]" :index @remove="removePipe(index)"/>
        <button class="box-btn" @click="addPipe">Add Pipe</button>
    </div>
    <button id="reset-btn" class="box-btn" @click="reset">RESET</button>
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
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

#reset-btn {
    position: absolute;
    right: -6rem;
    width: 10ch;
    height: 5ch;
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
