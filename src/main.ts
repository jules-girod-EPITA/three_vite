import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import {Mesh, PerspectiveCamera, Scene, WebGLRenderer, XRTargetRaySpace} from "three";

let container : Element;
let camera : PerspectiveCamera, scene : Scene, renderer : WebGLRenderer;
let controller : XRTargetRaySpace;

let reticle : Mesh;

let hitTestSource : XRHitTestSource | null;
let hitTestSourceRequested : boolean = false;
let boardPlaced : boolean = false;

init();

function init() {

    // ===== DIV ELEMENT =====

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // ===== SCENE, CAMERA AND LIGHT =====

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 3 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    // ===== RENDERER =====

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    // ===== BUTTON =====

    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

    function onSelect() {

        if ( reticle.visible ) {

            const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
            const geometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.2, 32 ).translate( 0, 0.1, 0 );
            const mesh = new THREE.Mesh( geometry, material );
            reticle.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
            mesh.scale.y = Math.random() * 2 + 1;
            scene.add( mesh );
        }

    }

    // ===== CONTROLLER =====

    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller );

    // ===== RETICLE =====

    reticle = new THREE.Mesh(
        new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add( reticle );

    // ===== RESIZE =====

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
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

                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render( scene, camera );
}