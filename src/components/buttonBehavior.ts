// src/buttonBehavior.ts

// Function to handle button click




import { initController } from "../controller/controller";

export function handleButtonClick() {
    // ===== 🎮 EVENT LISTENERS =====
    initController();



    const button = document.getElementById("button-wrapper");
    if (button) {
        window.removeEventListener('keydown', handleUpArrow);
        button.removeEventListener('click', handleButtonClick);
        button.style.display = "none";
    }

}

export function initButtonBehavior() {
    document.addEventListener("DOMContentLoaded", () => {
        const button = document.getElementById("play-button");
        if (button) {
            button.addEventListener("click", handleButtonClick);
            window.addEventListener('keydown', handleUpArrow);
        }
    });
}

export function handleUpArrow(event : KeyboardEvent) {
    if(event.key === "ArrowUp")
    {
        handleButtonClick();
        setTimeout(() => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            window.dispatchEvent(event);
        }, 100);
    }
}
