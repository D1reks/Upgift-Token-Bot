// ==================== КОНФИГУРАЦИЯ ====================

const API_URL = 'https://crash-game-production-6c97.up.railway.app';

// ==================== TELEGRAM SDK ====================

let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Запрашиваем полноэкранный режим
    if (typeof tg.requestFullscreen === 'function') {
        try {
            tg.requestFullscreen();
        } catch (e) {}
    }
    
    // Отключаем сворачивание
    tg.enableClosingConfirmation();
    
    // Фикс для мобильных — убираем верхнюю панель
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#000000');
}

// ==================== ПРИЛОЖЕНИЕ ====================

class PreregisterApp {
    constructor() {
        this.btn = document.getElementById('preregisterBtn');
        this.btnText = document.getElementById('btnText');
        this.btnLoader = document.getElementById('btnLoader');
        this.statusSection = document.getElementById('statusSection');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.requirementText = document.getElementById('requirementText');
        
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
        
        // Включаем кнопку и проверяем статус
        this.btn.disabled = false;
        this.btn.addEventListener('click', () => this.handlePreregister());
        this.checkStatus();
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
        this.statusIcon.className = 'status-icon success';
        this.statusIcon.textContent = '✓';
        this.statusText.className = 'status-text success';
        this.statusText.textContent = text;
        this.btn.className = 'preregister-btn success';
        this.btnText.textContent = '✓ Вы зарегистрированы';
        this.btn.disabled = true;
        this.requirementText.style.display = 'none';
    }
    
    showError(text) {
        this.statusSection.style.display = 'flex';
        this.statusIcon.className = 'status-icon error';
        this.statusIcon.textContent = '✗';
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
                } else {
                    this.requirementText.textContent = 
                        `Минимальный депозит: 1,000 ⭐\nВаш депозит: ${this.totalDeposit.toLocaleString()} ⭐`;
                }
            }
        } catch (e) {
            // Молча игнорируем ошибку при загрузке
        }
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
                    this.requirementText.textContent = 
                        `Минимальный депозит: 1,000 ⭐\nВаш депозит: ${this.totalDeposit.toLocaleString()} ⭐`;
                } else {
                    this.showError(d.error || 'Ошибка регистрации');
                }
                
                // Возвращаем кнопку через 3 секунды
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