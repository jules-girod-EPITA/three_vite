import {
    AmbientLight,
    BoxGeometry,
    BoxHelper,
    BufferGeometry,
    Euler,
    Group,
    InstancedMesh,
    LoadingManager,
    Material,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Object3D,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Quaternion,
    Scene,
    SpotLight,
    Vector3,
    WebGLRenderer,
} from 'three'

import Stats from 'three/examples/jsm/libs/stats.module'
import { resizeRendererToDisplaySize } from './helpers/responsiveness'
import './style.css'
import {
    extractGeometriesAndMaterialsFromFbx,
    extractGeometriesAndMaterialsFromGlb,
    loadFbx,
    loadGlb
} from "./loader/model_loader";
import { handleButtonClick, handleUpArrow, initButtonBehavior } from "./components/buttonBehavior";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { gsap } from "gsap";
import { eventListenerMouvement } from "./controller/controller";
import { checkCollisionsCars, checkCollisionsRocks, checkCollisionsTree } from "./collision/collision";
import { CellType } from "./types";
import { generateCellConfig, instantiateCell } from "./misc";
import { animateCarInstance } from "./terrain/road";

class Player extends Object3D {
    private readonly onUpdate: () => void;
    private death: boolean = false;
    public done: boolean = false;
    private animationDone: number= 0;

    constructor() {
        super();
        this.onUpdate = () => {
            if(this.death && camera.parent === player && !this.done) {
                const cameraRealPosition = camera.getWorldPosition(new Vector3());
                scene.remove(camera);
                camera.position.set(cameraRealPosition.x, cameraRealPosition.y, cameraRealPosition.z);
                scene.add(camera);
                const direction = new Vector3();
                direction.subVectors(camera.position, player.position).normalize();
                gsap.to(camera.position, {
                    duration: 1.5,
                    x: camera.position.x + direction.x,
                    y: camera.position.y + direction.y,
                    z: camera.position.z + direction.z,
                    ease: "none",
                });

                const originalIntensity = ambientLight.intensity;

                gsap.to(ambientLight, {
                    duration: 3,
                    intensity: 0,
                    onComplete: () => {
                        ambientLight.intensity = originalIntensity;
                        reset();
                    }
                });

            }
            else if (this.position.z === 111 * 2 && !this.death && !this.done) {
                this.done = true;
                scene.remove(camera);
                camera.position.set(-6, 3.5, 222);
                scene.add(camera);
                camera.lookAt(2.5, 2, 230);

                player.position.set(0, 0, 111 *2);

                gsap.to(player.position, {
                    duration: 1,
                    z: 226,
                    ease: "none",
                    onComplete: () => {
                        gsap.to(cube.rotation, {
                            duration: 0.7,
                            y: Math.PI /2,
                            ease: "none",
                        });
                        gsap.to(player.position, {
                            duration: 0.35,
                            y: 0.28,
                            z: 227.6,
                            ease: "none",
                            onComplete: () => {
                                gsap.to(player.position, {
                                    duration: 0.35,
                                    x: 2,
                                    z: 228.2,
                                    ease: "none",
                                    onComplete: () => {
                                        this.animationDone = 1;
                                    }
                                });
                            }
                        });

                    }
                });
            }
            else if(this.animationDone === 1)
            {
                this.animationDone = 2;
                const lightIntensity = 1000;
                const spotLight = new SpotLight('red', lightIntensity);
                spotLight.position.set(0, 8.5, 244);
                scene.add(spotLight);

                gsap.to(spotLight, {
                    duration: 0.5,
                    intensity: 0,
                    repeat: 5,
                    ease: "bounce.inOut",
                    onComplete: () => {
                        const originalIntensity = ambientLight.intensity;


                        gsap.to(ambientLight, {
                            duration: 3,
                            intensity: 0,
                            onComplete: () => {
                                ambientLight.intensity = originalIntensity;
                                reset();
                            }
                        });
                    }
                });

            }

        };
    }

    setDeath() {
        this.death = true;
    }

    isDead() {
        return this.death;
    }

    updateMatrixWorld(force?: boolean): void {

        super.updateMatrixWorld(force);
        this.onUpdate();
    }
}


const CANVAS_ID = 'scene'

let hospital_site: Object3D

let canvas: HTMLElement
let renderer: WebGLRenderer
export let scene: Scene
let loadingManager: LoadingManager
let ambientLight: AmbientLight
export let cube: Object3D
export let player: Player
export let camera: PerspectiveCamera
let stats: Stats
let homeDecors: Object3D[] = [];

const mapLength = 100;
export const mapWidth = 18;
const map: CellType[][] = Array.from({ length: mapLength }, () => Array.from({ length: mapWidth }, () => CellType.Empty));



const initialCameraPosition = new Vector3(-1, 6, -5.5);
const initialPlayerPosition = new Vector3(0, 0, 0);
const initialPlayerRotation = new Vector3(0, 0, 0);

let trees: Object3D[] = [];
let rocks: Object3D[] = [];
let carSpawnPoint: Vector3[] = [];

export const playableArea = 9 * 2;

export const sideLength = 1


initButtonBehavior();
init().then(
    () => {
        animate();
    }
);


async function addHighScoreText(scene: Scene, text: string, x: number, y: number, z: number) {
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
    scene.add(textMesh);
}

async function init() {
    // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
    {
        canvas = document.querySelector<HTMLElement>(`canvas#${CANVAS_ID}`)!;
        renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = PCFSoftShadowMap
        scene = new Scene()
    }

    // ===== 👨🏻‍💼 LOADING MANAGER =====
    {
        loadingManager = new LoadingManager()

        loadingManager.onStart = () => {
            console.log('loading started')
        }
        loadingManager.onProgress = (url, loaded, total) => {
            console.log('loading in progress:')
            console.log(`${url} -> ${loaded} / ${total}`)
        }
        loadingManager.onLoad = () => {
            console.log('loaded!')
        }
        loadingManager.onError = () => {
            console.log('❌ error while loading')
        }
    }

    // ===== 💡 LIGHTS =====
    {
        ambientLight = new AmbientLight('white', 3);
        scene.add(ambientLight)
    }

    // ===== 📦 OBJECTS =====
    {

        let playerGeometry: BufferGeometry;
        let playerMesh: Material | Material[]
        player = new Player();
        try {
            cube = await loadFbx("assets/models/", "Steve.fbx");
            cube.traverse((child) => {
                if (child instanceof Mesh) {
                    playerGeometry = child.geometry.clone();
                    playerMesh = child.material;
                }
            });

            cube.scale.set(0.0035, 0.0035, 0.0035);
            cube.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
        } catch (error) {
            console.error("An error happened while loading model:", error);
        }
        player.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
        player.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);
        player.add(cube);


        const matrix = new Matrix4();
        const mesh = new InstancedMesh(playerGeometry, playerMesh, 1000);

        for (let i = 0; i < 1000; i++) {

            const position = new Vector3();
            const quaternion = new Quaternion();

            position.x = Math.random() * 40 - 20;
            position.y = 1;
            position.z = Math.random() * 40 - 20;

            matrix.compose(position, quaternion.random(), new Vector3(1, 1, 1));

            mesh.setMatrixAt(i, matrix);
        }

        // scene.add(mesh);
        scene.add(player);

        const meshesWithoutCollision = ["Street", "Tree_1002"];
        try {
            const crash_site = await loadGlb("assets/models/scene/", "crash_scene_2.glb");
            crash_site.traverse((child) => {
                if (child instanceof Mesh) {
                    // get collision box
                    // get if the mesh is a collision box

                    if(!meshesWithoutCollision.some((meshName) => { return child.name.includes(meshName) })) {
                        child.userData.speed = 1;
                        homeDecors.push(child as Object3D);
                    }
                }
            })

            scene.add(crash_site);
        } catch (error) {
            console.error("An error happened while loading model:", error);
        }

        try {
            hospital_site = await loadGlb("assets/models/scene/", "hospital_scene.glb");
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

            scene.add(hospital_site);
        } catch (error) {
            console.error("An error happened while loading model:", error);
        }
    }


    let countRoads = [0];
    let countTrees = [0, 0, 0];
    let countDeadTrees = [0, 0, 0];
    let countFlowers = [0, 0];
    let countRocks = [0, 0];


    // === 🌲 MAP ===
    {
        // Fill the map using random values
        const randomMap = Array.from({ length: mapLength }, () => Array.from({ length: mapWidth }, () => Math.floor(Math.random() * 100)));
        // [0 to 50] = road (set to -1)
        // [50 to 100] = grass or empty

        // [51 - 53.5[ = Tree

        // [53.5 - 56[ = Dead tree
        // [56 - 66[ = Flowers
        // [66 - 68.5[ = Rock
        // [68.5 - 100] =  empty
        for (let z = 4; z < randomMap.length; z++) {
            if (randomMap[z][0] <= 50) {
                randomMap[z] = Array.from({ length: mapWidth }, () => -1);
            }

            for (let x = 0; x < randomMap[z].length; x++) {
                if (randomMap[z][x] === -1) {
                    map[z][x] = CellType.ROAD;
                    countRoads[0]++;
                } else if (randomMap[z][x] <= 50) {
                    map[z][x] = CellType.Empty;
                } else if (randomMap[z][x] <= 53.5) {
                    if (randomMap[z][x] < 53.5 + 3.5 / 3) {
                        map[z][x] = CellType.TREE_1;
                        countTrees[0]++;
                    } else if (randomMap[z][x] < 53.5 + (3.5 / 3) * 2) {
                        map[z][x] = CellType.TREE_2;
                        countTrees[1]++;
                    } else {
                        map[z][x] = CellType.TREE_3;
                        countTrees[2]++;
                    }
                } else if (randomMap[z][x] <= 56) {
                    if (randomMap[z][x] < 56 + 3.5 / 3) {
                        map[z][x] = CellType.DEADTREE_1;
                        countDeadTrees[0]++;
                    } else if (randomMap[z][x] < 56 + (3.5 / 3) * 2) {
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
    }

    // === 🌲 MAP INSTANCE ===
    {

        const [roadGeometry, roadMaterial] = await extractGeometriesAndMaterialsFromFbx("assets/models/streets/", "Street_Straight", countRoads.length);
        const [flowerGeometries, materialGeometries] = await extractGeometriesAndMaterialsFromFbx("assets/models/props/", "Flowers_", countFlowers.length);
        const [rockGeometries, rockMaterialGeometries] = await extractGeometriesAndMaterialsFromFbx("assets/models/props/", "Rock_", countRocks.length);
        const [deadTreeGeometries, deadTreeMaterialGeometries] = await extractGeometriesAndMaterialsFromFbx("assets/models/props/", "DeadTree_", countDeadTrees.length);
        const [treeGeometries, treeMaterialGeometries] = await extractGeometriesAndMaterialsFromFbx("assets/models/props/", "Tree_", countTrees.length);

        const flowerInstancedMeshes = Array.from({ length: countFlowers.length }, (_, n) => new InstancedMesh(flowerGeometries[n], materialGeometries[n], countFlowers[n]));
        const rockInstancedMeshes = Array.from({ length: countRocks.length }, (_, n) => new InstancedMesh(rockGeometries[n], rockMaterialGeometries[n], countRocks[n]));
        const deadTreeInstancedMeshes = Array.from({ length: countDeadTrees.length }, (_, n) => new InstancedMesh(deadTreeGeometries[n], deadTreeMaterialGeometries[n], countDeadTrees[n]));
        const roadInstancedMeshes = Array.from({ length: countRoads.length }, (_, n) => new InstancedMesh(roadGeometry[n], roadMaterial[n], countRoads[n]));
        const treeInstancedMeshes = Array.from({ length: countTrees.length }, (_, n) => new InstancedMesh(treeGeometries[n], treeMaterialGeometries[n], countTrees[n]));

        let flowerIndexes = Array.from({ length: countFlowers.length }, () => 0);
        let rockIndexes = Array.from({ length: countRocks.length }, () => 0);
        let deadTreeIndexes = Array.from({ length: countDeadTrees.length }, () => 0);
        let roadIndexes = Array.from({ length: countRoads.length }, () => 0);
        let treeIndexes = Array.from({ length: countTrees.length }, () => 0);

        const cellConfig = generateCellConfig(roadInstancedMeshes, roadIndexes, flowerInstancedMeshes, flowerIndexes, rockInstancedMeshes, rockIndexes, deadTreeInstancedMeshes, deadTreeIndexes, treeInstancedMeshes, treeIndexes);


        // Main loop
        for (let z = 0; z < map.length; z++) {
            for (let x = 0; x < map[0].length; x++) {
                instantiateCell(cellConfig, map[z][x], x, z);
            }
        }

        function addInstancedMeshToScene(instancedMeshes: InstancedMesh[]) {
            instancedMeshes.forEach((instancedMesh) => {
                instancedMesh.position.set(-mapWidth, 0, 0);
                scene.add(instancedMesh);
            });
        }

        addInstancedMeshToScene(roadInstancedMeshes);
        addInstancedMeshToScene(flowerInstancedMeshes);
        addInstancedMeshToScene(rockInstancedMeshes);
        addInstancedMeshToScene(deadTreeInstancedMeshes);
        addInstancedMeshToScene(treeInstancedMeshes);


        function addCollision(geometries: typeof treeGeometries, meshes: typeof treeInstancedMeshes, countDiffElement: number[], isTree: boolean) {
            const dummy = new Object3D();
            for (let i = 0; i < countDiffElement.length; i++) {
                for (let j = 0; j < countDiffElement[i]; j++) {
                    meshes[i].getMatrixAt(j, dummy.matrix);
                    const tempMesh = new Mesh(geometries[i]);
                    tempMesh.applyMatrix4(dummy.matrix);
                    tempMesh.position.x -= mapWidth;

                    // Create a BoxHelper for this temporary mesh
                    const boundingBoxHelper = new BoxHelper(tempMesh, 0xffff00); // Yellow color

                    if (isTree)
                        trees.push(tempMesh as Object3D);
                    else
                        rocks.push(tempMesh as Object3D);

                    scene.add(boundingBoxHelper);
                }
            }
        }

        addCollision(treeGeometries, treeInstancedMeshes, countTrees, true);
        addCollision(deadTreeGeometries, deadTreeInstancedMeshes, countDeadTrees, true);
        addCollision(rockGeometries, rockInstancedMeshes, countRocks, false);


        for (let z = 0; z < map.length; z++) {
            if (map[z][0] === CellType.ROAD) {
                carSpawnPoint.push(new Vector3(mapWidth - 2, 0, z * 2));
            }
        }


        for (let i = 0; i < carSpawnPoint.length; i++) {
            const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 'red' }));
            cube.position.set(carSpawnPoint[i].x, carSpawnPoint[i].y, carSpawnPoint[i].z);
            scene.add(cube);
        }

        const nbModelCars = 5;
        const carModelsByIndex = Array.from({ length: carSpawnPoint.length }, (_, n) => Math.floor(Math.random() * nbModelCars));

        let countCars : number[] = carModelsByIndex.reduce((acc, value) => {
            acc[value]++;
            return acc;
        }, Array.from({ length: nbModelCars }, () => 0));

        const [carGeometry, carMaterial] = await extractGeometriesAndMaterialsFromGlb("assets/models/cars/", "model", countCars.length);
        const carInstancedMeshes = Array.from({ length: countCars.length }, (_, n) => new InstancedMesh(carGeometry[n], carMaterial[n], countCars[n]));


        let countCurCarsInstanced = Array.from({ length: countCars.length }, () => 0);
        carModelsByIndex.forEach((value, i) =>
        {
            const position = carSpawnPoint[i];
            const rotation = new Euler(-Math.PI / 2, 0, -Math.PI / 2);
            const scale = 0.5;
            const count = countCurCarsInstanced[value];
            carInstancedMeshes[value].setMatrixAt(count, new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(scale, scale, scale)));
            countCurCarsInstanced[value]++;
            animateCarInstance(carInstancedMeshes[value], count, carSpawnPoint[i], carGeometry[value], value);
        });

        carInstancedMeshes.forEach((instancedMesh) => {
            instancedMesh.position.set(0, 0.1, 0);
            scene.add(instancedMesh);
        });
    }

    // === 📦 FBX OBJECT ===
    {
        const randomArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 100));

        const highScore = Number(localStorage.getItem("highscore") || "0") || 0;

        for (let i = 4; i < randomArray.length; i++) {
            if(i === highScore) {
                await addHighScoreText(scene, `Highscore ${highScore}`, 4, 0, i * 2 - 0.4);
            }
        }
    }


    // ==== 🌲 DECORATION ====
    {
        // ==== 🌌 SKYBOX ====
        const skyboxGeometry = new BoxGeometry(100, 100, 325 * 2)
        const skyboxMaterial = new MeshStandardMaterial({
            color: 'skyblue',
            side: 1,
        })
        const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
        skybox.position.z = skyboxGeometry.parameters.depth / 2 - 26
        skybox.material.emissive.set('skyblue' as any);
        scene.add(skybox)


        // ==== 🌳 GROUND ====


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

                scene.add(groundSquare);
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
            scene.add(groundOutside)
        }


    }

    // ===== 🎥 CAMERA =====
    {
        camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 2.4, 650)
        camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z)
        camera.lookAt(player.position)
        player.add(camera)
    }

    // ===== 📈 STATS & CLOCK =====
    {
        stats = new Stats()
        document.body.appendChild(stats.dom)
    }

    // // ==== 🐞 DEBUG GUI ====
    // {
    //     gui = new GUI({ title: '🐞 Debug GUI', width: 300 })
    //     // open GUI by pressing 'g' key
    //     window.addEventListener('keydown', (event) => {
    //         if (event.key === 'g') {
    //             gui.openAnimated(true);
    //         }
    //     })
    //     const cubeOneFolder = gui.addFolder('Cube one')
    //
    //     cubeOneFolder.add(player.position, 'x').min(-5).max(5).step(0.1).name('pos x')
    //     cubeOneFolder.add(player.position, 'y').min(-5).max(5).step(0.1).name('pos y')
    //     cubeOneFolder.add(player.position, 'z').min(-5).max(250).step(0.1).name('pos z')
    //
    //     let axesHelperOnCube: AxesHelper = new AxesHelper();
    //     // adding checkbox add or remove the AxisHelper to the cube
    //     axesHelperOnCube.renderOrder = 1;
    //     cube.add(axesHelperOnCube);
    //
    //
    //     cubeOneFolder.add({
    //         toggleAxisHelper: () => {
    //             axesHelperOnCube.visible = !axesHelperOnCube.visible;
    //         }
    //     }, 'toggleAxisHelper').name('toggle AxisHelper')
    //
    //     cubeOneFolder
    //         .add(cube.rotation, 'x', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
    //         .name('rotate x')
    //     cubeOneFolder
    //         .add(cube.rotation, 'y', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
    //         .name('rotate y')
    //     cubeOneFolder
    //         .add(cube.rotation, 'z', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
    //         .name('rotate z')
    //
    //     cubeOneFolder.add(animation, 'enabled').name('animated')
    //
    //
    //     const lightsFolder = gui.addFolder('Lights')
    //     lightsFolder.add(ambientLight, 'visible').name('ambient light')
    //     lightsFolder.add(ambientLight, 'intensity', 0, 10, 0.1).name('ambient light intensity')
    //
    //     const helpersFolder = gui.addFolder('Helpers')
    //     helpersFolder.add(axesHelper, 'visible').name('axes')
    //
    //     const cameraFolder = gui.addFolder('Camera')
    //     // camera position
    //     cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.5).name('pos x')
    //     cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.5).name('pos y')
    //     cameraFolder.add(camera.position, 'z').min(-10).max(300).step(0.5).name('pos z')
    //
    //     // camera Rotation
    //     cameraFolder.add(camera.rotation, 'x').min(-Math.PI).max(Math.PI).step(0.1).name('rot x')
    //     cameraFolder.add(camera.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.1).name('rot y')
    //     cameraFolder.add(camera.rotation, 'z').min(-Math.PI).max(Math.PI).step(0.1).name('rot z')
    //
    //     // camera fov
    //     cameraFolder.add(camera, 'fov', 1, 180).name('fov').onChange(() => camera.updateProjectionMatrix())
    //
    //     // camera near and far
    //     cameraFolder.add(camera, 'near', 1, 100).name('near').onChange(() => camera.updateProjectionMatrix())
    //     cameraFolder.add(camera, 'far', 1, 1000).name('far').onChange(() => camera.updateProjectionMatrix())
    //
    //     const ambulancesFolder = gui.addFolder('Ambulance')
    //     ambulancesFolder.add(hospital_site.rotation, 'x').min(-10).max(10).step(0.1).name('rotate x')
    //     ambulancesFolder.add(hospital_site.rotation, 'y').min(-10).max(10).step(0.1).name('rotate y')
    //     ambulancesFolder.add(hospital_site.rotation, 'z').min(-10).max(10).step(0.1).name('rotate z')
    //
    //     // persist GUI state in local storage on changes
    //     gui.onFinishChange(() => {
    //         const guiState = gui.save()
    //         localStorage.setItem('guiState', JSON.stringify(guiState))
    //     })
    //
    //     // load GUI state if available in local storage
    //     const guiState = localStorage.getItem('guiState')
    //     if (guiState) gui.load(JSON.parse(guiState))
    //
    //     // reset GUI state button
    //     const resetGui = () => {
    //         localStorage.removeItem('guiState')
    //         gui.reset()
    //     }
    //     gui.add({ resetGui }, 'resetGui').name('RESET')
    //
    //     gui.close()
    // }
}

function animate() {
    requestAnimationFrame(animate)

    if (stats)
        stats.update()

    // On recupere les voitures
    let cars: Object3D[] = [];

    scene.traverse((child) => {

        if (child instanceof Group && child.name === "car") {
            cars.push(child as Object3D);
        }
        // if (child instanceof Group && child.name === "tree" || child.name === "dead_tree") {
        //     trees.push(child as Object3D);
        // }
        // if (child instanceof Group && child.name === "rock") {
        //     rocks.push(child as Object3D);
        // }
    });

    checkCollisionsCars(cars);
    checkCollisionsTree(trees);
    checkCollisionsRocks(rocks);
    checkCollisionsCars(homeDecors);

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
    }



    renderer.render(scene, camera)
}

function reset()
{
    window.removeEventListener('keydown', eventListenerMouvement);

    gsap.killTweensOf(cube.position);
    gsap.killTweensOf(cube.rotation);
    gsap.killTweensOf(player.position);
    gsap.killTweensOf(camera.position);

    scene.remove(camera);
    scene.remove(player);
    scene.remove(cube);

    player = new Player();
    player.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
    player.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);

    cube.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);

    cube.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    camera.lookAt(player.position);
    player.add(cube);
    player.add(camera);
    scene.add(player);

    document.getElementById("score-value").innerText = "0";

    const button = document.getElementById("button-wrapper");
    if (button) {
        button.style.display = "block";
        button.addEventListener("click", handleButtonClick);
        window.addEventListener('keydown', handleUpArrow);
    }
}