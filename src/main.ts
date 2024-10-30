import GUI from 'lil-gui'
import {
    AmbientLight,
    AxesHelper,
    BoxGeometry,
    Group,
    LoadingManager,
    Mesh, MeshBasicMaterial,
    MeshStandardMaterial,
    Object3D,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    WebGLRenderer,
} from 'three'
import { toggleFullScreen } from './helpers/fullscreen'
import { resizeRendererToDisplaySize } from './helpers/responsiveness'
import './style.css'
import { checkCollisionsCars, checkCollisionsRocks, checkCollisionsTree } from "./collision/collision";
import { loadFbx, loadGlb } from "./loader/model_loader";
import { getRoadsLine } from "./terrain/road";
import { getGrassLine } from "./terrain/grass";
import { initButtonBehavior } from "./components/buttonBehavior";
import {FontLoader} from "three/examples/jsm/loaders/FontLoader";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";

class Player extends Object3D {
    private onUpdate: () => void;

    constructor(onUpdate: () => void) {
        super();
        this.onUpdate = onUpdate;
    }

    updateMatrixWorld(force?: boolean): void {

        super.updateMatrixWorld(force);
        this.onUpdate();
    }
}


const CANVAS_ID = 'scene'

let canvas: HTMLElement
let renderer: WebGLRenderer
export let scene: Scene
let loadingManager: LoadingManager
let ambientLight: AmbientLight
export let cube: Object3D
export let player: Player
let crash_site: Object3D
export let camera: PerspectiveCamera
let axesHelper: AxesHelper
let homeDecors: Object3D[] = [];
let gui: GUI
export const playableArea = 9 * 2;

export const sideLength = 1

const animation = { enabled: true, play: true }

initButtonBehavior();
init().then(
    () => {
        animate();
    }
);


async function addHighScoreText(scene: Scene, text: string, x: number, y: number, z: number) {
    const loader = new FontLoader();
    const font = await loader.loadAsync('https://threejs.org/examples/fonts/gentilis_bold.typeface.json'); // Replace with the actual path to your font file

    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 1,
        height: 0.1,
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
        canvas = document.querySelector(`canvas#${CANVAS_ID}`)!
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
        try {
            cube = await loadFbx("assets/models/", "Steve.fbx");
            cube.scale.set(0.0035, 0.0035, 0.0035);
        } catch (error) {
            console.error("An error happened while loading model:", error);
        }

        player = new Player(() => {

        });
        player.add(cube)

        scene.add(player);

        const meshesWithoutCollision = ["Street", "Tree_1002"];
        try {
            crash_site = await loadGlb("assets/models/scene/", "crash_scene_2.glb");
            crash_site.traverse((child) => {
                if (child instanceof Mesh) {
                    // get collision box
                    // get if the mesh is a collision box

                    if(!meshesWithoutCollision.some((meshName) => { return child.name.includes(meshName) })) {
                        child.userData.speed = 1;
                        homeDecors.push(child);
                    }
                }
            })

            scene.add(crash_site);
        } catch (error) {
            console.error("An error happened while loading model:", error);
        }
    }


    // === 📦 FBX OBJECT ===
    {
        const randomArray = Array.from({ length: 300 }, () => Math.floor(Math.random() * 100));

        const highScore = Number(localStorage.getItem("highscore") || "0") || 0;

        for (let i = 4; i < randomArray.length; i++) {
            if(i === highScore) {
                addHighScoreText(scene, `Highscore ${highScore}`, 4, 0, i * 2 - 0.4);
            }

            // 0 to 50 = road
            // 51 to 100 = grass
            if (randomArray[i] <= 50) {
                await getRoadsLine().then((road) => {
                    road.position.set(0, 0, i * 2);
                    scene.add(road);
                });
            } else {
                await getGrassLine().then((grass) => {
                    grass.position.set(0, 0, i * 2);
                    scene.add(grass);
                });
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
        skybox.material.emissive.set('skyblue')
        scene.add(skybox)


        // ==== 🌳 GROUND ====


        const groundWidth = 20;
        const groundHeight = 625;
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
                groundSquare.position.set(x + squareSize / 2 +1, -0.01, z + squareSize / 2 - 21);
                groundSquare.receiveShadow = true;
                groundSquare.rotateX(-Math.PI / 2);

                scene.add(groundSquare);
            }
        }

        const groundGeometry = new PlaneGeometry(20, 625);
        for (let i = 0; i < 2; i++) {
            const groundMaterialOutside = new MeshStandardMaterial({
                color: '#A4D74C',
                side: 2,
            })
            const groundOutside = new Mesh(groundGeometry, groundMaterialOutside)
            groundOutside.position.y = -0.01
            groundOutside.receiveShadow = true
            groundOutside.rotateX(-Math.PI / 2)
            groundOutside.position.z = groundGeometry.parameters.height / 2 - 21
            groundOutside.position.x = i === 0 ? -21 : 21
            scene.add(groundOutside)
        }


    }

    // ===== 🎥 CAMERA =====
    {
        camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 2.4, 650)
        camera.position.set(-1, 6, -5.5)
        camera.lookAt(player.position);

        player.add(camera)
    }

    // ===== 🕹️ CONTROLS =====
    {
        // Full screen
        window.addEventListener('dblclick', (event) => {
            if (event.target === canvas) {
                toggleFullScreen(canvas)
            }
        })
    }

    // ===== 🪄 HELPERS =====
    {
        axesHelper = new AxesHelper(4)
        axesHelper.visible = false
        scene.add(axesHelper)

        // const gridHelper = new GridHelper(20, 20, 'teal', 'darkgray')
        // gridHelper.position.y = -0.01
        // scene.add(gridHelper)
    }

    // ===== 📈 STATS & CLOCK =====
    {
    }

    // ==== 🐞 DEBUG GUI ====
    {
        gui = new GUI({ title: '🐞 Debug GUI', width: 300 })
        // open GUI by pressing 'g' key
        window.addEventListener('keydown', (event) => {
            if (event.key === 'g') {
                gui.openAnimated(true);
            }
        })
        const cubeOneFolder = gui.addFolder('Cube one')

        cubeOneFolder.add(cube.position, 'x').min(-5).max(5).step(0.5).name('pos x')
        cubeOneFolder.add(cube.position, 'y').min(-5).max(5).step(0.5).name('pos y')
        cubeOneFolder.add(cube.position, 'z').min(-5).max(5).step(0.5).name('pos z')

        let axesHelperOnCube: AxesHelper = new AxesHelper();
        // adding checkbox add or remove the AxisHelper to the cube
        axesHelperOnCube.renderOrder = 1;
        cube.add(axesHelperOnCube);


        cubeOneFolder.add({
            toggleAxisHelper: () => {
                axesHelperOnCube.visible = !axesHelperOnCube.visible;
            }
        }, 'toggleAxisHelper').name('toggle AxisHelper')

        cubeOneFolder
            .add(cube.rotation, 'x', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
            .name('rotate x')
        cubeOneFolder
            .add(cube.rotation, 'y', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
            .name('rotate y')
        cubeOneFolder
            .add(cube.rotation, 'z', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
            .name('rotate z')

        cubeOneFolder.add(animation, 'enabled').name('animated')


        const lightsFolder = gui.addFolder('Lights')
        lightsFolder.add(ambientLight, 'visible').name('ambient light')
        lightsFolder.add(ambientLight, 'intensity', 0, 10, 0.1).name('ambient light intensity')

        const helpersFolder = gui.addFolder('Helpers')
        helpersFolder.add(axesHelper, 'visible').name('axes')

        const cameraFolder = gui.addFolder('Camera')
        // camera position
        cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.5).name('pos x')
        cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.5).name('pos y')
        cameraFolder.add(camera.position, 'z').min(-10).max(10).step(0.5).name('pos z')

        // camera Rotation
        cameraFolder.add(camera.rotation, 'x').min(-Math.PI).max(Math.PI).step(0.1).name('rot x')
        cameraFolder.add(camera.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.1).name('rot y')
        cameraFolder.add(camera.rotation, 'z').min(-Math.PI).max(Math.PI).step(0.1).name('rot z')

        // camera fov
        cameraFolder.add(camera, 'fov', 1, 180).name('fov').onChange(() => camera.updateProjectionMatrix())

        // camera near and far
        cameraFolder.add(camera, 'near', 1, 100).name('near').onChange(() => camera.updateProjectionMatrix())
        cameraFolder.add(camera, 'far', 1, 1000).name('far').onChange(() => camera.updateProjectionMatrix())

        const ambulancesFolder = gui.addFolder('Ambulance')
        ambulancesFolder.add(crash_site.rotation, 'x').min(-10).max(10).step(0.1).name('rotate x')
        ambulancesFolder.add(crash_site.rotation, 'y').min(-10).max(10).step(0.1).name('rotate y')
        ambulancesFolder.add(crash_site.rotation, 'z').min(-10).max(10).step(0.1).name('rotate z')

        // persist GUI state in local storage on changes
        gui.onFinishChange(() => {
            const guiState = gui.save()
            localStorage.setItem('guiState', JSON.stringify(guiState))
        })

        // load GUI state if available in local storage
        const guiState = localStorage.getItem('guiState')
        if (guiState) gui.load(JSON.parse(guiState))

        // reset GUI state button
        const resetGui = () => {
            localStorage.removeItem('guiState')
            gui.reset()
        }
        gui.add({ resetGui }, 'resetGui').name('RESET')

        gui.close()
    }
}

function animate() {
    requestAnimationFrame(animate)


    // On recupere les voitures
    let cars: Object3D[] = [];
    let trees: Object3D[] = [];
    let rocks: Object3D[] = [];

    scene.traverse((child) => {

        if (child instanceof Group && child.name === "car") {
            cars.push(child);
        }
        if (child instanceof Group && child.name === "tree" || child.name === "dead_tree") {
            trees.push(child);
        }
        if (child instanceof Group && child.name === "rock") {
            rocks.push(child);
        }
    });

    // On check les collisions avec le joueur
    checkCollisionsCars(cars, player);
    checkCollisionsTree(trees, player);
    checkCollisionsRocks(rocks, player);
    checkCollisionsCars(homeDecors, player);

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
    }



    renderer.render(scene, camera)
}