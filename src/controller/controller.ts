import { player } from "../main";
import { Vector3 } from "three";

export function initController() {
  window.addEventListener('keydown', (event) => {
    console.log(player.position)
    if (event.key === 'w') {
      player.position.z += 2
    }
    if (event.key === 's') {
      player.position.z -= 2
    }
    if (event.key === 'a') {
      player.position.x -= 2
    }
    if (event.key === 'd') {
      player.position.x += 2
    }
  })

}