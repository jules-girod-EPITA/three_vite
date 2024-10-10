import { Object3D, Box3, Vector3 } from "three";
import { scene } from "../main";

const respawnPosition = new Vector3(0, 0, 0); // Position de respawn du joueur

export function checkCollisions(cars: Object3D[], player: Object3D) {
    const playerBox = new Box3().setFromObject(player);

    cars.forEach((car) => {
        const carBox = new Box3().setFromObject(car);

        if (playerBox.intersectsBox(carBox)) {
            // Collision détectée, repositionner le joueur
            scene.remove(player);
        }
    });
}