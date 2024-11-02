import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { loadFbx, loadGlb } from "../loader/model_loader";
import { playableArea, player, sideLength } from "../main";
import { gsap } from "gsap";


const cars: { model: string, speed: number, scale: number }[] = [
    { model: "model1.glb", speed: 5, scale: 0.5 },
    { model: "model2.glb", speed: 3, scale: 0.5 },
    { model: "model3.glb", speed: 3, scale: 0.5 },
    { model: "model4.glb", speed: 4, scale: 0.5 },
    { model: "model5.glb", speed: 1, scale: 0.5 },
    { model: "model6.glb", speed: 6, scale: 1 }];

export function getRoadsLine(): Promise<Object3D> {
    const random = Math.floor(Math.random() * cars.length);

    async function generateCar(carGenerator: Object3D) {

        const playerWorldPosition = new Vector3();
        const carGeneratorWorldPosition = new Vector3();

        player.getWorldPosition(playerWorldPosition);
        carGenerator.getWorldPosition(carGeneratorWorldPosition);

        const distance = playerWorldPosition.distanceTo(carGeneratorWorldPosition);

        if (distance > 40) {
            setTimeout(() => {
                generateCar(carGenerator);
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
                generateCar(carGenerator);
            }
        });


        carGenerator.add(car)
    }


    return new Promise<Object3D>(async (resolve) => {
        const road: Object3D = new Object3D();
        const COEF_SCALE = 0.25;

        for (let i = -Math.floor(playableArea / 2); i < Math.ceil(playableArea / 2); i++) {
            try {
                const model = await loadFbx("assets/models/streets/", "Street_Straight.fbx");
                model.position.set(i * 2, 0, 0);
                model.rotation.set(0, Math.PI / 2, 0);
                model.scale.set(sideLength * COEF_SCALE, sideLength * COEF_SCALE, sideLength * COEF_SCALE);
                road.add(model);
            } catch (error) {
                console.error("An error happened while loading model:", error);
            }
        }

        const tunnelEntrance = await loadFbx("assets/models/streets/", "Tunnel_Entrance.fbx");
        tunnelEntrance.scale.set(0.5, 0.5, 0.5);
        tunnelEntrance.position.set(Math.floor(playableArea / 2) * 2, 0, 0);
        road.add(tunnelEntrance);

        setTimeout(() => {
            generateCar(tunnelEntrance);
        }, Math.round(Math.random() * 2000) + 1000);

        resolve(road);
    })
}
