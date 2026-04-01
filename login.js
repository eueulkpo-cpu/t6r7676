// Gringozin FF Login Module
// Separate login screen logic - extracted for modularity

class LoginManager {
    constructor(container) {
        this.container = container;
        this.renderLoginCard();
    }

    renderLoginCard() {
        this.container.innerHTML = `
            <div id="login-card" class="card">
                <h2>Digite sua Key</h2>
                <input type="text" id="key-input" placeholder="Key">
                <button class="btn-entrar" id="btn-entrar">Entrar</button>
                <div class="footer-links">
                    <span style="color:var(--accent-pink)">GRINGOZIN FF</span>
                    <span style="color:var(--text-gray)">Admin</span>
                </div>
            </div>
        `;
        this.attachEvents();
    }

    attachEvents() {
        const keyInput = document.getElementById('key-input');
        const btnEntrar = document.getElementById('btn-entrar');
        
        if (keyInput) {
            keyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.validateKey(keyInput.value);
                }
            });
        }
        
        if (btnEntrar) {
            btnEntrar.addEventListener('click', () => {
                this.validateKey(keyInput ? keyInput.value : '');
            });
        }
    }

    validateKey(key) {
        if (key.trim() !== '123456') {
            alert('Key inválida! Use: 123456');
            return false;
        }
        showFunctions();
        return true;
    }
}

// Global function for button onclick compatibility
function showFunctions() {
    console.log('showFunctions called');
    const loginCard = document.getElementById('login-card');
    const functionsCard = document.getElementById('functions-card');
    
    console.log('loginCard:', loginCard);
    console.log('functionsCard:', functionsCard);
    
    if (!loginCard || !functionsCard) {
        console.error('Cards not found. Ensure functions-card exists.');
        return;
    }
    
    loginCard.style.opacity = '0';
    loginCard.style.display = 'none';
    functionsCard.classList.remove('hidden');
    functionsCard.style.opacity = '1';
    functionsCard.style.display = 'block';
    
    // Small delay for smooth transition
    setTimeout(() => {
        // Init engine if available
        if (typeof initEngine === 'function') {
            window.engine = initEngine();
            console.log('Engine initialized');
        }
        if (typeof registerSW === 'function') registerSW();
        if (typeof wireToggles === 'function') wireToggles();
    }, 300);
    
    console.log('Transition completed');
}

// PWA registration
async function registerSW() {
    if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
    }
}

function wireToggles() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes[0].addEventListener('change', (e) => window.engine?.toggleFeature('recoil', e.target.checked));
    checkboxes[1].addEventListener('change', (e) => window.engine?.toggleFeature('sensitivity', e.target.checked));
    checkboxes[2].addEventListener('change', (e) => window.engine?.toggleFeature('touchOpt', e.target.checked));
    checkboxes[3].addEventListener('change', (e) => window.engine?.toggleFeature('stability', e.target.checked));
}

// Init when DOM ready
(function() {
    // Wait for DOM and engine.js to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLogin);
    } else {
        initLogin();
    }
    
    function initLogin() {
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            new LoginManager(appContainer);
        } else {
            console.error('app-container not found');
        }
    }
})();

console.log('Gringozin FF Login module ready');

console.log('Gringozin FF Login module loaded');
