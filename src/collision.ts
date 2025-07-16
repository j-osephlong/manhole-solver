import { MANHOLE_WIDTH_DEGREES } from "./constants";
import { circumference, type ManholeConf, type PipeConf, type System } from "./types";

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
export class CollisionDetection {
    cellSize?: number
    manhole?: ManholeConf
    pipes?: PipeConf[]
    /** Pipes mapped into their spatial hashing cells  */
    cells: Map<string ,PipeConf[]>
    /** list of all collisions in the system, by pipe uuid mapped to a list of colliding pipe uuids */
    collisions: [PipeConf, PipeConf][]

    constructor(system: System) {
        this.cells = new Map()
        this.collisions = []

        this.manhole = system.manhole
        this.pipes = system.pipes
        this.cellSize = this.chooseCellSize()
        this.cells = this.buildCells()
        this.collisions = this.getCollisions()
    }

    cellhash(conf: PipeConf): string {
        if (!this.manhole || !this.pipes || this.cellSize === undefined) {
            throw new Error("Not initialized.")
        }
        const pipeXMeters = circumference(this.manhole.diameterMeters / 2) / MANHOLE_WIDTH_DEGREES * conf.xDegrees
        const cellX = Math.floor(pipeXMeters / this.cellSize)
        const cellY = Math.floor((conf.invertElevationMeters + conf.radiusMeters) / this.cellSize)
        return `${cellX}:${cellY}`
    }

    hashToComponents(hash: string) {
        const [xStr, yStr] = hash.split(":")
        const x = Number.parseInt(xStr)
        const y = Number.parseInt(yStr)
        return [x, y] as const
    } 

    componentsToHash([x, y]: [number, number]) {
        return `${x}:${y}`
    }

    chooseCellSize() {
        if (!this.manhole || !this.pipes) {
            throw new Error("Not initialized.")
        }
        return this.manhole.minSpacingMeters + Math.max(...this.pipes.map(p => p.radiusMeters + p.materialThicknessMM / 1000)) * 2
    }

    buildCells() {
        if (!this.pipes) {
            throw new Error("Not initialized.")
        }
        const map = new Map<string, PipeConf[]>()
        for (const conf of this.pipes) {
            const hash = this.cellhash(conf)
            if (!map.has(hash))
                map.set(hash, [])
                map.get(hash)?.push(conf)
        }
        return map
    }

    distanceBetween(conf1: PipeConf, conf2: PipeConf) {
        if (!this.manhole) {
            throw new Error("Not initialized.")
        }
        const pipe1XCenterMeters = circumference(this.manhole.diameterMeters / 2) / MANHOLE_WIDTH_DEGREES * (conf1.xDegrees)
        const pipe1TotalRadius = conf1.radiusMeters + conf1.materialThicknessMM / 1000
        const pipe2XCenterMeters = circumference(this.manhole.diameterMeters / 2) / MANHOLE_WIDTH_DEGREES * (conf2.xDegrees)
        const pipe2TotalRadius = conf2.radiusMeters + conf2.materialThicknessMM / 1000
        const distance1 = Math.sqrt(((pipe2XCenterMeters - pipe1XCenterMeters))** 2 + ((conf2.invertElevationMeters + conf2.radiusMeters) - (conf1.invertElevationMeters + conf1.radiusMeters)) ** 2) - (pipe1TotalRadius + pipe2TotalRadius)
        const distance2 = Math.sqrt(((pipe2XCenterMeters - pipe1XCenterMeters - circumference(this.manhole.diameterMeters / 2)))** 2 + ((conf2.invertElevationMeters + conf2.radiusMeters) - (conf1.invertElevationMeters + conf1.radiusMeters)) ** 2) - (pipe1TotalRadius + pipe2TotalRadius)

        return Math.min(distance1, distance2)
    }

    isPipeColliding(conf1: PipeConf, conf2: PipeConf) {
        if (!this.manhole || !this.pipes) {
            throw new Error("Not initialized.")
        }
        
        const minDistance = this.distanceBetween(conf1, conf2)

        if (minDistance < this.manhole.minSpacingMeters) {
            return true
        }

        return false
    }

    getAdjacentCells(hash: string) {
        const [x, y] = this.hashToComponents(hash)
        const possibleCellsComponents: [number, number][] = [
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
        const possibleHashes = []
        // iterate through possible cells
        for (const cell of possibleCellsComponents) {
            if (cell[0] < 0) cell[0] += this.numCellsX - 1
            if (cell[0] > this.numCellsX - 1) cell[0] -= this.numCellsX - 1
            possibleHashes.push(this.componentsToHash(cell))
        }
        return possibleHashes
    }

    /** list all pipes colliding with this pipe.  */
    getPipeCollisions(conf: PipeConf) {
        const collisions: PipeConf[] = []
        const hash1 = this.cellhash(conf)
        // list of all cells where a collision is possible
        const possibleCells = this.getAdjacentCells(hash1)
        // iterate through possible cells
        for (const hash2 of possibleCells) {
            // iterate through all pipes in those cells and check if they collide
            const confs = this.cells.get(hash2) ?? []
            for (const conf2 of confs) {
                if (conf2.uuid != conf.uuid && (this.isPipeColliding(conf, conf2))) {
                    collisions.push(conf2)
                }
            }
        }
        return collisions
    }

    get numCellsX() {
        if (!this.manhole || !this.cellSize) {
            throw new Error("Not initialized.")
        }
        return Math.ceil(circumference(this.manhole.diameterMeters / 2) / this.cellSize)
    }

    getCollisions() {
        if (!this.manhole || !this.pipes) {
            throw new Error("Not initialized.")
        }
        const l: [PipeConf, PipeConf][] = []
        // iterate through all pipes
        for (const conf of this.pipes) {
            // get collisions 
            const collisions = this.getPipeCollisions(conf)
            // make list of colliding pipe uuids and mad to current pipe
            for (const collision of collisions) {
                l.push([conf, collision])
            }
        }
        return l
    }
}