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
    let button = document.getElementById("play-button");
    let count = 0;
    while (!button && count < 1000) {
        button = document.getElementById("play-button");
        count++;
    }
        if (button) {
            button.addEventListener("click", handleButtonClick);
            window.addEventListener('keydown', handleUpArrow);
        } else {
            console.error("Button not found");
        }
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
