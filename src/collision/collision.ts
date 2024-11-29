import { Box3, BoxHelper, Object3D, Vector3 } from "three";
import { gsap } from "gsap";
import { board, cube, player } from "../terrain/initBoard";


export function checkCollisionsCars(cars: Object3D[]) {
    if(player.done)
        return;

    const playerBox = new Box3().setFromObject(player);

    cars.forEach((car, index) => {
        const carBox = new Box3().setFromObject(car);

        if (!car.userData.lastCollision) {
            car.userData.lastCollision = new Date().getTime() - 1000;
        }

        if (playerBox.intersectsBox(carBox) && car.userData.lastCollision + 1000 < new Date().getTime()) {
            car.userData.lastCollision = new Date().getTime();
            // player.setDeath();
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
                x: originalPosition.x + (left ? -car.userData.speed : car.userData.speed),
                y: originalPosition.y + 1,
                ease: "none",
                onComplete: () => {
                    gsap.to(player.position, {
                        duration: 0.5,
                        x: originalPosition.x + (left ? -car.userData.speed * 1.25 : car.userData.speed * 1.25),
                        y: 0,
                        ease: "none",
                    })
                }
            });
        }
    });
}

export function checkCollisionsTree(trees: Object3D[]) {
    if(player.done)
        return;

    trees.forEach((tree) => {
        const treePosition = tree.getWorldPosition(new Vector3());
        const playerPosition = player.getWorldPosition(new Vector3());
        const distance = treePosition.distanceTo(playerPosition);
        const box = new Box3().setFromObject(tree);

        // const boxHelper = new BoxHelper(tree, 0xffff00);
        // board.add(boxHelper);

        if (!tree.userData.hasCollided) {
            tree.userData.hasCollided = new Date().getTime() - 4000;
        }

        if (distance < 10 && box.intersectsBox(new Box3().setFromObject(player)) && tree.userData.hasCollided + 4000 < new Date().getTime()) {
            player.setDeath();
            tree.userData.hasCollided = new Date().getTime();
        }
    });
}

export function checkCollisionsRocks(rocks: Object3D[]) {
    if(player.done)
        return;
    rocks.forEach((rock) => {
        const rockPosition = rock.getWorldPosition(new Vector3());
        const playerPosition = player.getWorldPosition(new Vector3());
        const distance = rockPosition.distanceTo(playerPosition);



        if (!rock.userData.lastCollision) {
            rock.userData.lastCollision = new Date().getTime() - 3000;
        }


        if (distance < 1 && rock.userData.lastCollision + 3000 < new Date().getTime()) {
            rock.userData.lastCollision = new Date().getTime();

            let front = rockPosition.z === playerPosition.z ? 0 : rockPosition.z > playerPosition.z ? 1 : -1;

            let rotationX = front === 1 ? Math.PI / 2 : -Math.PI / 2;
            gsap.to(cube.rotation, {
                duration: 0.25,
                x: rotationX,
                onComplete: () => {
                    gsap.to(cube.rotation, {
                        duration: 2,
                        x: 0,
                    });
                }
            });
            gsap.to(player.position, {
                duration: 0.25,
                y: 0.01,
                onComplete: () => {
                    gsap.to(player.position, {
                        duration: 2,
                        y: 0,
                    });
                }
            })
        }
    });
}
