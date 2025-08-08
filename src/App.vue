<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue';
import { getManholeVisibleSectionBottomMeters, getManholeVisibleSectionHeightMeters, type ManholePreset, type System } from './types';
import PipeConfItem from './components/PipeConfItem.vue';
import ManholeConfItem from './components/ManholeConfItem.vue';
import { ManholeCanvas } from './canvas';
import { CollisionDetection } from './collision';
import { useStorage } from '@vueuse/core';
import { DEFAULT_MANHOLE, ManholePresets, PipePresets } from './constants';

const manholeCanvas = shallowRef<ManholeCanvas>()

const system = useStorage<System>('system', {
    manhole: {...DEFAULT_MANHOLE},
    pipes: [],
    manholeVisibleSectionHeight: 1,
    manholeVisibleSectionBottomElevation: 0,
})

const minManholePreset = ref<ManholePreset | null>(null)

// add new pipe to system
function addPipe() {
    system.value.pipes.push({
        presetName: PipePresets[0].name,
        invertElevationMeters: system.value.manholeVisibleSectionBottomElevation,
        xDegrees: 0, 
        radiusMeters: PipePresets[0].diameterMeters / 2,
        materialThicknessMM: PipePresets[0].materialThicknessMM,
        uuid: crypto.randomUUID(),
    })
}

// delete pipe at index
function removePipe(index: number) {
    system.value.pipes.splice(index, 1)
}

function reset() {
    system.value.pipes = []
    system.value.manhole = {...DEFAULT_MANHOLE}
    addPipe()
    update()
}

function findMinManholeSize(): ManholePreset | null {
    for (const preset of ManholePresets) {
        const cD = new CollisionDetection({...system.value, manhole: {...system.value.manhole, diameterMeters: preset.diameterMeters}})
        if (cD.collisions.length == 0) {
            return preset
        }
    }
    return null
}

function update() {
    system.value.manholeVisibleSectionHeight = getManholeVisibleSectionHeightMeters(system.value)
    system.value.manholeVisibleSectionBottomElevation = getManholeVisibleSectionBottomMeters(system.value)
    manholeCanvas.value?.clearCanvas()
    const c = new CollisionDetection(system.value)
    manholeCanvas.value?.render(system.value, c)
    minManholePreset.value = findMinManholeSize()
}

/** watch all state, and rerender the canvas on any changes */
watch(system, update, { deep: true })

onMounted(() => {
    manholeCanvas.value = new ManholeCanvas("#canvas")
    if (system.value.pipes.length == 0)
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
    <ManholeConfItem v-model="system.manhole"></ManholeConfItem>
    <div id="pipe-confs">
        <PipeConfItem v-for="_conf, index in system.pipes" :key="index" v-model="system.pipes[index]" :index @remove="removePipe(index)"/>
        <button class="box-btn" @click="addPipe">Add Pipe</button>
    </div>
    <button id="reset-btn" class="box-btn" @click="reset">RESET</button>
    <h4 style="margin-top: 2rem;">Usage Terms</h4>
    <p>
        This software is made available in the hope that it will be useful, but without any warranty. 
        No author or distributor accepts responsibility to anyone for the consequences of using it or for whether it serves any particular purpose or works at all.
    </p>
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
