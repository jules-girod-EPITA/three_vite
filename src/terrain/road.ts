import {
    Box3,
    BufferGeometry,
    InstancedMesh,
    Matrix4,
    Mesh,
    Object3D,
    PositionalAudio,
    Quaternion,
    Vector3
} from "three";
import { mapWidth } from "../main";
import { gsap } from "gsap";
import { cube, player } from "./initBoard";


const cars: { model: string, speed: number, scale: number }[] = [
    { model: "model1.glb", speed: 5, scale: 0.5 },
    { model: "model2.glb", speed: 3, scale: 0.5 },
    { model: "model3.glb", speed: 3, scale: 0.5 },
    { model: "model4.glb", speed: 4, scale: 0.5 },
    { model: "model5.glb", speed: 1, scale: 0.5 },
    { model: "model6.glb", speed: 6, scale: 1 }];

export function animateCarInstance(carMesh: InstancedMesh, index: number, spawnPoint: Vector3, carGeometry: BufferGeometry, carModelIndex: number, positionalSounds: PositionalAudio[], translation: Vector3 = new Vector3(-(mapWidth - 1) * 2, 0, 0)) {
    function doAnimation() {
        const dummyObject = new Object3D();
        const curPos = new Vector3();
        const rotation = new Quaternion();
        const scale = new Vector3();

        const instanceMatrix = new Matrix4();
        carMesh.getMatrixAt(index, instanceMatrix);
        instanceMatrix.decompose(curPos, rotation, scale);
        const duration = 8 / cars[carModelIndex].speed;
        gsap.to(curPos, {
            x: translation.x + curPos.x,
            y: translation.y + curPos.y,
            z: translation.z + curPos.z,
            duration: duration,
            "ease": "none",
            onUpdate: () => {
                dummyObject.position.copy(curPos);
                dummyObject.quaternion.copy(rotation);
                dummyObject.scale.copy(scale);
                dummyObject.updateMatrix();
                // A verif si jamais ca marche pas
                positionalSounds[index].position.copy(dummyObject.position)
                carMesh.setMatrixAt(index, dummyObject.matrix);
                carMesh.instanceMatrix.needsUpdate = true;

                const playerWorldPosition = new Vector3();
                const carGeneratorWorldPosition = new Vector3();

                player.getWorldPosition(playerWorldPosition);
                dummyObject.getWorldPosition(carGeneratorWorldPosition);

                if(playerWorldPosition.distanceTo(carGeneratorWorldPosition) > 10)
                    return;

                const playerBox = new Box3().setFromObject(player);

                const tempMesh = new Mesh(carGeometry);
                tempMesh.applyMatrix4(dummyObject.matrix);


                if (!dummyObject.userData.lastCollision) {
                    dummyObject.userData.lastCollision = new Date().getTime() - 1000;
                }

                const carBox = new Box3().setFromObject(tempMesh);

                if (playerBox.intersectsBox(carBox) && dummyObject.userData.lastCollision + 1000 < new Date().getTime()) {
                    dummyObject.userData.lastCollision = new Date().getTime();
                    player.setDeath();
                    gsap.to(cube.rotation, {
                        duration: 1,
                        x: Math.PI * 2 * 8,
                        y: Math.PI * 2 * 8,
                        z: Math.PI * 2 * 8
                    });

                    const left = carBox.getCenter(new Vector3()).x > playerBox.getCenter(new Vector3()).x;

                    gsap.to(cube.rotation, {
                        duration: 1,
                        x: Math.random() < 0.5 ? Math.PI / 2 : 3 * Math.PI / 2,
                        y: 0,
                        z: Math.random() * Math.PI * 2 * 8
                    });

                    const originalPosition = new Vector3().copy(player.position);
                    gsap.to(player.position, {
                        duration: 0.5,
                        x: originalPosition.x + (cars[carModelIndex].speed * (left ? -1 : 1)),
                        y: originalPosition.y + 1,
                        ease: "none",
                        onComplete: () => {
                            gsap.to(player.position, {
                                duration: 0.5,
                                x: originalPosition.x + (cars[carModelIndex].speed * (left ? -1.25 : 1.25)),
                                y: 0,
                                ease: "none",
                            })
                        }
                    });
                }
            },
            onComplete: () => {
                instanceMatrix.setPosition(spawnPoint);
                carMesh.setMatrixAt(index, instanceMatrix);
                carMesh.instanceMatrix.needsUpdate = true;
                doAnimation();
            }
        });
    }

    return new Promise(async (resolve) => {
        setTimeout(() => {
            doAnimation()
        }, Math.round(Math.random() * 2000));

        resolve();
    })


}