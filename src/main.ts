import {
    AmbientLight, AnimationMixer,
    AudioListener,
    Clock,
    HemisphereLight,
    LoadingManager, Mesh, MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three'
// XR Emulator
import { DevUI } from '@iwer/devui';
import { metaQuest3, XRDevice } from 'iwer';


import Stats from 'three/examples/jsm/libs/stats.module'
import './style.css'
import { initButtonBehavior } from "./components/buttonBehavior";
import { CellType, EnumDirection } from "./types";
import { board, initBoard } from "./terrain/initBoard";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { moveAr } from "./controller/controller";
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { checkCollisionsCars, checkCollisionsRocks } from "./collision/collision";

import Hammer from "hammerjs";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";


// let canvas: HTMLElement
let renderer: WebGLRenderer
export let scene : Scene;
let loadingManager: LoadingManager
export let ambientLight: AmbientLight

export let camera: PerspectiveCamera
export const listener : AudioListener = new AudioListener();
let stats: Stats
export let homeDecors: Object3D[] = [];

export const mapLength = 100;
export const mapWidth = 18;
export const map: CellType[][] = Array.from({ length: mapLength }, () => Array.from({ length: mapWidth }, () => CellType.Empty));


export const initialCameraPosition = new Vector3(-1, 6, -5.5);
export const initialPlayerPosition = new Vector3(0, 0, 0);
export const initialPlayerRotation = new Vector3(0, 0, 0);

export let trees: Object3D[] = [];
export let rocks: Object3D[] = [];

export const playableArea = 9 * 2;

export let deathText: Mesh;

const clock = new Clock();
export let mixers: AnimationMixer[] = [];
export const sideLength = 1
let controller;

initButtonBehavior();

async function setupXR(xrMode) {

    if (xrMode !== 'immersive-vr') return;

    // iwer setup: emulate vr session
    let nativeWebXRSupport = false;
    if (navigator.xr) {
        nativeWebXRSupport = await navigator.xr.isSessionSupported(xrMode);
    }

    if (!nativeWebXRSupport) {
        const xrDevice = new XRDevice(metaQuest3);
        xrDevice.installRuntime();
        xrDevice.fovy = (75 / 180) * Math.PI;
        xrDevice.ipd = 0;
        // noinspection TypeScriptUnresolvedReference
        window.xrdevice = xrDevice;
        // noinspection TypeScriptUnresolvedReference
        xrDevice.controllers.right.position.set(0.15649, 1.43474, -0.38368);
        // noinspection TypeScriptUnresolvedReference
        xrDevice.controllers.right.quaternion.set(
            0.14766305685043335,
            0.02471366710960865,
            -0.0037767395842820406,
            0.9887216687202454,
        );
        // noinspection TypeScriptUnresolvedReference
        xrDevice.controllers.left.position.set(-0.15649, 1.43474, -0.38368);
        // noinspection TypeScriptUnresolvedReference
        xrDevice.controllers.left.quaternion.set(
            0.14766305685043335,
            0.02471366710960865,
            -0.0037767395842820406,
            0.9887216687202454,
        );
        new DevUI(xrDevice);
    }
}

const animate = () => {

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // ==== UPDATE MIXERS ====
    for(const mixer of mixers) {
        mixer.update(delta);
    }
    if (stats)
        stats.update()

    // TODO: fix tree collisions
    // checkCollisionsTree(trees);
    checkCollisionsRocks(rocks);
    checkCollisionsCars(homeDecors);

    // can be used in shaders: uniforms.u_time.value = elapsed;

    const xrCamera = renderer.xr.getCamera();
    board.position.y = xrCamera.position.y - 0.7;

    renderer.render(scene, camera);
};


function init() {

    scene = new Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
    camera.position.set(0, 1.6, 3);

    const light = new AmbientLight(0xffffff, 1.0); // soft white light
    scene.add(light);

    const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate); // requestAnimationFrame() replacement, compatible with XR
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    /*
     document.body.appendChild( XRButton.createButton( renderer, {
     'optionalFeatures': [ 'depth-sensing' ],
     'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
     } ) );
     */

    const xrButton = ARButton.createButton(renderer, {});
    xrButton.style.backgroundColor = 'skyblue';
    document.body.appendChild(xrButton);

    xrButton.addEventListener('click', () => {
        const xrCamera = renderer.xr.getCamera();
        xrCamera.add(listener as Object3D);
        console.log(xrCamera)
    })


    // ===== 🎮 CONTROLS =====
    {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.6, 0);
        controls.update();

        controller = renderer.xr.getController(0);

        const body = document.body
        const hammertime = new Hammer(body);

        hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL, threshold: 100 });


        hammertime.on("swipeleft", ev => {
            moveAr(EnumDirection.LEFT)
        })

        hammertime.on("swiperight", ev => {
            moveAr(EnumDirection.RIGHT)
        })

        hammertime.on("swipeup", ev => {
            moveAr(EnumDirection.FORWARD)
        })

        hammertime.on("swipedown", ev => {
            moveAr(EnumDirection.BACK)
        });

        hammertime.on("tap", ev => {
            moveAr(EnumDirection.FORWARD)
        });

    scene.add(controller);
    }


    window.addEventListener('resize', onWindowResize, false);

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





    // ==== 🌲 DECORATION ====
    // {
    //     // ==== 🌌 SKYBOX ====
    //     const skyboxGeometry = new BoxGeometry(100, 100, 325 * 2)
    //     const skyboxMaterial = new MeshStandardMaterial({
    //         color: 'skyblue',
    //         side: 1,
    //     })
    //     const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
    //     skybox.position.z = skyboxGeometry.parameters.depth / 2 - 26
    //     skybox.material.emissive.set('skyblue' as any);
    //     scene.add(skybox)
    // }

    // ===== 🎥 CAMERA =====
    {
        camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 650)
        camera.position.set(0, 1.6, 3);
        // camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z)
        // camera.lookAt(player.position)
        // player.add(camera)
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

    initBoard().then((board) => {
        board.rotation.set(0, Math.PI, 0);
        board.position.set(0, -0.7, 0);
        scene.add(board);
    });

    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new TextGeometry('Wasted', {
            font: font,
            size: 0.1,
            depth: 0.05,
        });

        const textMaterial = new MeshBasicMaterial({ color: 0xff0000 });
        deathText = new Mesh(textGeometry, textMaterial);

        // Positionner le texte devant la caméra
        deathText.position.set(-0.25, 0, -1); // 50cm devant la caméra
        deathText.rotation.x = 0;
        deathText.rotation.y = 0;
        deathText.visible = false;

        // Ajouter à la scène
        scene.add(deathText);
    });
}

// function animate() {
//     renderer.setAnimationLoop(render); // Nécessaire pour WebXR
//
//     function render() {
//         if (stats)
//             stats.update()
//         checkCollisionsTree(trees);
//         checkCollisionsRocks(rocks);
//         checkCollisionsCars(homeDecors);
//
//         if (!isAr && resizeRendererToDisplaySize(renderer)) {
//             const canvas = renderer.domElement
//             camera.aspect = canvas.clientWidth / canvas.clientHeight
//             camera.updateProjectionMatrix()
//         }
//
//         renderer.render(scene, camera);
//     }
// }
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}



await setupXR('immersive-ar');
init();


