import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { BufferGeometry, Group, Material, Mesh, Object3D } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

export function loadGlb(path: string, filename: string): Promise<Group> {
    return new Promise((resolve, reject) => {


        new GLTFLoader()
            .setPath(path)
            .load(
                filename,
                (gltf: GLTF) => {
                    const testModel = gltf.scene as Group;
                    if (testModel != null) {
                        // console.log(`Model loaded ${filename}: `, testModel);
                        resolve(testModel);
                    } else {
                        // console.log("Load FAILED.");
                        reject(new Error("Load FAILED."));
                    }
                },
                (xhr) => {
                    // console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filename}`);
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
                                    // console.log(`Model loaded ${filenameObj}`, testModel);
                                    resolve(testModel);
                                } else {
                                    // console.log("Load FAILED.");
                                    reject(new Error("Load FAILED."));
                                }
                            },
                            (xhr) => {
                                // console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filenameObj}`);
                            },
                            (error) => {
                                console.error("An error happened", error);
                                reject(error);
                            }
                        );
                },
                (xhr) => {
                //     console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filenameMtl}`);
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
        new FBXLoader()
            .setPath(path)
            .load(
                filename,
                (object) => {
                    const testModel = object as Group;
                    if (testModel != null) {
                        // console.log(`Model loaded ${filename}`, testModel);
                        resolve(testModel);
                    } else {
                        // console.log("Load FAILED.");
                        reject(new Error("Load FAILED."));
                    }
                },
                (xhr) => {
                    // console.log((xhr.loaded / xhr.total * 100) + `% loaded -${path + filename}`);
                },
                (error) => {
                    console.error("An error happened", error);
                    reject(error);
                }
            );
    });
}

export function extractGeometryAndMaterialFromModel(model: Group): {
    geometry: BufferGeometry,
    material: Material | Material[]
} {
    let geometry: BufferGeometry = new BufferGeometry();
    let material: Material | Material[] = new Material();
    model.traverse((child : Object3D) => {
        if (child instanceof Mesh) {
            geometry = child.geometry.clone();
            material = child.material;
        }
    });

    return { geometry: geometry, material: material };

}

export async function extractGeometriesAndMaterialsFromFbx(path : string, fileName: string, count: number){
    return await Promise.all(
        Array.from({ length: count }, (_, i) => i + 1)
    ).then(indices =>
        Promise.all(indices.map(async (index) => {
            const { geometry, material } = extractGeometryAndMaterialFromModel(
                await loadFbx(path, fileName + (count !== 1 ? `${index}` : "") + ".fbx")
            );
            return [geometry, material];
        }))
    ).then(results => [results.map(([geometry]) => geometry), results.map(([, material]) => material)]);
}

export async function extractGeometriesAndMaterialsFromGlb(path: string, fileName: string, count: number) {
    return await Promise.all(
        Array.from({ length: count }, (_, i) => i + 1)
    ).then(indices =>
        Promise.all(indices.map(async (index) => {
            const { geometry, material } = extractGeometryAndMaterialFromModel(
                await loadGlb(path, fileName + (count !== 1 ? `${index}` : "") + ".glb")
            );
            return [geometry, material];
        }))
    ).then(results => [results.map(([geometry]) => geometry), results.map(([, material]) => material)]);
}