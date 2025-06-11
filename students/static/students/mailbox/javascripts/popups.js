// Modern Popup System for Mailbox
// Replaces all alert() and confirm() with beautiful modern popups

class ModernPopup {
    constructor() {
        this.popupContainer = null;
        this.createPopupContainer();
    }

    createPopupContainer() {
        if (document.getElementById('modern-popup-container')) return;
        
        this.popupContainer = document.createElement('div');
        this.popupContainer.id = 'modern-popup-container';
        this.popupContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
            font-family: 'Poppins', sans-serif;
        `;
        document.body.appendChild(this.popupContainer);
    }

    showAlert(message, type = 'info', duration = 4000) {
        return new Promise((resolve) => {
            const popup = this.createAlertPopup(message, type);
            this.animateIn(popup);
            
            setTimeout(() => {
                this.animateOut(popup, () => {
                    popup.remove();
                    resolve();
                });
            }, duration);
        });
    }

    showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            const popup = this.createConfirmPopup(message, options);
            this.animateIn(popup);
            
            const handleResponse = (result) => {
                this.animateOut(popup, () => {
                    popup.remove();
                    resolve(result);
                });
            };

            popup.querySelector('.confirm-yes').onclick = () => handleResponse(true);
            popup.querySelector('.confirm-no').onclick = () => handleResponse(false);
            popup.querySelector('.popup-overlay').onclick = () => handleResponse(false);
        });
    }

    createAlertPopup(message, type) {
        const colors = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: 'fa-check-circle' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: 'fa-exclamation-circle' },
            warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: 'fa-exclamation-triangle' },
            info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'fa-info-circle' }
        };

        const color = colors[type] || colors.info;
        
        const popup = document.createElement('div');
        popup.className = 'modern-alert-popup';
        popup.innerHTML = `
            <div class="popup-overlay"></div>
            <div class="popup-content">
                <div class="popup-icon">
                    <i class="fa-solid ${color.icon}"></i>
                </div>
                <div class="popup-message">${message}</div>
                <div class="popup-progress"></div>
            </div>
        `;

        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            pointer-events: all;
            z-index: 10001;
        `;

        const content = popup.querySelector('.popup-content');
        content.style.cssText = `
            background: ${color.bg};
            border: 1px solid ${color.border};
            color: ${color.text};
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 15px;
            max-width: 400px;
            min-width: 300px;
            backdrop-filter: blur(10px);
        `;

        popup.querySelector('.popup-icon').style.cssText = `
            font-size: 24px;
            flex-shrink: 0;
        `;

        popup.querySelector('.popup-message').style.cssText = `
            flex: 1;
            font-weight: 500;
            line-height: 1.4;
        `;

        popup.querySelector('.popup-progress').style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: ${color.text};
            border-radius: 0 0 12px 12px;
            animation: progressBar 4s linear;
        `;

        this.popupContainer.appendChild(popup);
        return popup;
    }

    createConfirmPopup(message, options) {
        const {
            title = 'Confirm Action',
            yesText = 'Yes',
            noText = 'Cancel',
            type = 'warning'
        } = options;

        const popup = document.createElement('div');
        popup.className = 'modern-confirm-popup';
        popup.innerHTML = `
            <div class="popup-overlay"></div>
            <div class="popup-content">
                <div class="popup-header">
                    <div class="popup-icon">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                    </div>
                    <h3>${title}</h3>
                </div>
                <div class="popup-message">${message}</div>
                <div class="popup-actions">
                    <button class="confirm-no">${noText}</button>
                    <button class="confirm-yes">${yesText}</button>
                </div>
            </div>
        `;

        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: all;
            backdrop-filter: blur(5px);
        `;

        const content = popup.querySelector('.popup-content');
        content.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 30px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        `;

        popup.querySelector('.popup-header').style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        `;

        popup.querySelector('.popup-icon').style.cssText = `
            width: 50px;
            height: 50px;
            background: #fff3cd;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #856404;
        `;

        popup.querySelector('h3').style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
        `;

        popup.querySelector('.popup-message').style.cssText = `
            margin-bottom: 30px;
            color: #5a6c7d;
            line-height: 1.5;
            font-size: 16px;
        `;

        popup.querySelector('.popup-actions').style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
        `;

        const buttons = popup.querySelectorAll('button');
        buttons.forEach((btn, index) => {
            btn.style.cssText = `
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 100px;
                ${index === 0 ? 
                    'background: #e9ecef; color: #6c757d;' : 
                    'background: #007bff; color: white;'
                }
            `;
        });

        this.popupContainer.appendChild(popup);
        return popup;
    }

    animateIn(popup) {
        if (popup.classList.contains('modern-alert-popup')) {
            popup.style.transform = 'translateX(100%)';
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                popup.style.transform = 'translateX(0)';
                popup.style.opacity = '1';
            }, 10);
        } else {
            popup.style.opacity = '0';
            popup.querySelector('.popup-content').style.transform = 'scale(0.8) translateY(-20px)';
            setTimeout(() => {
                popup.style.transition = 'opacity 0.3s ease';
                popup.querySelector('.popup-content').style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                popup.style.opacity = '1';
                popup.querySelector('.popup-content').style.transform = 'scale(1) translateY(0)';
            }, 10);
        }
    }

    animateOut(popup, callback) {
        if (popup.classList.contains('modern-alert-popup')) {
            popup.style.transform = 'translateX(100%)';
            popup.style.opacity = '0';
        } else {
            popup.style.opacity = '0';
            popup.querySelector('.popup-content').style.transform = 'scale(0.8) translateY(-20px)';
        }
        setTimeout(callback, 300);
    }
}

// Global popup instance
const modernPopup = new ModernPopup();

// Global functions to replace alert() and confirm()
window.showAlert = (message, type = 'info', duration = 4000) => {
    return modernPopup.showAlert(message, type, duration);
};

window.showConfirm = (message, options = {}) => {
    return modernPopup.showConfirm(message, options);
};

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
    }
    
    .modern-alert-popup .popup-content:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    }
    
    .modern-confirm-popup button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);
