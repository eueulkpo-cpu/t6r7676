// engine.js - Core Sensitivity Logic
export class SensitivityEngine {
    constructor(config) {
        this.sensitivity = config.sensitivity || 1.0;
        this.maxDelta = config.maxDelta || 100; // Trava de X pixels
        this.deadzone = 0.1;
        this.lastX = 0;
        this.lastY = 0;
        
        // Coeficientes para Curva de Bezier (Suavização)
        // P0=(0,0), P1=(0.2, 0.1), P2=(0.5, 1.0), P3=(1,1)
        this.bezierCurve = (t) => {
            const cx = 3 * 0.2;
            const bx = 3 * (0.5 - 0.2) - cx;
            const ax = 1 - cx - bx;
            return (ax * Math.pow(t, 3)) + (bx * Math.pow(t, 2)) + (cx * t);
        };
    }

    // Filtro Passa-Baixa para reduzir ruído do Android
    lowPassFilter(current, previous, smooth = 0.4) {
        return previous + smooth * (current - previous);
    }

    calculateMovement(deltaX, deltaY, speed) {
        // 1. Normalização e Deadzone
        if (Math.abs(deltaX) < this.deadzone) deltaX = 0;
        
        // 2. Aplicar Curva de Sensibilidade (Bezier)
        // Se mover devagar (speed baixo), t é pequeno, a saída é menor (desacelera)
        const t = Math.min(speed / 50, 1);
        const multiplier = this.bezierCurve(t) * this.sensitivity;

        let finalX = deltaX * multiplier;
        let finalY = deltaY * multiplier;

        // 3. Trava de X pixels (Anti-puxada brusca)
        const magnitude = Math.sqrt(finalX ** 2 + finalY ** 2);
        if (magnitude > this.maxDelta) {
            const ratio = this.maxDelta / magnitude;
            finalX *= ratio;
            finalY *= ratio;
        }

        return { x: finalX, y: finalY };
    }
}