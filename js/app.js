// ==================== КОНФИГУРАЦИЯ ====================

const API_URL = 'https://crash-game-production-6c97.up.railway.app';

// ==================== TELEGRAM SDK ====================

let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
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
        this.isRegistered = false;
        
        this.init();
    }
    
    init() {
        if (!tg?.initData) {
            this.showStatus('Приложение доступно только в Telegram');
            return;
        }
        
        try {
            const params = new URLSearchParams(tg.initData);
            const user = JSON.parse(params.get('user'));
            this.userId = user.id;
        } catch (e) {
            this.showStatus('Ошибка авторизации');
            return;
        }
        
        // 🔥 Сначала включаем кнопку, потом проверяем статус
        this.btn.disabled = false;
        this.btn.addEventListener('click', () => this.handlePreregister());
        
        // Проверяем статус асинхронно
        this.checkStatus();
    }
    
    setLoading(loading) {
        if (loading) {
            this.btn.disabled = true;
            this.btnText.textContent = 'Загрузка...';
            this.btnLoader.style.display = 'inline-block';
        } else if (!this.isRegistered) {
            // 🔥 Возвращаем кнопку только если не зарегистрирован
            this.btn.disabled = false;
            this.btnText.textContent = 'Предрегистрация';
            this.btnLoader.style.display = 'none';
        }
    }
    
    setRegistered() {
        this.isRegistered = true;
        this.btn.className = 'preregister-btn registered';
        this.btnText.textContent = 'Предрегистрация';
        this.btn.disabled = true;
        this.btnLoader.style.display = 'none';
        this.statusSection.style.display = 'none';
    }
    
    showStatus(text) {
        if (this.statusSection && this.statusText) {
            this.statusSection.style.display = 'block';
            this.statusText.textContent = text;
        }
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
                
                if (d.registered) {
                    this.setRegistered();
                }
            } else {
                // Если ошибка — просто оставляем кнопку активной
                console.error('Status check failed:', r.status);
            }
        } catch (e) {
            // Ошибка сети — кнопка остаётся активной
            console.error('Status check error:', e);
        }
    }
    
    async handlePreregister() {
        if (!tg?.initData) {
            this.showStatus('Приложение доступно только в Telegram');
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
                this.setRegistered();
            } else {
                this.showStatus('Вы не соответствуете критериям для предрегистрации');
                this.setLoading(false);
            }
        } catch (e) {
            this.showStatus('Ошибка соединения');
            this.setLoading(false);
        }
    }
}

// ==================== ЗАПУСК ====================

// 🔥 Дожидаемся загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new PreregisterApp();
});