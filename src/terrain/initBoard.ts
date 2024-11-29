import {
    BoxGeometry,
    Euler,
    Group,
    InstancedMesh,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Object3D,
    PlaneGeometry,
    Quaternion,
    Vector3
} from "three";


import { initialPlayerPosition, initialPlayerRotation, map, mapLength, mapWidth, trees } from "../main";
import {
    extractGeometriesAndMaterialsFromGlb,
    extractGeometryAndMaterialFromModel,
    loadFbx
} from "../loader/model_loader";
import { generateCellConfig, Player } from "../misc";
import { generateWorld, instancedMesh } from "./worldGeneration";
import { CellType } from "../types";
import { animateCarInstance } from "./road";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { initAnimals, translateAnimal } from "./animalsGeneration";

export let board: Group = new Group();
export let cube: Object3D = await loadFbx("assets/models/", "Steve.fbx");
export let player: Player = new Player();

export async function initBoard(): Promise<Group> {
    cube.visible = false;
    try {
        cube.scale.set(0.0035, 0.0035, 0.0035);
        cube.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
    } catch (error) {
        console.error("An error happened while loading model:", error);
    }
    player.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
    player.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);
    player.add(cube);

    // scene.add(mesh);
    board.add(player);

    let countRoads = [0];
    let countTrees = [0, 0, 0];
    let countDeadTrees = [0, 0, 0];
    let countFlowers = [0, 0];
    let countRocks = [0, 0];
    let carSpawnPoint: Vector3[] = [];


    // === 🌲 MAP ===
    {
        generateWorld(countRoads, countTrees, countDeadTrees, countFlowers, countRocks);
    }

    // === 🌲 MAP INSTANCE ===
    {
        const cellConfig = generateCellConfig();

        const startingTime = new Date().getTime();
        console.log(countRoads, countTrees, countDeadTrees, countFlowers, countRocks);
        await Promise.all([
            instancedMesh("assets/models/streets/", "Street_Straight_full_row", countRoads, cellConfig),
            instancedMesh("assets/models/props/", "Flowers_", countFlowers, cellConfig),
            instancedMesh("assets/models/props/", "Rock_", countRocks, cellConfig),
            instancedMesh("assets/models/props/", "DeadTree_", countDeadTrees, cellConfig),
            instancedMesh("assets/models/props/", "Tree_", countTrees, cellConfig)]);
        const endTime = new Date().getTime();
        console.log(`Time to load all the models: ${endTime - startingTime}ms`);

        for (let z = 0; z < map.length; z++) {
            if (map[z][0] === CellType.ROAD) {
                const random = Math.random();
                carSpawnPoint.push(new Vector3((random < 0.5 ? 1 : -1 ) * mapWidth + (random < 0.5 ? -2 : 0), 0, z * 2));
            }
        }

        for (let i = 0; i < carSpawnPoint.length; i++) {
            const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 'red' }));
            cube.position.set(carSpawnPoint[i].x, carSpawnPoint[i].y, carSpawnPoint[i].z);
            cube.visible = false;
            board.add(cube);
        }

        const nbModelCars = 6;
        // each value in the array represent a model of car
        const carModelsByIndex = Array.from({ length: carSpawnPoint.length }, (_) => Math.floor(Math.random() * nbModelCars));


        // [nbModel0, nbModel1, nbModel2, nbModel3, nbModel4, nbModel5]
        let countCars: number[] = carModelsByIndex.reduce((acc, value) => {
            acc[value]++;
            return acc;
        }, Array.from({ length: nbModelCars }, () => 0));


        const [carGeometry, carMaterial] = await extractGeometriesAndMaterialsFromGlb("assets/models/cars/", "model", countCars.length);
        const carInstancedMeshes = Array.from({ length: countCars.length }, (_, n) => new InstancedMesh(carGeometry[n], carMaterial[n], countCars[n]));


        let countCurCarsInstanced = Array.from({ length: countCars.length }, () => 0);

        // for each cars not matter the model
        carModelsByIndex.forEach((modelValue, i) => {
            const position = carSpawnPoint[i];
            let rotation = new Euler(-Math.PI / 2, 0, -Math.PI / 2);
            if(carSpawnPoint[i].x < 0)
                rotation = new Euler(-Math.PI / 2, 0, Math.PI / 2);
            let scale = 0.5;

            if (modelValue === 5) {
                rotation = new Euler(0, -Math.PI / 2, 0);
                if(carSpawnPoint[i].x < 0)
                    rotation = new Euler(0, Math.PI / 2, 0);
                scale = 1;
            }

            // count the number of time each model of car is instanced
            const count = countCurCarsInstanced[modelValue];
            // carInstancedMeshes[modelValue] is the instanced mesh of the current car
            carInstancedMeshes[modelValue].setMatrixAt(count, new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(scale, scale, scale)));
            countCurCarsInstanced[modelValue]++;

            animateCarInstance(carInstancedMeshes[modelValue], count, carSpawnPoint[i], carGeometry[modelValue], modelValue);
        });

        carInstancedMeshes.forEach((instancedMesh) => {
            instancedMesh.position.set(0, 0.1, 0);
            board.add(instancedMesh);
        });


        /// === outline trees === ///
        await initBorderTrees(cellConfig);
    }

    // === 📦 FBX OBJECT ===
    {
        const randomArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 100));

        const highScore = Number(localStorage.getItem("highscore") || "0") || 0;

        for (let i = 4; i < randomArray.length; i++) {
            if (i === highScore) {
                await addHighScoreText(board, `Highscore ${highScore}`, 4, 0, i * 2 - 0.4);
            }
        }
    }
    // ==== 🌳 GROUND ====
    {
        const groundWidth = 20;
        const groundHeight = 150 * 2;
        const squareSize = 2;

        const lightGreenMaterial = new MeshBasicMaterial({
            color: '#BEF466',
            side: 2,
        });
        const darkGreenMaterial = new MeshBasicMaterial({
            color: '#B7EC5E',
            side: 2,
        });

        for (let z = 0; z < groundHeight; z += squareSize) {
            for (let x = -groundWidth / 2 - 2; x < groundWidth / 2; x += squareSize) {
                const groundGeometry = new PlaneGeometry(squareSize, squareSize);
                const isLightGreen = (x / squareSize + z / squareSize) % 2 === 0;
                const groundMaterial = isLightGreen ? lightGreenMaterial : darkGreenMaterial;
                const groundSquare = new Mesh(groundGeometry, groundMaterial);
                groundSquare.position.set(x + squareSize / 2 + 1, -0.01, z + squareSize / 2 - 25);
                groundSquare.receiveShadow = true;
                groundSquare.rotateX(-Math.PI / 2);

                board.add(groundSquare);
            }
        }

        const groundGeometry = new PlaneGeometry(groundWidth, groundHeight);
        for (let i = 0; i < 2; i++) {
            const groundMaterialOutside = new MeshBasicMaterial({
                color: '#A4D74C',
                side: 2,
            })
            const groundOutside = new Mesh(groundGeometry, groundMaterialOutside)
            groundOutside.position.y = -0.01
            groundOutside.receiveShadow = true
            groundOutside.rotateX(-Math.PI / 2)
            groundOutside.position.z = groundGeometry.parameters.height / 2 - 25
            groundOutside.position.x = i === 0 ? -21 : 21
            board.add(groundOutside)
        }

    }
    board.position.set(0, 0, 0);

    const [animal, hitBox] = await initAnimals();
    animal.position.x = -4;
    animal.position.z = 6;

    translateAnimal(animal, 32, hitBox);
    board.add(animal)
    return board;

}

async function addHighScoreText(board: Group, text: string, x: number, y: number, z: number) {
    const loader = new FontLoader();
    const font = await loader.loadAsync('https://threejs.org/examples/fonts/gentilis_bold.typeface.json');

    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 1,
        depth: 0.1,
    });

    const textMaterial = new MeshBasicMaterial({ color: 'white' });
    const textMesh = new Mesh(textGeometry, textMaterial);

    textMesh.position.set(x, y, z);
    textMesh.rotation.x = Math.PI / 2;
    textMesh.rotation.y = Math.PI;
    board.add(textMesh);
}

async function initBorderTrees(cellConfig : ReturnType<typeof generateCellConfig>)
{
    const { geometry, material } = extractGeometryAndMaterialFromModel(
        await loadFbx("assets/models/props/", "Tree_1.fbx")
    );
    const instancedMeshTree = new InstancedMesh(geometry, material, mapWidth * 2 +2);
    const scaleX = cellConfig[CellType.TREE_1]?.scaleX || 1;
    const scaleY = cellConfig[CellType.TREE_1]?.scaleY || 1
    const scaleZ = cellConfig[CellType.TREE_1]?.scaleZ || 1;


    // let do the outline left and right
    const dummy = new Object3D();

    for (let j = 0; j <= mapWidth*2; j+=2) {
        instancedMeshTree.setMatrixAt(j, new Matrix4().compose(new Vector3(j - mapWidth, 0,-2), new Quaternion(), new Vector3(scaleX, scaleY, scaleZ)));
        instancedMeshTree.getMatrixAt(j, dummy.matrix);
        const tempMesh = new Mesh(geometry);
        tempMesh.applyMatrix4(dummy.matrix);
        tempMesh.position.x -= mapWidth;
        trees.push(tempMesh as Object3D);


        instancedMeshTree.setMatrixAt(j+1, new Matrix4().compose(new Vector3(j - mapWidth, 0, mapLength*2), new Quaternion(), new Vector3(scaleX, scaleY, scaleZ)));
        instancedMeshTree.getMatrixAt(j+1, dummy.matrix);
        const tempMesh2 = new Mesh(geometry);
        tempMesh2.applyMatrix4(dummy.matrix);
        tempMesh2.position.x -= mapWidth;
        trees.push(tempMesh2 as Object3D);
    }

    instancedMeshTree.position.set(0, 0.1, 0);
    board.add(instancedMeshTree);
}
