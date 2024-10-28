import { Box3, Object3D, Vector3 } from "three";
import { cube } from "../main";
import { gsap } from "gsap";


export function checkCollisions(cars: Object3D[], player: Object3D) {
    const playerBox = new Box3().setFromObject(player);

    cars.forEach((car) => {
        const carBox = new Box3().setFromObject(car);

        if (!car.userData.hasCollided) {
            car.userData.hasCollided = false;
        }


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