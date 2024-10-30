import GUI from 'lil-gui'
import {
    AmbientLight,
    AxesHelper, Box3, Box3Helper,
    BoxGeometry,
    Clock,
    Group,
    LoadingManager,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    WebGLRenderer,
} from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { toggleFullScreen } from './helpers/fullscreen'
import { resizeRendererToDisplaySize } from './helpers/responsiveness'
import './style.css'
import { checkCollisionsCars, checkCollisionsRocks, checkCollisionsTree } from "./collision/collision";
import { loadFbx, loadGlb } from "./loader/model_loader";
import { getRoadsLine } from "./terrain/road";
import { getGrassLine } from "./terrain/grass";
import { initButtonBehavior } from "./components/buttonBehavior";

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
let cameraControls: OrbitControls
let dragControls: DragControls
let axesHelper: AxesHelper
export let clock: Clock
let stats: Stats
let homeDecors: Object3D[] = [];
let gui: GUI
export const playableArea = 9 * 2;

export const sideLength = 1

const animation = { enabled: true, play: true }

initButtonBehavior();
init()
animate()

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
            cameraControls.target = player.position.clone()
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


        for (let i = 4; i < randomArray.length; i++) {

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
        skybox.position.z = skyboxGeometry.parameters.depth / 2 - 20
        skybox.material.emissive.set('skyblue')
        scene.add(skybox)


        // ==== 🌳 GROUND ====
        const groundGeometry = new PlaneGeometry(20, 625)
        const groundMaterial = new MeshStandardMaterial({
            color: 'green',
            side: 2,
        })
        const ground = new Mesh(groundGeometry, groundMaterial)
        ground.position.y = -0.01
        ground.receiveShadow = true
        ground.rotateX(-Math.PI / 2)
        ground.position.z = groundGeometry.parameters.height / 2 - 20

        for (let i = 0; i < 2; i++) {
            const groundMaterialOutside = new MeshStandardMaterial({
                color: 'darkgreen',
                side: 2,
            })
            const groundOutside = new Mesh(groundGeometry, groundMaterialOutside)
            groundOutside.position.y = -0.01
            groundOutside.receiveShadow = true
            groundOutside.rotateX(-Math.PI / 2)
            groundOutside.position.z = groundGeometry.parameters.height / 2 - 20
            groundOutside.position.x = i === 0 ? -20 : 20
            scene.add(groundOutside)
        }


        scene.add(ground)
    }

    // ===== 🎥 CAMERA =====
    {
        camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 2.4, 650)
        camera.position.set(-1, 6, -5.5)
        player.add(camera)
    }

    // ===== 🕹️ CONTROLS =====
    {
        cameraControls = new OrbitControls(camera, canvas)
        cameraControls.target = cube.position.clone()
        cameraControls.enableDamping = true
        cameraControls.autoRotate = false
        cameraControls.update()

        dragControls = new DragControls([cube], camera, renderer.domElement)
        dragControls.addEventListener('hoveron', (event) => {
            const mesh = event.object as Mesh
            const material = mesh.material as MeshStandardMaterial
            material.emissive.set('orange')
        })
        dragControls.addEventListener('hoveroff', (event) => {
            const mesh = event.object as Mesh
            const material = mesh.material as MeshStandardMaterial
            material.emissive.set('black')
        })
        dragControls.addEventListener('dragstart', (event) => {
            const mesh = event.object as Mesh
            const material = mesh.material as MeshStandardMaterial
            cameraControls.enabled = false
            animation.play = false
            material.emissive.set('black')
            material.opacity = 0.7
            material.needsUpdate = true
        })
        dragControls.addEventListener('dragend', (event) => {
            cameraControls.enabled = true
            animation.play = true
            const mesh = event.object as Mesh
            const material = mesh.material as MeshStandardMaterial
            material.emissive.set('black')
            material.opacity = 1
            material.needsUpdate = true
        })
        dragControls.enabled = false

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
        clock = new Clock()
        stats = new Stats()
        document.body.appendChild(stats.dom)
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

        const controlsFolder = gui.addFolder('Controls')
        controlsFolder.add(dragControls, 'enabled').name('drag controls')

        const lightsFolder = gui.addFolder('Lights')
        lightsFolder.add(ambientLight, 'visible').name('ambient light')
        lightsFolder.add(ambientLight, 'intensity', 0, 10, 0.1).name('ambient light intensity')

        const helpersFolder = gui.addFolder('Helpers')
        helpersFolder.add(axesHelper, 'visible').name('axes')

        const cameraFolder = gui.addFolder('Camera')
        cameraFolder.add(cameraControls, 'autoRotate')
        // camera positoin
        cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.5).name('pos x')
        cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.5).name('pos y')
        cameraFolder.add(camera.position, 'z').min(-10).max(10).step(0.5).name('pos z')
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

    stats.update()

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


    cameraControls.update()

    renderer.render(scene, camera)
}