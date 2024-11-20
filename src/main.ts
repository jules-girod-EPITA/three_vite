import {
    AmbientLight,
    BoxGeometry,
    CylinderGeometry, HemisphereLight,
    LoadingManager,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    Object3D,
    PCFSoftShadowMap,
    PerspectiveCamera,
    RingGeometry,
    Scene,
    Vector3,
    WebGLRenderer,
    XRTargetRaySpace,
} from 'three'

import Stats from 'three/examples/jsm/libs/stats.module'
import { resizeRendererToDisplaySize } from './helpers/responsiveness'
import './style.css'
import { initButtonBehavior } from "./components/buttonBehavior";
import { checkCollisionsCars, checkCollisionsRocks, checkCollisionsTree } from "./collision/collision";
import { CellType } from "./types";
import { board, initBoard, player } from "./terrain/initBoard";
import { ARButton } from 'three/addons/webxr/ARButton.js';


// const CANVAS_ID = 'scene'
// let canvas: HTMLElement
let renderer: WebGLRenderer
let scene : Scene;
let loadingManager: LoadingManager
export let ambientLight: AmbientLight

export let camera: PerspectiveCamera
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

export const sideLength = 1


// AR variable
let container : Element;
let controller: XRTargetRaySpace;
let reticle: Mesh;
let hitTestSource: XRHitTestSource | null;
let hitTestSourceRequested: boolean = false;
let boardPlaced: boolean = false;
export let isAR: boolean = false;

initButtonBehavior();
init();


function onSelectAr() {

    if (reticle.visible) {
        console.log("clicked on reticle");
        initBoard().then((board) => {
            boardPlaced = true;
            reticle.matrix.decompose(board.position, board.quaternion, board.scale);
            scene.add(board);
        })
    }
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function init() {
    // ===== DIV ELEMENT =====
    console.log("Init function is called");

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // ===== SCENE, CAMERA AND LIGHT =====

    scene = new Scene();
    camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
    const light = new HemisphereLight( 0xffffff, 0xbbbbff, 3 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    // ===== RENDERER =====

    renderer = new WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    // ===== BUTTON =====

    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

    // ===== CONTROLLER =====

    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelectAr );
    scene.add( controller );

    // ===== RETICLE =====

    reticle = new Mesh(
        new RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add( reticle );

    // ===== RESIZE =====

    window.addEventListener( 'resize', onWindowResize );
}


function animate( timestamp, frame ) {
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
                console.log("Reticle is visible");
                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

            } else {
                console.log("Reticle is not visible")
                reticle.visible = false;
            }
        }
    }
    renderer.render( scene, camera );
}

