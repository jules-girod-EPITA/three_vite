import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { Group } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

const objCache: Record<string, Group> = {};


export function loadGlb(path: string, filename: string): Promise<Group> {
    return new Promise((resolve, reject) => {

        const cacheKey = `${path}${filename}`;
        if (objCache[cacheKey]) {
            resolve(objCache[cacheKey].clone());
            return;
        }

        new GLTFLoader()
            .setPath(path)
            .load(
                filename,
                (gltf: GLTF) => {
                    const testModel = gltf.scene as Group;
                    if (testModel != null) {
                        console.log("Model loaded: ", testModel);
                        objCache[cacheKey] = testModel;
                        resolve(testModel);
                    } else {
                        console.log("Load FAILED.");
                        reject(new Error("Load FAILED."));
                    }
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filename}`);
                },
                (error) => {
                    console.error("An error happened", error);
                    reject(error);
                }
            );
    });
}

export function loadObj(path: string, filenameObj: string, filenameMtl: string): Promise<Group> {
    return new Promise((resolve, reject) => {
        new MTLLoader()
            .setPath(path)
            .load(
                filenameMtl,
                (materials) => {
                    materials.preload();
                    new OBJLoader()
                        .setMaterials(materials)
                        .setPath(path)
                        .load(
                            filenameObj,
                            (object) => {
                                const testModel = object;
                                if (testModel != null) {
                                    console.log("Model loaded: ", testModel);
                                    resolve(testModel);
                                } else {
                                    console.log("Load FAILED.");
                                    reject(new Error("Load FAILED."));
                                }
                            },
                            (xhr) => {
                                console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filenameObj}`);
                            },
                            (error) => {
                                console.error("An error happened", error);
                                reject(error);
                            }
                        );
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filenameMtl}`);
                },
                (error) => {
                    console.error("An error happened", error);
                    reject(error);
                }
            );
    });
}


export function loadFbx(path: string, filename: string): Promise<Group> {
    return new Promise((resolve, reject) => {
        const cacheKey = `${path}${filename}`;

        if (objCache[cacheKey]) {
            console.log("Model retrieved from cache: ", objCache[cacheKey]);
            resolve(objCache[cacheKey].clone());
            return;
        }

        new FBXLoader()
            .setPath(path)
            .load(
                filename,
                (object) => {
                    const testModel = object as Group;
                    if (testModel != null) {
                        console.log("Model loaded: ", testModel);
                        objCache[cacheKey] = testModel;
                        resolve(testModel);
                    } else {
                        console.log("Load FAILED.");
                        reject(new Error("Load FAILED."));
                    }
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filename}`);
                },
                (error) => {
                    console.error("An error happened", error);
                    reject(error);
                }
            );
    });
}

