
export type ManholeConf = {
    rimElevationMeters: number,
    diameterMeters: number,
    minSpacingMeters: number,
}

export type PipeConf = {
    radiusMeters: number,
    xDegrees: number,
    invertElevationMeters: number,
    materialThicknessMM: number,
    presetName: string,
    uuid: string,
}

export type PipePreset = {
    name: string,
    diameterMeters: number,
    materialThicknessMM: number,
}

export type ManholePreset = {
    name: string,
    diameterMeters: number,
}

export type System = {
    manhole: ManholeConf,
    pipes: PipeConf[],
    manholeVisibleSectionHeight: number,
    manholeVisibleSectionBottomElevation: number,
}

export function getManholeVisibleSectionHeightMeters(system: System) {
    const lowestPipeElevation = Math.min(...system.pipes.map(p => p.invertElevationMeters)) || 0   
    return Math.max(system.manhole.rimElevationMeters - lowestPipeElevation, 1)
}

export function getManholeVisibleSectionBottomMeters(system: System) { 
    return system.manhole.rimElevationMeters - getManholeVisibleSectionHeightMeters(system)
}

export function getPipeCenterElevation(pipe: PipeConf) {
    return pipe.invertElevationMeters + pipe.radiusMeters
}

export function circumference(r: number) {
    return (2 * Math.PI * r)
}