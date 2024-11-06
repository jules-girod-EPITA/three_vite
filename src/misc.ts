import { CellType } from "./types";
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";

type CellConfig = {
    meshArray: InstancedMesh[];
    indexArray: number[];
    scale: number;
    rotation?: Euler;
    randomRotation?: boolean;
    randomPosition?: boolean;
    meshIndex?: number;
};


export function generateCellConfig(roadInstancedMeshs: InstancedMesh[], roadIndexes: number[], flowerInstancedMeshs: InstancedMesh[], flowerIndexes: number[], rockInstancedMeshs: InstancedMesh[], rockIndexes: number[], deadTreeInstancedMeshs: InstancedMesh[], deadTreeIndexes: number[], treeInstancedMeshs: InstancedMesh[], treeIndexes: number[]) {
    const cellConfig: {
        [key in CellType]: CellConfig | null;
    } = {
        [CellType.ROAD]: {
            meshArray: roadInstancedMeshs,
            indexArray: roadIndexes,
            scale: 0.25,
            rotation: new Euler(0, Math.PI / 2, 0),
            randomPosition: false,
            meshIndex: 0
        },
        [CellType.FLOWERS_1]: {
            meshArray: flowerInstancedMeshs,
            indexArray: flowerIndexes,
            scale: 0.2,
            randomRotation: true,
            randomPosition: true,
            meshIndex: 0,
        },
        [CellType.FLOWERS_2]: {
            meshArray: flowerInstancedMeshs,
            indexArray: flowerIndexes,
            scale: 0.2,
            randomRotation: true,
            randomPosition: true,
            meshIndex: 1,
        },
        [CellType.ROCK_1]: {
            meshArray: rockInstancedMeshs,
            indexArray: rockIndexes,
            scale: 0.35,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 0,
        },
        [CellType.ROCK_2]: {
            meshArray: rockInstancedMeshs,
            indexArray: rockIndexes,
            scale: 0.35,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 1,
        },
        [CellType.DEADTREE_1]: {
            meshArray: deadTreeInstancedMeshs,
            indexArray: deadTreeIndexes,
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 0,
        },
        [CellType.DEADTREE_2]: {
            meshArray: deadTreeInstancedMeshs,
            indexArray: deadTreeIndexes,
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 1,
        },
        [CellType.DEADTREE_3]: {
            meshArray: deadTreeInstancedMeshs,
            indexArray: deadTreeIndexes,
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 2,
        },
        [CellType.TREE_1]: {
            meshArray: treeInstancedMeshs,
            indexArray: treeIndexes,
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 0,
        },
        [CellType.TREE_2]: {
            meshArray: treeInstancedMeshs,
            indexArray: treeIndexes,
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 1,
        },
        [CellType.TREE_3]: {
            meshArray: treeInstancedMeshs,
            indexArray: treeIndexes,
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
            meshIndex: 2,
        },
        [CellType.Empty]: null,
    };
    return cellConfig;
}

export function instantiateCell(cellConfig: ReturnType<typeof generateCellConfig>, cellType: CellType, x: number, z: number) {
    const config = cellConfig[cellType];
    if (config === null)
        return;

    const position = new Vector3(x * 2 + (config.randomPosition ? Math.random() : 0), 0, z * 2 + (config.randomPosition ? Math.random() : 0));
    const rotation = config.randomRotation ? new Euler(0, (Math.random() < 0.5 ? 1 : 0) * Math.PI, 0) : config.rotation || new Euler();
    const scale = config.scale;

    const meshIndex = config.meshIndex || 0;
    const mesh = config.meshArray[meshIndex];
    const index = config.indexArray[meshIndex];

    // Set the matrix and update index
    mesh.setMatrixAt(index, new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(scale, scale, scale)));
    config.indexArray[meshIndex]++;
}