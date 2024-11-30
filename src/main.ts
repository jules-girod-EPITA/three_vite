import {
    AmbientLight,
    AnimationMixer,
    AudioListener,
    Clock,
    HemisphereLight,
    LoadingManager,
    Mesh,
    MeshBasicMaterial,
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
import { CellType, EnumDirection } from "./types";
import { animals, board, hitBox, initBoard, player } from "./terrain/initBoard";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { moveAr } from "./controller/controller";
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { checkCollisionsTree } from "./collision/collision";

import Hammer from "hammerjs";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { translateAnimal } from "./terrain/animalsGeneration";


// let canvas: HTMLElement
let renderer: WebGLRenderer

export let scene : Scene;
let loadingManager: LoadingManager
export let ambientLight: AmbientLight

export let camera: PerspectiveCamera
export const listener : AudioListener = new AudioListener();
let stats: Stats

export const mapLength = 100;
export const mapWidth = 18;
export const map: CellType[][] = Array.from({ length: mapLength }, () => Array.from({ length: mapWidth }, () => CellType.Empty));

export const initialPlayerPosition = new Vector3(0, 0, 0);
export const initialPlayerRotation = new Vector3(0, 0, 0);

export let trees: Object3D[] = [];

export const playableArea = 9 * 2;

export let deathText: Mesh;

const clock = new Clock();
export let mixers: AnimationMixer[] = [];
export const sideLength = 1
export let controller;

// initButtonBehavior();

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

    checkCollisionsTree(trees);

    const xrCamera = renderer.xr.getCamera();
    board.position.y = xrCamera.position.y - 0.7;

    if(deathText?.visible)
    {
        // applying math transformation to always keep the text in front of the camera (offset to center eat)
        const distanceFromCamera = 1;
        const cameraDirection = new Vector3();
        camera.getWorldDirection(cameraDirection);
        const textPosition = new Vector3();
        deathText.getWorldPosition(textPosition);


        camera.position.x -= 0.25;
        camera.position.y = textPosition.y;

        deathText.position.copy(camera.position).add(cameraDirection.multiplyScalar(distanceFromCamera));
        deathText.lookAt(camera.position);
    }

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
    xrButton.id = "XRButton";


    xrButton.addEventListener('click', () => {
        const xrCamera = renderer.xr.getCamera();
        xrCamera.add(listener as Object3D);
        console.log(xrCamera)
        translateAnimal(animals, 9*2, hitBox);
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
            moveAr(EnumDirection.LEFT);
        })

        hammertime.on("swiperight", ev => {
            moveAr(EnumDirection.RIGHT);
        })

        hammertime.on("swipeup", ev => {
            moveAr(EnumDirection.FORWARD);
        })

        hammertime.on("swipedown", ev => {
            moveAr(EnumDirection.BACK);
        });

        hammertime.on("tap", ev => {
            moveAr(EnumDirection.FORWARD);
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

    // ===== 🎥 CAMERA =====
    {
        camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 650)
        camera.position.set(0, 1.6, 3);
    }

    // ===== 📈 STATS & CLOCK =====
    {
        stats = new Stats()
        document.body.appendChild(stats.dom)
    }

    initBoard().then((board) => {
        board.rotation.set(0, Math.PI, 0);
        board.position.set(0, -0.7, 0);
        scene.add(board);
        player.setControllable();
        const playButton = document.getElementById("play-button");
        if(playButton)
        {
            document.body.appendChild(xrButton);
            xrButton.style.display = 'none';
            playButton.innerText = "Play";
            playButton.addEventListener('click', () => {
                // simulate click on xrButton
                const xrButton = document.getElementById("XRButton");
                if (xrButton) {
                    console.log("Simulate click", playButton.innerText)
                    xrButton.click();
                }
            });

        } else {
            alert("No play button found. Panic !");
        }
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



setupXR('immersive-ar').then(() =>
{
    init();
})



