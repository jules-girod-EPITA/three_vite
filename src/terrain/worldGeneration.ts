import { map, mapLength, mapWidth, trees } from "../main";
import { CellType } from "../types";
import { extractGeometriesAndMaterialsFromFbx } from "../loader/model_loader";
import { BufferGeometry, Euler, InstancedMesh, Material, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from "three";
import { generateCellConfig } from "../misc";
import { board } from "./initBoard";


export function generateWorld(countRoads: number[], countTrees: number[], countDeadTrees: number[], countFlowers: number[], countRocks: number[]) {
    // Fill the map using random values
    const randomMap = Array.from({ length: mapLength }, () => Array.from({ length: mapWidth }, () => Math.random() * 100));
    // [0 to 50] = road (set to -1)
    // [50 to 100] = grass or empty

    // [51 - 53.5[ = Tree

    // [53.5 - 56[ = Dead tree
    // [56 - 66[ = Flowers
    // [66 - 68.5[ = Rock
    // [68.5 - 100] =  empty
    for (let z = 5; z < randomMap.length; z++) {
        if (randomMap[z][0] <= 50) {
            randomMap[z] = Array.from({ length: mapWidth }, () => -1);
        }

        for (let x = 0; x < randomMap[z].length; x++) {
            if (randomMap[z][x] === -1 && x === 0) {
                map[z][x] = CellType.ROAD;
                countRoads[0]++;
            } else if (randomMap[z][x] <= 50) {
                map[z][x] = CellType.Empty;
            } else if (randomMap[z][x] <= 53.5) {
                if (randomMap[z][x] < 50 + (3.5 / 3)) {
                    map[z][x] = CellType.TREE_1;
                    countTrees[0]++;
                } else if (randomMap[z][x] < 50 + (3.5 / 3) * 2) {
                    map[z][x] = CellType.TREE_2;
                    countTrees[1]++;
                } else {
                    map[z][x] = CellType.TREE_3;
                    countTrees[2]++;
                }
            } else if (randomMap[z][x] <= 56) {
                if (randomMap[z][x] < 53.5 + 3.5 / 3) {
                    map[z][x] = CellType.DEADTREE_1;
                    countDeadTrees[0]++;
                } else if (randomMap[z][x] < 53.5 + (3.5 / 3) * 2) {
                    map[z][x] = CellType.DEADTREE_2;
                    countDeadTrees[1]++;
                } else {
                    map[z][x] = CellType.DEADTREE_3;
                    countDeadTrees[2]++;
                }
            } else if (randomMap[z][x] <= 66) {
                if (randomMap[z][x] < 56 + 10 / 2) {
                    map[z][x] = CellType.FLOWERS_1;
                    countFlowers[0]++;
                } else {
                    map[z][x] = CellType.FLOWERS_2;
                    countFlowers[1]++;
                }
            } else if (randomMap[z][x] <= 68.5) {
                if (randomMap[z][x] < 66 + 2.5 / 2) {
                    map[z][x] = CellType.ROCK_1;
                    countRocks[0]++;
                } else {
                    map[z][x] = CellType.ROCK_2;
                    countRocks[1]++;
                }
            } else {
                map[z][x] = CellType.Empty;
            }
        }
    }
    for (let z = 0; z < map.length; z++) {
        for (let x = 0; x < 4; x++) {
            if (map[z][0] !== CellType.ROAD) {
                // random between 0, 1, 2
                const random = Math.floor(Math.random() * 3);
                map[z][x] = CellType.TREE_1 + random;
                countTrees[random]++;

                const random2 = Math.floor(Math.random() * 3);
                map[z][map[z].length - x] = CellType.TREE_1 + random;
                countTrees[random]++;
            }
        }
        if (map[z][0] !== CellType.ROAD) {
            const random = Math.floor(Math.random() * 3);
            map[z][map[z].length - 4] = CellType.TREE_1 + random;
            countTrees[random]++;
        }
    }
}




export async function instancedMesh(path: string, fileName: string, modelCount: number[], cellConfig : ReturnType<typeof generateCellConfig>) {
    const [modelGeometries, modelMaterials] = await extractGeometriesAndMaterialsFromFbx(path, fileName, modelCount.length);
    const instancedMeshes = Array.from({ length: modelCount.length }, (_, n) => new InstancedMesh(modelGeometries[n], modelMaterials[n], modelCount[n]));
    let modelIndexes = Array.from({ length: modelCount.length }, () => 0);

    instancedMeshes.forEach((instancedMesh) => {
        instancedMesh.position.set(-mapWidth, 0, 0);
        board.add(instancedMesh);
    });


    for (let z = 0; z < map.length; z++) {
        for (let x = 0; x < map[0].length; x++) {
            if (fileName === "Street_Straight_full_row" && map[z][x] === CellType.ROAD && x === 0)
            {
                instantiateMesh(cellConfig, map[z][x], instancedMeshes[0], modelIndexes[0], modelIndexes, 0, x, z);
            }
            else if(fileName === "Tree_" && (map[z][x] === CellType.TREE_1 || map[z][x] === CellType.TREE_2 || map[z][x] === CellType.TREE_3))
            {
                instantiateMesh(cellConfig, map[z][x], instancedMeshes[map[z][x] - CellType.TREE_1], modelIndexes[map[z][x] - CellType.TREE_1], modelIndexes, map[z][x] - CellType.TREE_1, x, z);
            }
            else if(fileName === "DeadTree_" && (map[z][x] === CellType.DEADTREE_1 || map[z][x] === CellType.DEADTREE_2 || map[z][x] === CellType.DEADTREE_3))
            {
                instantiateMesh(cellConfig, map[z][x], instancedMeshes[map[z][x] - CellType.DEADTREE_1], modelIndexes[map[z][x] - CellType.DEADTREE_1], modelIndexes, map[z][x] - CellType.DEADTREE_1, x, z);
            }
            else if(fileName === "Flowers_" && (map[z][x] === CellType.FLOWERS_1 || map[z][x] === CellType.FLOWERS_2))
            {
                instantiateMesh(cellConfig, map[z][x], instancedMeshes[map[z][x] - CellType.FLOWERS_1], modelIndexes[map[z][x] - CellType.FLOWERS_1], modelIndexes, map[z][x] - CellType.FLOWERS_1, x, z);
            }
            else if(fileName === "Rock_" && (map[z][x] === CellType.ROCK_1 || map[z][x] === CellType.ROCK_2))
            {
                instantiateMesh(cellConfig, map[z][x], instancedMeshes[map[z][x] - CellType.ROCK_1], modelIndexes[map[z][x] - CellType.ROCK_1], modelIndexes, map[z][x] - CellType.ROCK_1, x, z);
            }
        }
    }
    if (fileName === "DeadTree_" || fileName === "Tree_")
    {
        addCollision(modelGeometries, instancedMeshes, modelCount);
    }
}

export function instantiateMesh(cellConfig: ReturnType<typeof generateCellConfig>, cellType: CellType, instancedMesh : InstancedMesh, index : number, indexArray: number[],meshIndex: number , x: number, z: number) {
    const config = cellConfig[cellType];
    if (config === null)
        return;

    const position = new Vector3(x * 2 + (config.randomPosition ? Math.random() : 0), 0, z * 2 + (config.randomPosition ? Math.random() : 0));
    const rotation = config.randomRotation ? new Euler(0, (Math.random() < 0.5 ? 1 : 0) * Math.PI, 0) : config.rotation || new Euler();
    const scaleX = config.scaleX;
    const scaleY = config.scaleY;
    const scaleZ = config.scaleZ;

    instancedMesh.setMatrixAt(index, new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(scaleX, scaleY, scaleZ)));
    indexArray[meshIndex]++;
}

function addCollision(geometries: BufferGeometry[] | (Material | Material[])[], meshes: InstancedMesh[], countDiffElement: number[]) {
    const dummy = new Object3D();
    for (let i = 0; i < countDiffElement.length; i++) {
        for (let j = 0; j < countDiffElement[i]; j++) {
            meshes[i].getMatrixAt(j, dummy.matrix);
            const tempMesh = new Mesh(geometries[i]);
            tempMesh.applyMatrix4(dummy.matrix);
            tempMesh.position.x -= mapWidth;

            // TODO REMOVE : Create a BoxHelper for this temporary mesh
            // const boundingBoxHelper = new BoxHelper(tempMesh, 0xffff00); // Yellow color

            trees.push(tempMesh as Object3D);
            // const boxHelper = new BoxHelper(tempMesh, 0xffff00);
            // board.add(boxHelper);
        }
    }
}