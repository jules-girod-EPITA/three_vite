
import {
    AmbientLight,
    BoxGeometry, CylinderGeometry,
    Euler,
    Group, HemisphereLight,
    InstancedMesh,
    LoadingManager,
    Matrix4,
    Mesh,
    MeshBasicMaterial, MeshPhongMaterial,
    MeshStandardMaterial,
    Object3D,
    PerspectiveCamera,
    PlaneGeometry,
    Quaternion, RingGeometry,
    Scene,
    SpotLight,
    Vector3,
    WebGLRenderer,
    XRTargetRaySpace
} from 'three'

import Stats from 'three/examples/jsm/libs/stats.module'
import { resizeRendererToDisplaySize } from './helpers/responsiveness'
import './style.css'
import { extractGeometriesAndMaterialsFromGlb, loadFbx, loadGlb } from "./loader/model_loader";
import { handleButtonClick, handleUpArrow, initButtonBehavior } from "./components/buttonBehavior";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { gsap } from "gsap";
import { eventListenerMouvement } from "./controller/controller";
import { checkCollisionsCars, checkCollisionsRocks, checkCollisionsTree } from "./collision/collision";
import { CellType } from "./types";
import { animateCarInstance } from "./terrain/road";
import { generateWorld, instancedMesh } from "./terrain/worldGeneration";
import { generateCellConfig } from "./misc";
import {ARButton} from "three/examples/jsm/webxr/ARButton";
// import { ARButton } from 'three/addons/webxr/ARButton.js';


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
                board.remove(camera);
                camera.position.set(cameraRealPosition.x, cameraRealPosition.y, cameraRealPosition.z);
                board.add(camera);
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
                board.remove(camera);
                camera.position.set(-6, 3.5, 222);
                board.add(camera);
                // camera.lookAt(2.5, 2, 230);

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
                board.add(spotLight);

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


// const CANVAS_ID = 'scene'

let hospital_site: Object3D

let container : Element;
let controller : XRTargetRaySpace;

let reticule : Mesh;

let hitTestSource : XRHitTestSource | null;
let hitTestSourceRequested : boolean = false;
let boardPlaced : boolean = false;

let renderer: WebGLRenderer
let scene : Scene;
export let board: Group
let loadingManager: LoadingManager
let ambientLight: AmbientLight
export let cube: Object3D
export let player: Player
export let camera: PerspectiveCamera
let stats: Stats
let homeDecors: Object3D[] = [];

export const mapLength = 100;
export const mapWidth = 18;
export const map: CellType[][] = Array.from({ length: mapLength }, () => Array.from({ length: mapWidth }, () => CellType.Empty));



const initialCameraPosition = new Vector3(-1, 6, -5.5);
const initialPlayerPosition = new Vector3(0, 0, 0);
const initialPlayerRotation = new Vector3(0, 0, 0);

export let trees: Object3D[] = [];
export let rocks: Object3D[] = [];
let carSpawnPoint: Vector3[] = [];

export const playableArea = 9 * 2;

export const sideLength = 1


// initButtonBehavior();
init().then(
    () => {
        renderer.setAnimationLoop(animate);
    }
);


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

async function init() {
    // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
    {
        board = new Group();
        // canvas = document.querySelector<HTMLElement>(`canvas#${CANVAS_ID}`)!;
        // renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
        // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        // renderer.shadowMap.enabled = true
        // renderer.shadowMap.type = PCFSoftShadowMap
        scene = new Scene()


        // ===== DIV ELEMENT =====

        container = document.createElement( 'div' );
        document.body.appendChild( container );

        // ===== SCENE, CAMERA AND LIGHT =====




        // ===== RENDERER =====

        renderer = new WebGLRenderer( { antialias: true, alpha: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.xr.enabled = true;
        container.appendChild( renderer.domElement );
    }

    // ===== 👨🏻‍💼 LOADING MANAGER =====
    // {
    //     loadingManager = new LoadingManager()
    //
    //     loadingManager.onStart = () => {
    //         console.log('loading started')
    //     }
    //     loadingManager.onProgress = (url, loaded, total) => {
    //         console.log('loading in progress:')
    //         console.log(`${url} -> ${loaded} / ${total}`)
    //     }
    //     loadingManager.onLoad = () => {
    //         console.log('loaded!')
    //     }
    //     loadingManager.onError = () => {
    //         console.log('❌ error while loading')
    //     }
    // }

    // ===== 💡 LIGHTS =====
    {
        // ambientLight = new AmbientLight('white', 3);
        // scene.add(ambientLight)
        const light = new HemisphereLight( 0xffffff, 0xbbbbff, 3 );
        light.position.set( 0.5, 1, 0.25 );
        scene.add( light );
    }

    // ===== 📦 OBJECTS =====
    {

        player = new Player();
        try {
            cube = await loadFbx("assets/models/", "Steve.fbx");
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

                    if(!meshesWithoutCollision.some((meshName) => { return child.name.includes(meshName) })) {
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

            board.add(hospital_site);
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
        generateWorld(countRoads, countTrees, countDeadTrees, countFlowers, countRocks);
    }

    // === 🌲 MAP INSTANCE ===
    {
        const cellConfig = generateCellConfig();

        const startingTime = new Date().getTime();
        await Promise.all([
            instancedMesh("assets/models/streets/", "Street_Straight", countRoads, cellConfig),
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
        const carModelsByIndex = Array.from({ length: carSpawnPoint.length }, (_) => Math.floor(Math.random() * nbModelCars));

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
            let rotation = new Euler(-Math.PI / 2, 0, -Math.PI / 2);
            let scale = 0.5;

            if (value === 5) {
                rotation = new Euler(0, -Math.PI / 2, 0);
                scale = 1;
            }
            const count = countCurCarsInstanced[value];
            carInstancedMeshes[value].setMatrixAt(count, new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), new Vector3(scale, scale, scale)));
            countCurCarsInstanced[value]++;
            animateCarInstance(carInstancedMeshes[value], count, carSpawnPoint[i], carGeometry[value], value);
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
            if(i === highScore) {
                await addHighScoreText(board, `Highscore ${highScore}`, 4, 0, i * 2 - 0.4);
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

    // ===== 🎥 CAMERA =====
    {
        camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

        // camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 2.4, 650)
        // camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z)
        // camera.lookAt(player.position)
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

    // ===== BUTTON =====

    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

    function onSelect() {

        if ( reticule.visible && !boardPlaced) {
            // const material = new MeshPhongMaterial( { color: 0xffffff * Math.random() } );
            // const geometry = new CylinderGeometry( 0.1, 0.1, 0.2, 32 ).translate( 0, 0.1, 0 );
            // const mesh = new Mesh( geometry, material );
            reticule.matrix.decompose( board.position, board.quaternion, board.scale );
            // mesh.scale.y = Math.random() * 2 + 1;
            scene.add( board );
            boardPlaced = true;
        }
    }

    // ===== CONTROLLER =====

    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller );

    // ===== RETICLE =====

    reticule = new Mesh(
        new RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new MeshBasicMaterial()
    );
    reticule.matrixAutoUpdate = false;
    reticule.visible = false;
    scene.add( reticule );

    board.position.set(0, 0, 0);
    // scene.add(board)

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate(timestamp : DOMHighResTimeStamp, frame? : XRFrame ) {
    requestAnimationFrame(animate)

    // if (stats)
    //     stats.update()



    // if (resizeRendererToDisplaySize(renderer)) {
    //     const canvas = renderer.domElement
    //     camera.aspect = canvas.clientWidth / canvas.clientHeight
    //     camera.updateProjectionMatrix()
    // }

    if ( frame ) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if ( session !== null && hitTestSourceRequested === false ) {
            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
                if (session.requestHitTestSource) {
                    session.requestHitTestSource({space: referenceSpace})?.then(function (source) {
                        hitTestSource = source;
                    });
                }
            } );
            session.addEventListener( 'end', function () {

                hitTestSourceRequested = false;
                hitTestSource = null;
            } );
            hitTestSourceRequested = true;
        }

        if ( hitTestSource ) {

            const hitTestResults = frame.getHitTestResults( hitTestSource );

            if ( hitTestResults.length ) {

                const hit = hitTestResults[ 0 ];

                reticule.visible = true;

                if(referenceSpace)
                {
                    const hitPos = hit.getPose( referenceSpace );
                    if(hitPos)
                        reticule.matrix.fromArray( hitPos.transform.matrix );
                }

            } else {
                reticule.visible = false;
            }
        }
        if(boardPlaced)
        {
            checkCollisionsTree(trees);
            checkCollisionsRocks(rocks);
            checkCollisionsCars(homeDecors);
        }
    }

    renderer.render( scene, camera );
}

function reset()
{
    window.removeEventListener('keydown', eventListenerMouvement);

    gsap.killTweensOf(cube.position);
    gsap.killTweensOf(cube.rotation);
    gsap.killTweensOf(player.position);
    gsap.killTweensOf(camera.position);

    board.remove(camera);
    board.remove(player);
    board.remove(cube);

    player = new Player();
    player.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
    player.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);

    cube.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);

    cube.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    // camera.lookAt(player.position);
    player.add(cube);
    player.add(camera);
    board.add(player);

    let scoreElement = document.getElementById("score-value");
    if(scoreElement)
    {
        scoreElement.innerText = "0";
    }

    const button = document.getElementById("button-wrapper");
    if (button) {
        button.style.display = "block";
        button.addEventListener("click", handleButtonClick);
        window.addEventListener('keydown', handleUpArrow);
    }
}