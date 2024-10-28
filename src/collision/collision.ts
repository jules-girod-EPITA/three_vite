import { Box3, Box3Helper, Object3D, Vector3 } from "three";
import { cube, scene } from "../main";
import { gsap } from "gsap";


export function checkCollisionsCars(cars: Object3D[], player: Object3D) {
    const playerBox = new Box3().setFromObject(player);

    cars.forEach((car, index) => {
        const carBox = new Box3().setFromObject(car);

        if (!car.userData.hasCollided) {
            car.userData.hasCollided = false;
        }


        // const helper = new Box3Helper(carBox, 0xffff00);
        // scene.add(helper);
        // setTimeout(() => {
        //     scene.remove(helper);
        // }, 10);




        if (playerBox.intersectsBox(carBox) && !car.userData.hasCollided) {
            car.userData.hasCollided = true;
            gsap.to(cube.rotation, {
                duration: 1,
                x: Math.PI * 2 * 8,
                y: Math.PI * 2 * 8,
                z: Math.PI * 2 * 8
            });

            const directionToBePushed = new Vector3();
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
                x: originalPosition.x + (left ? -car.userData.speed : car.userData.speed),
                y: originalPosition.y + 1,
                ease: "none",
                onComplete: () => {
                    gsap.to(player.position, {
                        duration: 0.5,
                        x: originalPosition.x + (left ? -car.userData.speed *1.25 : car.userData.speed*1.25),
                        y: 0,
                        ease: "none",
                    })
                }
            });
        }
    });
}

export function checkCollisionsTree(trees: Object3D[], player: Object3D) {

    trees.forEach((tree) => {
        // get tree position in world space
        const treePosition = tree.getWorldPosition(new Vector3());
        const playerPosition = player.getWorldPosition(new Vector3());
        const distance = treePosition.distanceTo(playerPosition);

        if (!tree.userData.hasCollided) {
            tree.userData.hasCollided = false;
        }

        if (distance < 1 && !tree.userData.hasCollided) {
            gsap.to(cube.rotation, {
                duration: 1,
                x: Math.PI * 2 * 8,
                y: Math.PI * 2 * 8,
                z: Math.PI * 2 * 8
            });

            const directionToBePushed = new Vector3();
            const left = treePosition.x === playerPosition.x ? 0 : treePosition.x > playerPosition.x ? 1 : -1;
            const front = treePosition.z === playerPosition.z ? 0 : treePosition.z > playerPosition.z ? 1 : -1;

            gsap.to(cube.rotation, {
                duration: 1,
                x: Math.random() < 0.5 ? Math.PI / 2 : 3 * Math.PI / 2,
                y: 0,
                z: Math.random() * Math.PI * 2 * 8
            });

            const originalPosition = new Vector3().copy(player.position);
            const middPosition = originalPosition.clone().add(new Vector3(-left, 1, -front))
            const endPosition = originalPosition.clone().add(new Vector3(-left * 1.75, 0, -front * 1.75))
            gsap.to(player.position, {
                duration: 0.5,
                x: middPosition.x,
                y: middPosition.y,
                z: middPosition.z,
                ease: "none",
                onComplete: () => {
                    gsap.to(player.position, {
                        duration: 0.5,
                        x: endPosition.x,
                        y: 0,
                        z: endPosition.z,
                        ease: "none",
                    })
                }
            });
        }
    });
}