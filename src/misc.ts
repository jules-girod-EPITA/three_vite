import { CellType } from "./types";
import { Euler } from "three";


type CellConfig = {
    scale: number;
    rotation?: Euler;
    randomRotation?: boolean;
    randomPosition?: boolean;
};

export function generateCellConfig() {
    const cellConfig: {
        [key in CellType]: CellConfig | null;
    } = {
        [CellType.ROAD]: {
            scale: 0.25,
            rotation: new Euler(0, Math.PI / 2, 0),
            randomPosition: false,
        },
        [CellType.FLOWERS_1]: {
            scale: 0.2,
            randomRotation: true,
            randomPosition: true,
        },
        [CellType.FLOWERS_2]: {
            scale: 0.2,
            randomRotation: true,
            randomPosition: true,
        },
        [CellType.ROCK_1]: {
            scale: 0.35,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.ROCK_2]: {
            scale: 0.35,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_1]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_2]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_3]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_1]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_2]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_3]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.Empty]: null,
    };
    return cellConfig;
}
