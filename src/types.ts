
export type ManholeConf = {
    heightMeters: number,
    diameterMeters: number,
    minSpacingMeters: number,
}

export type PipeConf = {
    radiusMeters: number,
    xDegrees: number,
    heightMeters: number,
    materialThicknessMeters: number,
    presetName: string,
    uuid: string,
}

export type PipePreset = {
    name: string,
    diameterMeters: number,
    materialThicknessMeters: number,
}

export type ManholePreset = {
    name: string,
    diameterMeters: number,
}