import {BoxGeometry, Mesh, MeshStandardMaterial, Object3D} from "three";
import {loadFbx} from "../loader/model_loader";
import {sideLength} from "../main";
import {gsap} from "gsap";


export function getRoadsLine(): Promise<Object3D> {

    function generateCar(carGenerator: Object3D) {
        const cubeGeometry = new BoxGeometry(sideLength, sideLength, sideLength)
        const cubeMaterial = new MeshStandardMaterial({
            color: 'gray',
            metalness: 0.8,
            roughness: 0.6,
        })
        const car = new Mesh(cubeGeometry, cubeMaterial)
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


    return new Promise<Object3D>((resolve) => {
        const road: Object3D = new Object3D();
        const roadBlock = 11;
        const COEF_SCALE = 0.25;

        for (let i = -Math.floor(roadBlock / 2); i < Math.ceil(roadBlock / 2); i++) {
            loadFbx("assets/models/streets/", "Street_Straight.fbx").then((model) => {
                model.position.set(i * 2, 0, 0);
                model.rotation.set(0, Math.PI / 2, 0);
                model.scale.set(sideLength * COEF_SCALE, sideLength * COEF_SCALE, sideLength * COEF_SCALE);
                road.add(model);
            }).catch((error) => {
                console.error("An error happened", error);
            });
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
