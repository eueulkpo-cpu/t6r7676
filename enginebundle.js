// enginebundle.js - Interface de Toque e Overlay
import { SensiEngine } from './engine.js';

const engine = new SensiEngine();
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d', { desynchronized: true }); // Baixa latência Chrome

let currentTouch = { x: 0, y: 0 };

// Escuta o toque ignorando o jitter nativo do Android
document.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Impede o scroll e lag do browser

    const touch = e.touches[0];
    const dx = touch.clientX - currentTouch.x;
    const dy = touch.clientY - currentTouch.y;

    // Lógica de Renderização (Simulando detecção de inimigo)
    // Aqui você integraria com sua detecção (ex: entity do modelo de IA)
    render(dx, dy);

    currentTouch.x = touch.clientX;
    currentTouch.y = touch.clientY;
}, { passive: false });

function render(dx, dy) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Pega os dados do boneco (exemplo hipotético)
    const enemyBody = { x: 100, y: 150, width: 50, height: 100 };

    // 2. Transforma em HeadBox (Remove o corpo)
    const head = engine.calculateHeadBox(enemyBody);

    // 3. Processa o movimento com a Engine
    const isNear = checkProximity(currentTouch, head);
    const move = engine.applyPhysics(dx, dy, isNear);

    // 4. Desenha APENAS o marcador da cabeça (Mini-Box Estável)
    ctx.strokeStyle = '#00FF41'; // Verde Matrix
    ctx.lineWidth = 2;
    ctx.strokeRect(head.x, head.y, head.w, head.h);

    // Ponto central de precisão
    ctx.fillStyle = 'red';
    ctx.fillRect(head.x + (head.w/2) - 1, head.y + (head.h/2) - 1, 3, 3);
}

function checkProximity(touch, target) {
    return touch.x > target.x && touch.x < target.x + target.w &&
           touch.y > target.y && touch.y < target.y + target.h;
}