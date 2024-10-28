import {BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3} from "three";
import {loadFbx} from "../loader/model_loader";
import {player, sideLength} from "../main";
import {gsap} from "gsap";


export function getRoadsLine(): Promise<Object3D> {

    async function generateCar(carGenerator: Object3D) {

        const playerWorldPosition = new Vector3();
        const carGeneratorWorldPosition = new Vector3();

        player.getWorldPosition(playerWorldPosition);
        carGenerator.getWorldPosition(carGeneratorWorldPosition);

        const distance = playerWorldPosition.distanceTo(carGeneratorWorldPosition);

        // Return immediately if the distance is greater than 20 units
        if (distance > 40) {
            console.log(`Distance: ${distance} units`);
            setTimeout(() => {
                generateCar(carGenerator);
            }, 2000);
            return;
        }

        const car = await loadFbx("assets/models/cars/", "model1.fbx");
        car.scale.set(1, 1, 1)
        car.rotation.set(0, Math.PI /2, Math.PI)
        car.name = "car"
        car.castShadow = true
        car.position.x = -1.25

        const duration = 8;
        const speed = Math.random() * 5 + 1;
        gsap.to(car.position, {
            duration: duration / speed,
            "ease": "none",
            x: -carGenerator.position.x * 2,
            onComplete: () => {
                console.log("Car removed");
                carGenerator.remove(car);
                generateCar(carGenerator);
            }
        });


        carGenerator.add(car)
    }


    return new Promise<Object3D>(async (resolve) => {
        const road: Object3D = new Object3D();
        const roadBlock = 9;
        const COEF_SCALE = 0.25;

        for (let i = -Math.floor(roadBlock / 2); i < Math.ceil(roadBlock / 2); i++) {
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

        // generate a cube a Math.floor(roadBlock / 2) * 2
        const cubeGeometry = new BoxGeometry(sideLength, sideLength, sideLength)
        const cubeMaterial = new MeshStandardMaterial({
            color: 'black',
            metalness: 0.5,
            roughness: 0.7,
        })
        const carGenerator = new Mesh(cubeGeometry, cubeMaterial)
        carGenerator.castShadow = true
        carGenerator.position.y = 0.5
        carGenerator.position.x = Math.floor(roadBlock / 2) * 2
        road.add(carGenerator)

        setTimeout(() => {
            generateCar(carGenerator);
        }, Math.round(Math.random() * 10000) + 1000);

        resolve(road);
    })
}
