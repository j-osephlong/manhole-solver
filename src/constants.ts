import type { ManholeConf, ManholePreset, PipePreset } from "./types"

export const MANHOLE_WIDTH_DEGREES = 360

export const DEFAULT_MANHOLE: ManholeConf = Object.freeze({
    heightMeters: 1.5,
    diameterMeters: 3.6576,
    minSpacingMeters: 0.1524,
})

export const PipePresets: PipePreset[] = [
    { name: "300", diameterMeters: .305, materialThicknessMeters: .0508},
    { name: "375", diameterMeters: .381, materialThicknessMeters: .05715},
    { name: "450", diameterMeters: .457, materialThicknessMeters: .06350},
    { name: "525", diameterMeters: .533, materialThicknessMeters: .06985},
    { name: "600", diameterMeters: .610, materialThicknessMeters: .07620},
    { name: "750", diameterMeters: .762, materialThicknessMeters: .08890},
    { name: "900", diameterMeters: .914, materialThicknessMeters: .1016},
    { name: "1050", diameterMeters: 1.067, materialThicknessMeters: .1143},
    { name: "1200", diameterMeters: 1.219, materialThicknessMeters: .1270},
    { name: "1350", diameterMeters: 1.370, materialThicknessMeters: .15875},
    { name: "1500", diameterMeters: 1.524, materialThicknessMeters: .1524},
    { name: "1800", diameterMeters: 1.829, materialThicknessMeters: .1778},
    { name: "2100", diameterMeters: 2.134, materialThicknessMeters: .2032},
    { name: "2400", diameterMeters: 2.438, materialThicknessMeters: .2286},
    { name: "3000", diameterMeters: 3.048, materialThicknessMeters: .2794},
    { name: "3600", diameterMeters: 3.658, materialThicknessMeters: .3302},
]

export const ManholePresets: ManholePreset[] = [
    { name: "1050/42", diameterMeters: 1.0668 },
    { name: "1200/48", diameterMeters: 1.2192 },
    { name: "1500/60", diameterMeters: 1.524 },
    { name: "1800/72", diameterMeters: 1.8288 },
    { name: "2100/84", diameterMeters: 2.1336 },
    { name: "2400/96", diameterMeters: 2.4384 },
    { name: "3000/120", diameterMeters: 3.048 },
    { name: "3600/144", diameterMeters: 3.6576 },
]