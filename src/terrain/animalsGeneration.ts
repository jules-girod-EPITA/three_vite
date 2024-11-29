import {
    AnimationMixer, Box3,
    BoxGeometry,
    BoxHelper,
    Group,
    Mesh,
    MeshBasicMaterial, Object3D, Vector3,
} from "three";
import { loadFbx, loadGlb } from "../loader/model_loader";
import { mapWidth, mixers, trees } from "../main";
import { gsap } from "gsap";
import { animals, board, hitBox, player } from "./initBoard";
import { addAnimation } from "../misc";

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
    const cube = new Mesh(new BoxGeometry(5.5, 1, 0.5), new MeshBasicMaterial({ color: 0x00ff00 }));

    const boxHelper = new BoxHelper(cube, 0xffff00);
    boxHelper.applyMatrix4(object.matrix)
    boxHelper.visible = false;
    object.add(boxHelper);

    object.add(dog);
    object.add(cat);
    object.add(chicken);
    object.add(horse);
    object.add(pig);
    object.add(sheep);




    for (const model of [dog, cat, chicken, horse, pig, sheep]) {
        addAnimation(model, "AnimalArmature|AnimalArmature|AnimalArmature|Walk", "AnimalArmature|AnimalArmature|AnimalArmature|Run");
        // let mixer = new AnimationMixer(model);
        // let indexAnimation = model.animations.findIndex((animation) => animation.name === "AnimalArmature|AnimalArmature|AnimalArmature|Walk");
        // if (indexAnimation === -1)
        //     indexAnimation = model.animations.findIndex((animation) => animation.name === "AnimalArmature|AnimalArmature|AnimalArmature|Run");
        //
        // if (indexAnimation !== -1) {
        //     const action = mixer.clipAction(model.animations[indexAnimation]);
        //     action.play();
        //     mixers.push(mixer);
        // }
    }
    // object.position.x = -4;
    object.position.z = 6;

    return [object, cube];
}


export async function petDog()
{
    const object = new Object3D();
    const dog = await loadAnimalModelGlb("dog.glb");
    dog.position.set(0.55, 0, 0.4);


    const humain = await loadAnimalModelFbx("Petting_Animal.fbx");
    humain.scale.set(0.003, 0.003, 0.003);
    humain.position.set(0, 0, 0);
    humain.lookAt(dog.position)
    dog.lookAt(humain.position)


    object.add(dog);
    object.add(humain);

    addAnimation(humain, "mixamo.com");
    addAnimation(dog, "AnimalArmature|AnimalArmature|AnimalArmature|Headbutt")

    return object;
}

export function translateAnimal(model: Group, translation: number, hitBox: Mesh) {
    gsap.to(model.position, {
        duration: 10,
        x: model.position.x + translation,
        ease: "none",
        onComplete: () => {
            model.position.x = -8;
            translateAnimal(model, translation, hitBox);
        },
        onUpdate: () => {
            const carBox = new Box3().setFromObject(hitBox);
            carBox.applyMatrix4(model.matrix);
            const playerBox = new Box3().setFromObject(player);

            if (playerBox.intersectsBox(carBox)) {
                player.setDeath();
            }
        }
    });
}


async function loadAnimalModelGlb(filename: string) {
    return await loadGlb("assets/models/animals/", filename).then((animal) => {
        animal.scale.set(0.3, 0.3, 0.3)
        animal.rotation.set(0, Math.PI / 2, 0)
        return animal;
    })
}

async function loadAnimalModelFbx(filename: string) {
    return await loadFbx("assets/models/animals/", filename).then((animal) => {
        return animal;
    })
}