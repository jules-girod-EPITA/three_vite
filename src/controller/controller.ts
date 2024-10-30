import { cube, player } from "../main";
import { Vector3 } from "three";
import { gsap } from "gsap";


export function initController() {
    window.addEventListener('keydown', (event) => {

        console.log(`Key pressed: ${event.key}`, player.position);

        if (player.position.y != 0)
            return;

        const jumpHeight = 1.0; // Hauteur du saut
        const moveDistance = 2; // Distance à parcourir pendant le saut
        const duration = 0.10; // Durée totale de l'animation de saut
        const rotationDuration = 0.5; // Durée de l'animation de rotation

        // Copie la position initiale du player
        let initialPosition = new Vector3().copy(player.position);

        // Calcule la nouvelle position cible en fonction de la touche pressée
        let targetPosition = new Vector3().copy(initialPosition);
        let rotationTarget = 0;


        if (event.key === 'w') {
            targetPosition.z += moveDistance; // Avance
            rotationTarget = 0; // Regarde vers l'avant
        }
        if (event.key === 's') {
            targetPosition.z -= moveDistance; // Recule
            rotationTarget = Math.PI; // Regarde vers l'arrière
        }
        if (event.key === 'a') {
            targetPosition.x += moveDistance; // Déplace à gauche
            rotationTarget = Math.PI / 2; // Regarde vers la gauche
        }
        if (event.key === 'd') {
            targetPosition.x -= moveDistance; // Déplace à droite
            rotationTarget = -Math.PI / 2; // Regarde vers la droite
        }

        // Animation de saut : monter puis se déplacer vers la position cible
        if (initialPosition.equals(targetPosition))
            return;

        gsap.to(cube.rotation, {
            duration: rotationDuration,
            y: rotationTarget
        });


        gsap.to(player.position, {
            duration: duration,
            y: jumpHeight, // Monter en hauteur
            onComplete: () => {
                // Descendre et se déplacer simultanément vers la position cible
                const score = Math.max(0, Math.floor(targetPosition.z / 2));
                const currentScore = parseInt(document.getElementById("score-value").innerText);
                if (isNaN(currentScore) || score > currentScore) {
                    document.getElementById("score-value").innerText = `${score}`;

                    if (score > parseInt(localStorage.getItem("highscore") || "0"))
                        localStorage.setItem("highscore", String(score));
                }
                gsap.to(player.position, {
                    duration: duration / 1.5,
                    y: 0,
                    x: targetPosition.x,
                    z: targetPosition.z,
                });
            }
        });
    });
}