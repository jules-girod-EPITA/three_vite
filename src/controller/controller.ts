import {player} from "../main";
import {Vector3} from "three";
import {gsap} from "gsap";


export function initController() {
  window.addEventListener('keydown', (event) => {

    if(player.position.y != 0)
      return;

    const jumpHeight = 2; // Hauteur du saut
    const moveDistance = 2; // Distance à parcourir pendant le saut
    const duration = 0.25; // Durée totale de l'animation de saut

    // Copie la position initiale du player
    let initialPosition = new Vector3().copy(player.position);

    // Calcule la nouvelle position cible en fonction de la touche pressée
    let targetPosition = new Vector3().copy(initialPosition);

    if (event.key === 'w') {
      targetPosition.z += moveDistance; // Avance
    }
    if (event.key === 's') {
      targetPosition.z -= moveDistance; // Recule
    }
    if (event.key === 'a') {
      targetPosition.x += moveDistance; // Déplace à gauche
    }
    if (event.key === 'd') {
      targetPosition.x -= moveDistance; // Déplace à droite
    }

    // Animation de saut : monter puis se déplacer vers la position cible
    if (initialPosition.equals(targetPosition))
      return;

    gsap.to(player.position, {
      duration: duration,
      y: jumpHeight, // Monter en hauteur
      onComplete: () => {
        // Descendre et se déplacer simultanément vers la position cible
        gsap.to(player.position, {
          duration: duration,
          y: 0, // Redescendre à la position initiale
          x: targetPosition.x, // Déplacement horizontal
          z: targetPosition.z, // Déplacement vers l'avant ou l'arrière
        });
      }
    });
  });
}