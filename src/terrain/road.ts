import { InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { loadGlb } from "../loader/model_loader";
import { mapWidth, player } from "../main";
import { gsap } from "gsap";


const cars: { model: string, speed: number, scale: number }[] = [
    { model: "model1.glb", speed: 5, scale: 0.5 },
    { model: "model2.glb", speed: 3, scale: 0.5 },
    { model: "model3.glb", speed: 3, scale: 0.5 },
    { model: "model4.glb", speed: 4, scale: 0.5 },
    { model: "model5.glb", speed: 1, scale: 0.5 },
    { model: "model6.glb", speed: 6, scale: 1 }];

export function generateCar(carGenerator: Object3D): Promise<Object3D> {
    const random = Math.floor(Math.random() * cars.length);

    async function innerGenerateCar(carGenerator: Object3D) {

        const playerWorldPosition = new Vector3();
        const carGeneratorWorldPosition = new Vector3();

        player.getWorldPosition(playerWorldPosition);
        carGenerator.getWorldPosition(carGeneratorWorldPosition);

        const distance = playerWorldPosition.distanceTo(carGeneratorWorldPosition);

        if (distance > 40) {
            setTimeout(() => {
                innerGenerateCar(carGenerator);
            }, 2000);
            return;
        }


        let car = await loadGlb("assets/models/cars/", cars[random].model);
        car.scale.set(cars[random].scale, cars[random].scale, cars[random].scale)
        car.rotation.set(0, -Math.PI / 2, 0)
        car.name = "car"
        car.castShadow = true
        car.position.set(-1.25, 0, 0)
        car.userData.speed = cars[random].speed;

        const duration = 8;
        const speed = cars[random].speed;
        gsap.to(car.position, {
            duration: duration / speed,
            "ease": "none",
            x: -carGenerator.position.x * 2,
            onComplete: () => {
                carGenerator.remove(car);
                innerGenerateCar(carGenerator);
            }
        });


        carGenerator.add(car)
    }


    return new Promise(async (resolve) => {
        setTimeout(() => {
            innerGenerateCar(carGenerator);
        }, Math.round(Math.random() * 2000) + 1000);

        resolve();
    })
}

export function animateCarInstance(carMesh: InstancedMesh, index: number, translation: Vector3 = new Vector3(-(mapWidth - 1) * 2, 0, 0)) {
    function doAnimation() {
        const dummyObject = new Object3D();
        const start = new Vector3();

        const instanceMatrix = new Matrix4();
        carMesh.getMatrixAt(index, instanceMatrix);
        instanceMatrix.decompose(start, new Quaternion(), new Vector3());
        gsap.to(start, {
            x: translation.x + start.x,
            y: translation.y + start.y,
            z: translation.z + start.z,
            duration: 2,
            onUpdate: () => {
                dummyObject.position.copy(start);
                dummyObject.updateMatrix();
                carMesh.setMatrixAt(index, dummyObject.matrix);
                carMesh.instanceMatrix.needsUpdate = true;
            },
            onComplete: () => {
                instanceMatrix.setPosition(mapWidth - 2, 0, index * 2);
                carMesh.setMatrixAt(index, instanceMatrix);
                carMesh.instanceMatrix.needsUpdate = true;
                doAnimation();
            }
        });
    }

    doAnimation()

}