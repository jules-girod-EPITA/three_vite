import {
    Box3,
    Object3D,
    Vector3
} from "three";
import { player } from "../terrain/initBoard";


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