import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader.js";

export function loadGlb(scene, path, filename) {
    function gltfReader(gltf) {
        let testModel = null;

        testModel = gltf.scene;

        if (testModel != null) {
            console.log("Model loaded:  " + testModel);
            scene.add(gltf.scene);
        } else {
            console.log("Load FAILED.  ");
        }
    }

    new GLTFLoader()
        .setPath(path)
        .load(filename, gltfReader);
}

export function loadObj(scene, path, filenameObj, filenameMtl) {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(path).
    load(filenameMtl, (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);
        objLoader.load(filenameObj, (object) => {
            scene.add(object);
        });
    });
}


