// enginebundle.js - Manipulação de Eventos
import { SensitivityEngine } from './engine.js';

const engine = new SensitivityEngine({ sensitivity: 1.5, maxDelta: 150 });
let lastEventTime = performance.now();

const handleTouch = (e) => {
    // Previne comportamentos padrão do browser para reduzir latência
    if (e.cancelable) e.preventDefault();

    // Chrome nativo: Acessa eventos entre frames (reduz ruído)
    const touches = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    
    for (let touch of touches) {
        const now = performance.now();
        const deltaTime = now - lastEventTime;
        
        const deltaX = touch.clientX - engine.lastX;
        const deltaY = touch.clientY - engine.lastY;
        const speed = Math.sqrt(deltaX**2 + deltaY**2) / (deltaTime || 1);

        const movement = engine.calculateMovement(deltaX, deltaY, speed);

        // Atualiza referências
        engine.lastX = touch.clientX;
        engine.lastY = touch.clientY;
        lastEventTime = now;

        // Aqui você enviaria o movimento para o seu jogo/ponteiro
        applyMovementToUI(movement);
    }
};

document.addEventListener('touchmove', handleTouch, { passive: false, capture: true });