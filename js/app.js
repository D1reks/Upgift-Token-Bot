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
        this.statusSection.style.display = 'block';
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
                
                if (d.registered) {
                    this.setRegistered();
                }
            }
        } catch (e) {
            // Молча игнорируем
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
                this.btn.disabled = false;
                this.btnText.textContent = 'Предрегистрация';
                this.btnLoader.style.display = 'none';
            }
        } catch (e) {
            this.showStatus('Ошибка соединения');
            this.btn.disabled = false;
            this.btnText.textContent = 'Предрегистрация';
            this.btnLoader.style.display = 'none';
        }
    }
}

// ==================== ЗАПУСК ====================

const app = new PreregisterApp();