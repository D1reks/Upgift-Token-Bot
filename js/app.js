// ==================== КОНФИГУРАЦИЯ ====================

const API_URL = 'https://crash-game-production-6c97.up.railway.app';

// ==================== TELEGRAM SDK ====================

let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// ==================== УТИЛИТЫ ====================

function sendLog(message, data) {
    fetch(`${API_URL}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, data })
    }).catch(() => {});
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
        
        sendLog('PREREGISTER APP STARTED', { 
            userId: this.userId, 
            username: this.username 
        });
        
        this.btn.disabled = false;
        this.btn.addEventListener('click', () => this.handlePreregister());
        
        // Автоматически проверяем статус при загрузке
        this.checkStatus();
    }
    
    setLoading(loading) {
        if (loading) {
            this.btn.disabled = true;
            this.btnText.style.display = 'none';
            this.btnLoader.style.display = 'block';
        } else {
            this.btn.disabled = false;
            this.btnText.style.display = 'block';
            this.btnLoader.style.display = 'none';
        }
    }
    
    showStatus(type, text) {
        this.statusSection.style.display = 'flex';
        this.statusIcon.className = 'status-icon ' + type;
        this.statusIcon.textContent = type === 'success' ? '✓' : '✗';
        this.statusText.className = 'status-text ' + type;
        this.statusText.textContent = text;
    }
    
    showError(text) {
        this.statusSection.style.display = 'flex';
        this.statusIcon.className = 'status-icon error';
        this.statusIcon.textContent = '✗';
        this.statusText.className = 'status-text error';
        this.statusText.textContent = text;
        this.btn.className = 'preregister-btn error';
        this.btnText.textContent = 'Ошибка';
    }
    
    async checkStatus() {
        if (!tg?.initData) return;
        
        try {
            const r = await fetch(`${API_URL}/api/preregister/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'telegram-init-data': tg.initData
                }
            });
            
            if (r.ok) {
                const d = await r.json();
                this.totalDeposit = d.totalDeposit || 0;
                
                if (d.registered) {
                    this.isRegistered = true;
                    this.btn.className = 'preregister-btn success';
                    this.btnText.textContent = '✓ Вы зарегистрированы';
                    this.btn.disabled = true;
                    this.showStatus('success', 
                        `Вы успешно зарегистрированы!\nВаш депозит: ${d.totalDeposit.toLocaleString()} ⭐`
                    );
                    this.requirementText.style.display = 'none';
                } else {
                    this.requirementText.textContent = 
                        `Минимальный депозит: 1,000 ⭐\nВаш депозит: ${this.totalDeposit.toLocaleString()} ⭐`;
                }
            }
        } catch (e) {
            sendLog('PREREGISTER STATUS ERROR', { error: e.message });
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
        
        sendLog('PREREGISTER CLICK', { 
            userId: this.userId, 
            username: this.username 
        });
        
        try {
            const r = await fetch(`${API_URL}/api/preregister`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'telegram-init-data': tg.initData
                }
            });
            
            const d = await r.json();
            
            if (d.success) {
                this.isRegistered = true;
                this.btn.className = 'preregister-btn success';
                this.btnText.textContent = '✓ Вы зарегистрированы';
                this.btn.disabled = true;
                this.showStatus('success', 
                    `Успешная регистрация!\nВаш депозит: ${d.totalDeposit.toLocaleString()} ⭐`
                );
                this.requirementText.style.display = 'none';
                
                sendLog('PREREGISTER SUCCESS', { 
                    userId: this.userId,
                    totalDeposit: d.totalDeposit 
                });
            } else {
                this.btn.className = 'preregister-btn error';
                this.btnText.textContent = 'Недостаточно депозита';
                
                if (d.totalDeposit !== undefined) {
                    this.totalDeposit = d.totalDeposit;
                    const remaining = Math.max(0, 1000 - d.totalDeposit);
                    this.showError(
                        `Недостаточно депозита для регистрации\n` +
                        `Ваш депозит: ${d.totalDeposit.toLocaleString()} ⭐\n` +
                        `Осталось: ${remaining.toLocaleString()} ⭐`
                    );
                    this.requirementText.textContent = 
                        `Минимальный депозит: 1,000 ⭐\nВаш депозит: ${d.totalDeposit.toLocaleString()} ⭐`;
                } else {
                    this.showError(d.error || 'Ошибка регистрации');
                }
                
                sendLog('PREREGISTER FAILED', { 
                    userId: this.userId,
                    totalDeposit: d.totalDeposit,
                    error: d.error 
                });
                
                // Возвращаем кнопку через 2 секунды
                setTimeout(() => {
                    this.btn.className = 'preregister-btn';
                    this.btnText.textContent = 'Предрегистрация';
                }, 2000);
            }
        } catch (e) {
            this.showError('Ошибка соединения');
            sendLog('PREREGISTER ERROR', { error: e.message });
            
            setTimeout(() => {
                this.btn.className = 'preregister-btn';
                this.btnText.textContent = 'Предрегистрация';
            }, 2000);
        }
        
        this.setLoading(false);
    }
}

// ==================== ЗАПУСК ====================

const app = new PreregisterApp();