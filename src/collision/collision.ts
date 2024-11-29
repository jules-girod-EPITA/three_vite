import {
    Box3,
    BoxHelper, BufferGeometry,
    EdgesGeometry, Line,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    Object3D,
    Triangle,
    Vector3
} from "three";
import { gsap } from "gsap";
import { cube, player } from "../terrain/initBoard";


export function checkCollisionsTree(trees: Object3D[]) {
    if(player.isDead())
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
    if(player.isDead())
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
