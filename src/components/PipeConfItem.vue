<script setup lang="ts">
import type { PipeConf } from '@/types';


const model = defineModel<PipeConf>({required: true})
defineProps<{
    index: number
}>()
const emit = defineEmits<{
    remove: []
}>()

</script>
<template>
    <div class="conf-container">
        <h2>Pipe {{ index + 1 }}</h2>
        <div class="setting">
            <label>Direction</label>
            <input type="number" v-model="model.xDegrees" placeholder="0° - 360°" max="360" min="0" step="3">
        </div>
        <div class="setting">
            <label>Height</label>
            <input type="number" v-model="model.heightMeters" placeholder="Meters" step=".25">
        </div>
        <div class="setting">
            <label>Radius</label>
            <input type="number" v-model="model.radiusMeters" placeholder="Meters" step=".25">
        </div>
        <div class="setting">
            <label>Material Thickness</label>
            <input type="number" v-model="model.materialThicknessMeters" placeholder="Meters" step=".1">
        </div>
        <button class="box-btn" @click="emit('remove')">Remove</button>
    </div>
</template>
<style scoped lang="scss">
.conf-container {
    display: flex;
    flex-direction: column;
    padding: .5rem;
    border: 1px var(--color-heading) solid;
    gap: .5rem;
    width: fit-content;

    h2 {
        margin: 0;
    }

    .setting {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: .5rem;
    }
}
</style>