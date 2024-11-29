import { CellType } from "./types";
import { Euler, Object3D, SpotLight, Vector3 } from "three";
import { gsap } from "gsap";
import { ambientLight, camera, initialCameraPosition, initialPlayerPosition, initialPlayerRotation, } from "./main";
import { eventListenerMouvement, vibrate } from "./controller/controller";
import { handleButtonClick, handleUpArrow } from "./components/buttonBehavior";
import { board, cube, player } from "./terrain/initBoard";


export class Player extends Object3D {
    public done: boolean = false;
    private readonly onUpdate: () => void;
    private death: boolean = false;
    private animationDone: number = 0;

    constructor() {
        super();
        this.onUpdate = () => {
            if (this.death && camera.parent === player && !this.done) {
                const cameraRealPosition = camera.getWorldPosition(new Vector3());
                board.remove(camera);
                camera.position.set(cameraRealPosition.x, cameraRealPosition.y, cameraRealPosition.z);
                board.add(camera);
                const direction = new Vector3();
                direction.subVectors(camera.position, player.position).normalize();
                gsap.to(camera.position, {
                    duration: 1.5,
                    x: camera.position.x + direction.x,
                    y: camera.position.y + direction.y,
                    z: camera.position.z + direction.z,
                    ease: "none",
                });

                const originalIntensity = ambientLight.intensity;

                gsap.to(ambientLight, {
                    duration: 3,
                    intensity: 0,
                    onComplete: () => {
                        ambientLight.intensity = originalIntensity;
                        reset();
                    }
                });

            } else if (this.position.z === 111 * 2 && !this.death && !this.done) {
                this.done = true;
                board.remove(camera);
                camera.position.set(-6, 3.5, 222);
                board.add(camera);
                camera.lookAt(2.5, 2, 230);

                player.position.set(0, 0, 111 * 2);

                gsap.to(player.position, {
                    duration: 1,
                    z: 226,
                    ease: "none",
                    onComplete: () => {
                        gsap.to(cube.rotation, {
                            duration: 0.7,
                            y: Math.PI / 2,
                            ease: "none",
                        });
                        gsap.to(player.position, {
                            duration: 0.35,
                            y: 0.28,
                            z: 227.6,
                            ease: "none",
                            onComplete: () => {
                                gsap.to(player.position, {
                                    duration: 0.35,
                                    x: 2,
                                    z: 228.2,
                                    ease: "none",
                                    onComplete: () => {
                                        this.animationDone = 1;
                                    }
                                });
                            }
                        });

                    }
                });
            } else if (this.animationDone === 1) {
                this.animationDone = 2;
                const lightIntensity = 1000;
                const spotLight = new SpotLight('red', lightIntensity);
                spotLight.position.set(0, 8.5, 244);
                board.add(spotLight);

                gsap.to(spotLight, {
                    duration: 0.5,
                    intensity: 0,
                    repeat: 5,
                    ease: "bounce.inOut",
                    onComplete: () => {
                        const originalIntensity = ambientLight.intensity;


                        gsap.to(ambientLight, {
                            duration: 3,
                            intensity: 0,
                            onComplete: () => {
                                ambientLight.intensity = originalIntensity;
                                reset();
                            }
                        });
                    }
                });

            }

        };
    }

    setDeath() {
        vibrate(1000);
        this.death = true;
    }

    isDead() {
        return this.death;
    }

    setAlive() {
        this.death = false;
    }

    updateMatrixWorld(force?: boolean): void {

        super.updateMatrixWorld(force);
        this.onUpdate();
    }

}

function reset() {
    window.removeEventListener('keydown', eventListenerMouvement);

    gsap.killTweensOf(cube.position);
    gsap.killTweensOf(cube.rotation);
    gsap.killTweensOf(player.position);
    gsap.killTweensOf(camera.position);

    board.remove(camera);
    board.remove(player);
    board.remove(cube);

    player.setAlive();
    player.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);
    player.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);

    cube.position.set(initialPlayerPosition.x, initialPlayerPosition.y, initialPlayerPosition.z);

    cube.rotation.set(initialPlayerRotation.x, initialPlayerRotation.y, initialPlayerRotation.z);
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    camera.lookAt(player.position);
    player.add(cube);
    player.add(camera);
    board.add(player);

    let scoreElement = document.getElementById("score-value");
    if (scoreElement) {
        scoreElement.innerText = "0";
    }

    const button = document.getElementById("button-wrapper");
    if (button) {
        button.style.display = "block";
        button.addEventListener("click", handleButtonClick);
        window.addEventListener('keydown', handleUpArrow);
    }
}

type CellConfig = {
    scale: number;
    rotation?: Euler;
    randomRotation?: boolean;
    randomPosition?: boolean;
};

export function generateCellConfig() {
    const cellConfig: {
        [key in CellType]: CellConfig | null;
    } = {
        [CellType.ROAD]: {
            scale: 0.25,
            rotation: new Euler(0, Math.PI / 2, 0),
            randomPosition: false,
        },
        [CellType.FLOWERS_1]: {
            scale: 0.2,
            randomRotation: true,
            randomPosition: true,
        },
        [CellType.FLOWERS_2]: {
            scale: 0.2,
            randomRotation: true,
            randomPosition: true,
        },
        [CellType.ROCK_1]: {
            scale: 0.35,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.ROCK_2]: {
            scale: 0.35,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_1]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_2]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.DEADTREE_3]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_1]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_2]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.TREE_3]: {
            scale: 0.5,
            randomRotation: true,
            randomPosition: false,
        },
        [CellType.Empty]: null,
    };
    return cellConfig;
}
