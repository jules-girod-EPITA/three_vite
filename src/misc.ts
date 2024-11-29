import { CellType } from "./types";
import { AnimationMixer, Euler, Object3D } from "three";
import { gsap } from "gsap";
import { deathText, mixers } from "./main";
import { board } from "./terrain/initBoard";
import { vibrate } from "./controller/controller";
import { board } from "./terrain/initBoard";


export class Player extends Object3D {
    private readonly onUpdate: () => void;
    private death: boolean = false;
    private canRevive: boolean = false;

    constructor() {
        super();
        this.onUpdate = () => {
            // if (this.death && camera.parent === player && !this.done) {
            //     const cameraRealPosition = camera.getWorldPosition(new Vector3());
            //     board.remove(camera);
            //     camera.position.set(cameraRealPosition.x, cameraRealPosition.y, cameraRealPosition.z);
            //     board.add(camera);
            //     const direction = new Vector3();
            //     direction.subVectors(camera.position, player.position).normalize();
            //     gsap.to(camera.position, {
            //         duration: 1.5,
            //         x: camera.position.x + direction.x,
            //         y: camera.position.y + direction.y,
            //         z: camera.position.z + direction.z,
            //         ease: "none",
            //     });
            //
            //     const originalIntensity = ambientLight.intensity;
            //
            //     gsap.to(ambientLight, {
            //         duration: 3,
            //         intensity: 0,
            //         onComplete: () => {
            //             ambientLight.intensity = originalIntensity;
            //             reset();
            //         }
            //     });
            //
            // } else if (this.position.z === 111 * 2 && !this.death && !this.done) {
            //     this.done = true;
            //     board.remove(camera);
            //     camera.position.set(-6, 3.5, 222);
            //     board.add(camera);
            //     camera.lookAt(2.5, 2, 230);
            //
            //     player.position.set(0, 0, 111 * 2);
            //
            //     gsap.to(player.position, {
            //         duration: 1,
            //         z: 226,
            //         ease: "none",
            //         onComplete: () => {
            //             gsap.to(cube.rotation, {
            //                 duration: 0.7,
            //                 y: Math.PI / 2,
            //                 ease: "none",
            //             });
            //             gsap.to(player.position, {
            //                 duration: 0.35,
            //                 y: 0.28,
            //                 z: 227.6,
            //                 ease: "none",
            //                 onComplete: () => {
            //                     gsap.to(player.position, {
            //                         duration: 0.35,
            //                         x: 2,
            //                         z: 228.2,
            //                         ease: "none",
            //                         onComplete: () => {
            //                             this.animationDone = 1;
            //                         }
            //                     });
            //                 }
            //             });
            //
            //         }
            //     });
            // } else if (this.animationDone === 1) {
            //     this.animationDone = 2;
            //     const lightIntensity = 1000;
            //     const spotLight = new SpotLight('red', lightIntensity);
            //     spotLight.position.set(0, 8.5, 244);
            //     board.add(spotLight);
            //
            //     gsap.to(spotLight, {
            //         duration: 0.5,
            //         intensity: 0,
            //         repeat: 5,
            //         ease: "bounce.inOut",
            //         onComplete: () => {
            //             const originalIntensity = ambientLight.intensity;
            //
            //
            //             gsap.to(ambientLight, {
            //                 duration: 3,
            //                 intensity: 0,
            //                 onComplete: () => {
            //                     ambientLight.intensity = originalIntensity;
            //                     reset();
            //                 }
            //             });
            //         }
            //     });
            //
            // }

        };
    }

    displayDeathMessage() {
        console.log("Display death message");
        deathText.visible = true;
        deathText.position.y = -2;
        gsap.to(deathText.position, {
            duration: 1,
            y: -0.1,
            ease: "none",
            onComplete: () => {
                bounceText();
            }
        });

        function bounceText() {
            if (!deathText.visible)
                return;
            gsap.to(deathText.position, {
                duration: 1,
                y: deathText.position.y + 0.1,
                ease: "none",
                onComplete: () => {
                    gsap.to(deathText.position, {
                        duration: 1,
                        y: deathText.position.y - 0.1,
                        ease: "none",
                        onComplete: bounceText
                    });
                }
            });
        }
    }

    setDeath() {
        if (!this.death) {
            vibrate(1000);
            this.death = true;
            this.canRevive = false;
            this.displayDeathMessage();
            setTimeout(() => {
                this.canRevive = true;
            }, 3000);
        }
    }

    isDead() {
        return this.death;
    }

    tryRevive() {
        if(this.canRevive)
            this.reset();
    }

    updateMatrixWorld(force?: boolean): void {

        super.updateMatrixWorld(force);
        this.onUpdate();
    }

    private reset() {
        this.canRevive = false;
        this.death = false;
        deathText.visible = false;
        board.rotation.set(0, Math.PI, 0);
        board.position.set(0, -0.7, 0);
    }
}



type CellConfig = {
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    rotation?: Euler;
    randomRotation?: boolean;
    randomPosition?: boolean;
};

export function generateCellConfig() {
    const cellConfig: {
        [key in CellType]: CellConfig | null;
    } = {
        [CellType.ROAD]: {
            scaleX: 0.25,
            scaleY: 0.25,
            scaleZ: 0.25,
            rotation: new Euler(0, Math.PI / 2, 0),
            randomPosition: false,
        },
        [CellType.FLOWERS_1]: {
            scaleX: 0.2,
            scaleY: 0.2,
            scaleZ: 0.2,
            randomRotation: true,
            randomPosition: true,
        },
        [CellType.FLOWERS_2]: {
            scaleX: 0.2,
            scaleY: 0.2,
            scaleZ: 0.2,
            randomRotation: true,
            randomPosition: true,
        },
        [CellType.ROCK_1]: {
            scaleX: 0.35,
            scaleY: 0.35,
            scaleZ: 0.35,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.ROCK_2]: {
            scaleX: 0.35,
            scaleY: 0.35,
            scaleZ: 0.35,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_1]: {
            scaleX: 0.4,
            scaleY: 0.5,
            scaleZ: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_2]: {
            scaleX: 0.5,
            scaleY: 0.5,
            scaleZ: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_3]: {
            scaleX: 0.3,
            scaleY: 0.5,
            scaleZ: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_1]: {
            scaleX: 0.3,
            scaleY: 0.5,
            scaleZ: 0.4,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_2]: {
            scaleX: 0.3,
            scaleY: 0.5,
            scaleZ: 0.4,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_3]: {
            scaleX: 0.2,
            scaleY: 0.5,
            scaleZ: 0.4,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.Empty]: null,
    };
    return cellConfig;
}


export function addAnimation(model : Object3D, ...animationsNames: string[])
{
    let mixerHumain = new AnimationMixer(model);
    for(const animationName of animationsNames)
    {
        let indexAnimation = model.animations.findIndex((animation) => animation.name === animationName);

        if (indexAnimation !== -1) {
            const action = mixerHumain.clipAction(model.animations[indexAnimation]);
            action.play();
            mixers.push(mixerHumain);
            return;
        }
    }
    console.warn(`Animation not found ${animationsNames} on ${model.name}`)


}