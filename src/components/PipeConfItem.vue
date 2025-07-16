<script setup lang="ts">
import { PipePresets } from '@/constants';
import type { PipeConf } from '@/types';
import { watch } from 'vue';


const model = defineModel<PipeConf>({required: true})
defineProps<{
    index: number
}>()
const emit = defineEmits<{
    remove: []
}>()
watch(() => model.value.presetName, (name) => {
    const preset = PipePresets.find((preset) => preset.name == name)
    if (preset) {
        model.value.radiusMeters = preset.diameterMeters / 2
        model.value.materialThicknessMM = preset.materialThicknessMM
    }
})

</script>
<template>
    <div class="conf-container">
        <h2>Pipe {{ index + 1 }}</h2>
        <div class="setting">
            <label>Preset</label>
            <select v-model="model.presetName" >
                <option v-for="preset in PipePresets" :key="preset.name" :value="preset.name">{{ preset.name }}</option>
            </select>
        </div>
        <div class="setting">
            <label>Angle (degrees)</label>
            <input type="number" v-model="model.xDegrees" placeholder="0° - 360°" max="360" min="0" step="3">
        </div>
        <div class="setting">
            <label>Invert Elevation (m)</label>
            <input type="number" v-model="model.invertElevationMeters" placeholder="Meters" step=".25">
        </div>
        <div class="setting">
            <label>Radius (m)</label>
            <input type="number" v-model="model.radiusMeters" placeholder="Meters" step=".1">
        </div>
        <div class="setting">
            <label>Material Thickness (mm)</label>
            <input type="number" v-model="model.materialThicknessMM" placeholder="Meters" step="5">
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