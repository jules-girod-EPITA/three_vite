import { Object3D } from "three";
import { loadFbx } from "../loader/model_loader";
import { playableArea } from "../main";

enum PropType {
    Tree,
    DeadTree,
    Flower,
    Rock,
}

async function loadProp(i: number, propType: PropType) {
    let index = 0;
    let propPath = "";
    let propName = "";
    switch (propType) {
        case PropType.Tree:
            index = Math.floor(Math.random() * 3) + 1
            propPath = "Tree";
            propName = "tree";
            break;
        case PropType.DeadTree:
            index = Math.floor(Math.random() * 3) + 1
            propPath = "DeadTree";
            propName = "dead_tree";
            break;
        case PropType.Flower:
            index = Math.floor(Math.random() * 2) + 1
            propPath = "Flowers";
            propName = "flower";
            break;
        case PropType.Rock:
            index = Math.floor(Math.random() * 2) + 1
            propPath = "Rock";
            propName = "rock";
            break;
        default:
            console.error(`Invalid prop type ${propType}`);
            return;
    }
    try {
        return await loadFbx("assets/models/props/", `${propPath}_${index}.fbx`).then((model) => {
            model.name = propName;
            model.scale.set(0.5, 0.5, 0.5)
            model.position.set(i * 2, 0, 0);
            return model;
        });
    }
    catch (error) {
        console.error("An error happened while loading model:", error);
    }
}

export function getGrassLine(): Promise<Object3D> {
    return new Promise<Object3D>(async (resolve) => {
        const road: Object3D = new Object3D();
        const randomArea = Array.from({ length: playableArea }, () => Math.floor(Math.random() * 100));
        const COEF_SCALE = 0.25;

        // TODO : make sure there is always a path
        for (let i = -Math.floor(playableArea / 2); i < Math.ceil(playableArea / 2); i++) {
            try {
                // 0 - 5 = tree
                // 5 - 10 = Dead tree
                // 10 - 30 = Flowers
                // 30 - 50 = Rock
                if (randomArea[i + Math.floor(playableArea / 2)] < 5) {
                    road.add(await loadProp(i, PropType.Tree));
                } else if (randomArea[i + Math.floor(playableArea / 2)] < 10) {
                    road.add(await loadProp(i, PropType.DeadTree));
                } else if (randomArea[i + Math.floor(playableArea / 2)] < 30) {
                    road.add(await loadProp(i, PropType.Flower));
                } else if (randomArea[i + Math.floor(playableArea / 2)] < 50) {
                    road.add(await loadProp(i, PropType.Rock));
                }
            } catch (error) {
                console.error("An error happened while loading model:", error);
            }
        }
        // parcours les enfants de road et mettre une rotation aléatoire


        resolve(road);
    })

}