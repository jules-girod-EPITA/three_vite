import {AudioLoader, Mesh, PositionalAudio} from "three";
import * as THREE from "three";

export function addSound(mesh : Mesh, listener, pathAudio : string) : void {
    const sound : PositionalAudio = new THREE.PositionalAudio( listener );

    const audioLoader : AudioLoader = new THREE.AudioLoader();

    audioLoader.load(pathAudio, function( buffer ) {
        sound.setBuffer( buffer );
        sound.setRefDistance( 20 );
        sound.setMaxDistance(50);
        sound.setVolume( 0.5 );
        sound.play();
    });

    mesh.add(sound);
}