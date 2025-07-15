<script setup lang="ts">
import { ManholePresets } from '@/constants';
import type { ManholeConf } from '@/types';


const model = defineModel<ManholeConf>({required: true})
</script>
<template>
    <div class="conf-container">
        <div class="setting">
            <label>Diameter</label>
            <select v-model="model.diameterMeters">
                <option v-for="preset in ManholePresets" :key="preset.name" :value="preset.diameterMeters">{{ preset.name }}</option>
            </select>
            {{ model.diameterMeters }}
        </div>
        <div class="setting">
            <label>Structure Height</label>
            <input type="number" v-model="model.heightMeters" placeholder="Meters" step=".25">
        </div>
        <div class="setting">
            <label>Minimum Pipe Spacing</label>
            <input type="number" v-model="model.minSpacingMeters" placeholder="Meters" step=".1">
        </div>
    </div>
</template>
<style scoped lang="scss">
.conf-container {
    display: flex;
    padding: .5rem;
    border: 1px var(--color-heading) solid;
    gap: .5rem;
    width: 100%;

    h2 {
        margin: 0;
        white-space: nowrap;
    }

    .setting {
        width: 100%;
        display: flex;
        align-items: center;
        gap: .5rem;
        flex-grow: 0;
    }
}
</style>