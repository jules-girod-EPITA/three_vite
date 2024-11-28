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


import { homeDecors, initialPlayerPosition, initialPlayerRotation, map, mapWidth } from "../main";
import { extractGeometriesAndMaterialsFromGlb, loadFbx, loadGlb } from "../loader/model_loader";
import { generateCellConfig, Player } from "../misc";
import { generateWorld, instancedMesh } from "./worldGeneration";
import { CellType } from "../types";
import { animateCarInstance } from "./road";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

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

    const meshesWithoutCollision = ["Street", "Tree_1002"];
    try {
        const crash_site = await loadGlb("assets/models/scene/", "crash_scene_2.glb");
        crash_site.traverse((child) => {
            if (child instanceof Mesh) {
                // get collision box
                // get if the mesh is a collision box

                if (!meshesWithoutCollision.some((meshName) => { return child.name.includes(meshName) })) {
                    child.userData.speed = 1;
                    homeDecors.push(child as Object3D);
                }
            }
        })

        board.add(crash_site);
    } catch (error) {
        console.error("An error happened while loading model:", error);
    }

    try {
        let hospital_site = await loadGlb("assets/models/scene/", "hospital_scene.glb");
        hospital_site.traverse((child) => {
            if (child instanceof Mesh) {

                if (!meshesWithoutCollision.some((meshName) => { return child.name.includes(meshName) })) {
                    child.userData.speed = 1;
                    homeDecors.push(child as Object3D);
                }
            }
        })

        hospital_site.position.set(4, 0, 103 * 2);
        hospital_site.rotateY(Math.PI)

        board.add(hospital_site);
    } catch (error) {
        console.error("An error happened while loading model:", error);
    }

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
                carSpawnPoint.push(new Vector3(mapWidth - 2, 0, z * 2));
            }
        }

        for (let i = 0; i < carSpawnPoint.length; i++) {
            const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 'red' }));
            cube.position.set(carSpawnPoint[i].x, carSpawnPoint[i].y, carSpawnPoint[i].z);
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
            let scale = 0.5;

            if (modelValue === 5) {
                rotation = new Euler(0, -Math.PI / 2, 0);
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
        const squareSize = 2; // Size of each square in the checkerboard pattern

        const lightGreenMaterial = new MeshStandardMaterial({
            color: '#BEF466',
            side: 2,
        });
        const darkGreenMaterial = new MeshStandardMaterial({
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
            const groundMaterialOutside = new MeshStandardMaterial({
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