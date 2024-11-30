import { Vector3 } from "three";
import { gsap } from "gsap";
import { board, player } from "../terrain/initBoard";
import { EnumDirection } from "../types";
import { controller } from "../main";


export const moveAr = (direction: EnumDirection) => {
    if(!player.isControllable())
        return;

    const translation = new Vector3();

    if (!player.userData.lastMove)
        player.userData.lastMove = new Date().getTime() - 200;

    console.log(player.isDead(), new Date().getTime(), player.userData.lastMove + 200)

    if(board.position.x >= 16 && direction === EnumDirection.LEFT)
    {
        vibrate(200);
        return;
    }
    if(board.position.x <= -16 && direction === EnumDirection.RIGHT)
    {
        vibrate(200);
        return;
    }

    if (player.isDead())
    {
        console.log("Trying to revive")
        player.tryRevive();
        vibrate(200);
        return;
    }


    if (player.userData.lastMove + 200 > new Date().getTime())
    {
        // vibrate(200);
        return;
    }

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

export function vibrate(duration: number)
{
    const hapticActuator = controller.gamepad?.hapticActuators[0];
    if (hapticActuator) {
        console.log("Pulse");
        hapticActuator.pulse(0.5, duration);
    }

    if (navigator.vibrate) {
        // Trigger the vibration
        navigator.vibrate(duration);
    }
}