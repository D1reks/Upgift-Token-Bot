// ==================== КОНФИГУРАЦИЯ ====================

const API_URL = 'https://crash-game-production-6c97.up.railway.app';

// ==================== TELEGRAM SDK ====================

let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    if (typeof tg.requestFullscreen === 'function') {
        try {
            tg.requestFullscreen();
        } catch (e) {}
    }
    
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#000000');
}

// ==================== НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ ====================

let currentScreen = 'app';
let isTransitioning = false;

async function switchScreen(targetId) {
    if (targetId === currentScreen || isTransitioning) return;
    isTransitioning = true;
    
    const currentEl = document.getElementById(currentScreen);
    const targetEl = document.getElementById(targetId);
    
    if (!currentEl || !targetEl) {
        isTransitioning = false;
        return;
    }
    
    // 🔥 Отдаляем камеру (куб уходит вглубь)
    if (typeof window.zoomOutCamera === 'function') {
        await window.zoomOutCamera();
    }
    
    // Плавно скрываем текущий UI
    currentEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    currentEl.style.opacity = '0';
    currentEl.style.transform = 'scale(0.95)';
    
    await new Promise(r => setTimeout(r, 400));
    
    // Меняем экраны
    currentEl.classList.remove('active');
    currentEl.style.display = 'none';
    currentEl.style.transition = '';
    currentEl.style.transform = '';
    
    // Показываем новый UI
    targetEl.classList.add('active');
    targetEl.style.display = 'flex';
    targetEl.style.opacity = '0';
    targetEl.style.transform = 'scale(1.05)';
    targetEl.style.transition = 'none';
    
    targetEl.offsetHeight; // Форсируем рефлоу
    
    targetEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    targetEl.style.opacity = '1';
    targetEl.style.transform = 'scale(1)';
    
    await new Promise(r => setTimeout(r, 500));
    
    // 🔥 Приближаем камеру обратно
    if (typeof window.zoomInCamera === 'function') {
        await window.zoomInCamera();
    }
    
    targetEl.style.transition = '';
    currentScreen = targetId;
    isTransitioning = false;
}

// ==================== ПРИЛОЖЕНИЕ ====================

class PreregisterApp {
    constructor() {
        this.btn = document.getElementById('preregisterBtn');
        this.btnText = document.getElementById('btnText');
        this.btnLoader = document.getElementById('btnLoader');
        this.statusSection = document.getElementById('statusSection');
        this.statusText = document.getElementById('statusText');
        
        this.userId = null;
        this.username = null;
        this.totalDeposit = 0;
        this.isRegistered = false;
        
        this.init();
    }
    
    init() {
        if (!tg?.initData) {
            this.showError('Приложение доступно только в Telegram');
            return;
        }
        
        try {
            const params = new URLSearchParams(tg.initData);
            const user = JSON.parse(params.get('user'));
            this.userId = user.id;
            this.username = user.username || `id${user.id}`;
        } catch (e) {
            this.showError('Ошибка авторизации');
            return;
        }
        
        this.btn.disabled = false;
        this.btn.addEventListener('click', () => this.handlePreregister());
        this.checkStatus();
        
        // 🔥 Навигация по стрелкам
        const scrollDownArrow = document.getElementById('scrollDownArrow');
        const scrollUpArrow = document.getElementById('scrollUpArrow');
        
        if (scrollDownArrow) {
            scrollDownArrow.addEventListener('click', () => {
                switchScreen('infoScreen');
            });
        }
        
        if (scrollUpArrow) {
            scrollUpArrow.addEventListener('click', () => {
                switchScreen('app');
            });
        }
        
        // 🔥 Поддержка свайпов на мобильных
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentScreen === 'app') {
                    switchScreen('infoScreen');
                } else if (diff < 0 && currentScreen === 'infoScreen') {
                    switchScreen('app');
                }
            }
        });
    }
    
    setLoading(loading) {
        if (loading) {
            this.btn.disabled = true;
            this.btnText.textContent = 'Загрузка...';
            this.btnLoader.style.display = 'inline-block';
        } else {
            this.btn.disabled = false;
            this.btnText.textContent = 'Предрегистрация';
            this.btnLoader.style.display = 'none';
        }
    }
    
    showSuccess(text) {
        this.statusSection.style.display = 'flex';
        this.statusText.className = 'status-text success';
        this.statusText.textContent = text;
        this.btn.className = 'preregister-btn success';
        this.btnText.textContent = '✓ Вы зарегистрированы';
        this.btn.disabled = true;
    }
    
    showError(text) {
        this.statusSection.style.display = 'flex';
        this.statusText.className = 'status-text error';
        this.statusText.textContent = text;
    }
    
    async checkStatus() {
        if (!tg?.initData) return;
        
        try {
            const r = await fetch(`${API_URL}/api/preregister/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'telegram-init-data': tg.initData
                },
                body: JSON.stringify({})
            });
            
            if (r.ok) {
                const d = await r.json();
                this.totalDeposit = d.totalDeposit || 0;
                
                if (d.registered) {
                    this.isRegistered = true;
                    this.showSuccess(`Вы успешно зарегистрированы!\nВаш депозит: ${d.totalDeposit.toLocaleString()} ⭐`);
                }
            }
        } catch (e) {}
    }
    
    async handlePreregister() {
        if (!tg?.initData) {
            this.showError('Приложение доступно только в Telegram');
            return;
        }
        
        if (this.isRegistered) return;
        
        this.setLoading(true);
        this.statusSection.style.display = 'none';
        
        try {
            const r = await fetch(`${API_URL}/api/preregister`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'telegram-init-data': tg.initData
                },
                body: JSON.stringify({})
            });
            
            const d = await r.json();
            
            if (d.success) {
                this.isRegistered = true;
                this.showSuccess(`Успешная регистрация!\nВаш депозит: ${d.totalDeposit.toLocaleString()} ⭐`);
            } else {
                this.btn.className = 'preregister-btn error';
                this.btnText.textContent = 'Недостаточно депозита';
                
                if (d.totalDeposit !== undefined) {
                    this.totalDeposit = d.totalDeposit;
                    const remaining = Math.max(0, 1000 - d.totalDeposit);
                    this.showError(
                        `Недостаточно депозита\n` +
                        `Ваш депозит: ${d.totalDeposit.toLocaleString()} ⭐\n` +
                        `Осталось: ${remaining.toLocaleString()} ⭐`
                    );
                } else {
                    this.showError(d.error || 'Ошибка регистрации');
                }
                
                setTimeout(() => {
                    if (!this.isRegistered) {
                        this.btn.className = 'preregister-btn';
                        this.btnText.textContent = 'Предрегистрация';
                        this.statusSection.style.display = 'none';
                    }
                }, 3000);
            }
        } catch (e) {
            this.showError('Ошибка соединения');
            
            setTimeout(() => {
                if (!this.isRegistered) {
                    this.btn.className = 'preregister-btn';
                    this.btnText.textContent = 'Предрегистрация';
                    this.statusSection.style.display = 'none';
                }
            }, 3000);
        }
        
        this.setLoading(false);
    }
}

// ==================== ЗАПУСК ====================

const app = new PreregisterApp();