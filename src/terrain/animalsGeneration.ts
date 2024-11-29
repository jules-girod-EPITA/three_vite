import {
    AnimationMixer, Box3,
    BoxGeometry,
    BoxHelper,
    BufferGeometry,
    Group,
    Material,
    Mesh,
    MeshBasicMaterial,
    Object3D, Vector3
} from "three";
import { loadGlb } from "../loader/model_loader";
import { camera, mixers, renderer } from "../main";
import { gsap } from "gsap";
import { player } from "./initBoard";

export async function initAnimals() {

    const object: Group = new Group();

    const animals = [
        "dog.glb",
        "cat.glb",
        "chicken.glb",
        "horse.glb",
        "pig.glb",
        "sheep.glb",
    ]

    const [dog, cat, chicken, horse, pig, sheep] = await Promise.all(animals.map(loadAnimalModelGlb));

    dog.position.set(0, 0, 0);
    cat.position.set(1, 0, 0);
    chicken.position.set(2, 0, 0);
    horse.position.set(-1, 0, 0);
    pig.position.set(-2, 0, 0);
    sheep.position.set(-3, 0, 0);



    // generate a cube above the dog
    // const cube = new Mesh(new BoxGeometry(5.5, 1, 0.5), new MeshBasicMaterial({ color: 0x00ff00 }));
    // const cube = new Mesh(new BoxGeometry(8, 8, 2), new MeshBasicMaterial({ color: 0x00ff00 }));
    // cube.position.set(-0.5, 0, 0);
    //
    // object.add(cube);

    object.add(dog);
    object.add(cat);
    object.add(chicken);
    object.add(horse);
    object.add(pig);
    object.add(sheep);


    for (const model of [dog, cat, chicken, horse, pig, sheep]) {
        let mixer = new AnimationMixer(model);
        let indexAnimation = model.animations.findIndex((animation) => animation.name === "AnimalArmature|AnimalArmature|AnimalArmature|Walk");
        if (indexAnimation === -1)
            indexAnimation = model.animations.findIndex((animation) => animation.name === "AnimalArmature|AnimalArmature|AnimalArmature|Run");

        if (indexAnimation !== -1) {
            const action = mixer.clipAction(model.animations[indexAnimation]);
            action.play();
            mixers.push(mixer);
        }
    }
    return object;
}


export function translateAnimal(model: Group, translation: number) {
    gsap.to(model.position, {
        duration: 15,
        x: model.position.x + translation,
        ease: "none",
        onComplete: () => {
            model.position.x = -16;
            translateAnimal(model, translation);
        },
    });
}


async function loadAnimalModelGlb(filename: string) {
    return await loadGlb("assets/models/animals/", filename).then((animal) => {
        animal.scale.set(0.3, 0.3, 0.3)
        animal.rotation.set(0, Math.PI / 2, 0)
        return animal;
    })
}