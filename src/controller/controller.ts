import { Vector3 } from "three";
import { gsap } from "gsap";
import { board, cube, player } from "../terrain/initBoard";
import { EnumDirection } from "../types";


export function initController() {
    window.addEventListener('keydown', eventListenerMouvement);
}


export const moveAr = (direction: EnumDirection) => {

    const translation = new Vector3();

    if (!player.userData.lastMove)
        player.userData.lastMove = new Date().getTime() - 200;

    console.log(player.isDead(), new Date().getTime(), player.userData.lastMove + 200)

    if (player.isDead())
    {
        console.log("Trying to revive")
        player.tryRevive();
        return;
    }

    if (player.userData.lastMove + 200 > new Date().getTime())
        return;

    switch (direction) {
        case EnumDirection.FORWARD:
            translation.z += 2;
            break;
        case EnumDirection.BACK:
            translation.z -= 2;
            break;
        case EnumDirection.LEFT:
            translation.x += 2;
            break;
        case EnumDirection.RIGHT:
            translation.x -= 2;
            break;
        default:
            break;
    }

    console.log(`Moving to ${direction}`)


    gsap.to(board.position, {
        duration: 0.2,
        x: board.position.x + translation.x,
        y: board.position.y + translation.y,
        z: board.position.z + translation.z,
        onStart: () => {
            player.userData.lastMove = new Date().getTime();
        }
    });

}

export const eventListenerMouvement = (event : KeyboardEvent) => {

    console.log(`Key pressed: ${event.key}`, cube.position);

    if (cube.position.y != 0 || player.position.y != 0 || player.isDead())
        return;

    const jumpHeight = 1.0;
    const moveDistance = 2;
    const duration = 0.10;
    const rotationDuration = 0.5;

    let initialPosition = new Vector3().copy(player.position);

    let targetPosition = new Vector3().copy(initialPosition);
    let rotationTarget = 0;


    if (event.key === 'ArrowUp') {
        targetPosition.z += moveDistance;
        rotationTarget = 0;
    }
    if (event.key === 'ArrowDown') {
        targetPosition.z -= moveDistance;
        rotationTarget = Math.PI;
    }
    if (event.key === 'ArrowLeft' && player.position.x < 10 ) {
        targetPosition.x += moveDistance;
        rotationTarget = Math.PI / 2;
    }
    if (event.key === 'ArrowRight' && player.position.x > -10) {
        targetPosition.x -= moveDistance;
        rotationTarget = -Math.PI / 2;
    }

    if (initialPosition.equals(targetPosition))
        return;

    gsap.to(cube.rotation, {
        duration: rotationDuration,
        y: rotationTarget
    });


    gsap.to(cube.position, {
        duration: duration,
        y: jumpHeight,
        onComplete: () => {
            const score = Math.max(0, Math.floor(targetPosition.z / 2));
            const currentScore = parseInt(document.getElementById("score-value").innerText);
            if (isNaN(currentScore) || score > currentScore) {
                document.getElementById("score-value").innerText = `${score}`;

                if (score > parseInt(localStorage.getItem("highscore") || "0"))
                    localStorage.setItem("highscore", String(score));
            }

            gsap.to(player.position, {
                duration: duration / 1.5,
                x: targetPosition.x,
                z: targetPosition.z,
                ease: "none",
            });

            gsap.to(cube.position, {
                duration: duration / 1.5,
                y: 0,
                ease: "none",
            });
        }
    });


};