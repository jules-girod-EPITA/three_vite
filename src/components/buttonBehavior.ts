// src/buttonBehavior.ts

// Function to handle button click




import { initController } from "../controller/controller";

function handleButtonClick() {
    // ===== 🎮 EVENT LISTENERS =====
    initController();

    const button = document.getElementById("button-wrapper");
    if (button) {
        button.style.display = "none";
    }

}

export function initButtonBehavior() {
    document.addEventListener("DOMContentLoaded", () => {
        const button = document.getElementById("play-button");
        if (button) {
            button.addEventListener("click", handleButtonClick);
        }
    });
}

