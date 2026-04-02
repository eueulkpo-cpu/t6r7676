// engine.js - Lógica de Movimento e Filtro de Headshot
export class SensiEngine {
    constructor() {
        this.smoothing = 0.35; // Quanto menor, mais suave (ajuda no tremor do Android)
        this.prevX = 0;
        this.prevY = 0;
        this.thresholdMax = 65; // Trava de X pixels para puxadas bruscas
    }

    // Calcula a Bounding Box da cabeça baseada no corpo
    calculateHeadBox(entity) {
        return {
            x: entity.x + (entity.width * 0.3), // Centraliza 40% da largura
            y: entity.y,                       // Topo do boneco
            w: entity.width * 0.4,
            h: entity.height * 0.2             // Apenas os 20% superiores
        };
    }

    // Aplica Curva de Bézier e Freio Magnético
    applyPhysics(deltaX, deltaY, isNearHead) {
        // Se estiver perto da cabeça, reduz a sensibilidade (Efeito Magnético)
        const friction = isNearHead ? 0.4 : 1.0;

        // Limita a velocidade máxima (Trava de Pixels)
        const speed = Math.sqrt(deltaX2 + deltaY2);
        if (speed > this.thresholdMax) {
            const ratio = this.thresholdMax / speed;
            deltaX = ratio;
            deltaY= ratio;
        }

        // Suavização (Low-pass Filter) para tirar o tremor do Android
        const outX = this.prevX + (deltaX * friction - this.prevX) * this.smoothing;
        const outY = this.prevY + (deltaY * friction - this.prevY) * this.smoothing;

        this.prevX = outX;
        this.prevY = outY;

        return { x: outX, y: outY };
    }
}