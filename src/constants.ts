import type { ManholeConf, ManholePreset, PipePreset } from "./types"

export const MANHOLE_WIDTH_DEGREES = 360

export const DEFAULT_MANHOLE: ManholeConf = Object.freeze({
    rimElevationMeters: 1.5,
    diameterMeters: 3.6576,
    minSpacingMeters: 0.1524,
})

export const PipePresets: PipePreset[] = [
    { name: "100 (PVC)", diameterMeters: .10094, materialThicknessMM: 3.06},
    { name: "135 (PVC)", diameterMeters: .13508, materialThicknessMM: 4.09},
    { name: "150 (PVC)", diameterMeters: .15029, materialThicknessMM: 4.55},
    { name: "200 (PVC)", diameterMeters: .20116, materialThicknessMM: 6.1},
    { name: "250 (PVC)", diameterMeters: .25146, materialThicknessMM: 7.62},
    { name: "300", diameterMeters: .305, materialThicknessMM: 50.8},
    { name: "375", diameterMeters: .381, materialThicknessMM: 57.15},
    { name: "450", diameterMeters: .457, materialThicknessMM: 63.50},
    { name: "525", diameterMeters: .533, materialThicknessMM: 69.85},
    { name: "600", diameterMeters: .610, materialThicknessMM: 76.20},
    { name: "750", diameterMeters: .762, materialThicknessMM: 88.90},
    { name: "900", diameterMeters: .914, materialThicknessMM: 101.6},
    { name: "1050", diameterMeters: 1.067, materialThicknessMM: 114.3},
    { name: "1200", diameterMeters: 1.219, materialThicknessMM: 127.0},
    { name: "1350", diameterMeters: 1.370, materialThicknessMM: 158.75},
    { name: "1500", diameterMeters: 1.524, materialThicknessMM: 152.4},
    { name: "1800", diameterMeters: 1.829, materialThicknessMM: 177.8},
    { name: "2100", diameterMeters: 2.134, materialThicknessMM: 203.2},
    { name: "2400", diameterMeters: 2.438, materialThicknessMM: 228.6},
    { name: "3000", diameterMeters: 3.048, materialThicknessMM: 279.4},
    { name: "3600", diameterMeters: 3.658, materialThicknessMM: 330.2},
]

export const ManholePresets: ManholePreset[] = [
    { name: "750/30", diameterMeters: .762 },
    { name: "1050/42", diameterMeters: 1.0668 },
    { name: "1200/48", diameterMeters: 1.2192 },
    { name: "1500/60", diameterMeters: 1.524 },
    { name: "1800/72", diameterMeters: 1.8288 },
    { name: "2100/84", diameterMeters: 2.1336 },
    { name: "2400/96", diameterMeters: 2.4384 },
    { name: "3000/120", diameterMeters: 3.048 },
    { name: "3600/144", diameterMeters: 3.6576 },
]