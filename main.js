/**
 * 🌿 EcoMaster Main Application
 */

// State
let currentScreen = 'phone';
let selectedRole = null;
let verifiedUser = null;
let resendTimer = null;

// DOM Elements
const screens = {
    phone: document.getElementById('screen-phone'),
    code: document.getElementById('screen-code'),
    role: document.getElementById('screen-role'),
    profile: document.getElementById('screen-profile'),
    success: document.getElementById('screen-success')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initPhoneScreen();
    initCodeScreen();
    initRoleScreen();
    initProfileScreen();
    initSuccessScreen();

    // Init reCAPTCHA after small delay
    setTimeout(() => {
        if (typeof initRecaptcha === 'function') {
            initRecaptcha();
        }
    }, 500);

    // Show demo notice if not configured
    if (typeof isFirebaseConfigured === 'function' && !isFirebaseConfigured()) {
        setTimeout(() => {
            showToast('Демо-режим: код 123456', 'info');
        }, 1000);
    }
});

// Screen Navigation
function showScreen(screenName) {
    const current = screens[currentScreen];
    const next = screens[screenName];

    if (current) {
        current.classList.remove('active');
        current.classList.add('exit');
    }

    setTimeout(() => {
        if (current) current.classList.remove('exit');
        if (next) next.classList.add('active');
        currentScreen = screenName;
    }, 100);
}

// Phone Screen
function initPhoneScreen() {
    const phoneInput = document.getElementById('phone-input');
    const sendBtn = document.getElementById('btn-send-code');

    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        // Format: 999 123 45 67
        if (value.length > 0) {
            value = value.match(/.{1,3}/g)?.join(' ') || value;
        }
        e.target.value = value.substring(0, 13);

        // Enable button if 10 digits
        const digits = e.target.value.replace(/\D/g, '');
        if (digits.length >= 10) {
            if (!isFirebaseConfigured()) {
                sendBtn.disabled = false;
            }
        } else {
            sendBtn.disabled = true;
        }
    });

    sendBtn.addEventListener('click', async () => {
        const phone = '+7' + phoneInput.value.replace(/\D/g, '');

        sendBtn.classList.add('loading');
        sendBtn.disabled = true;

        try {
            await sendVerificationCode(phone);
            document.getElementById('display-phone').textContent = phone;
            startResendTimer();
            showScreen('code');

            // Focus first code input
            setTimeout(() => {
                document.querySelector('.code-input')?.focus();
            }, 400);

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            sendBtn.classList.remove('loading');
            sendBtn.disabled = false;
        }
    });
}

// Code Screen
function initCodeScreen() {
    const codeInputs = document.querySelectorAll('.code-input');
    const verifyBtn = document.getElementById('btn-verify-code');
    const backBtn = document.getElementById('btn-back-phone');
    const resendBtn = document.getElementById('btn-resend');

    // Code input handling
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value.substring(0, 1);

            if (value && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }

            e.target.classList.toggle('filled', value.length > 0);
            checkCodeComplete();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/\D/g, '').substring(0, 6);

            digits.split('').forEach((digit, i) => {
                if (codeInputs[i]) {
                    codeInputs[i].value = digit;
                    codeInputs[i].classList.add('filled');
                }
            });

            checkCodeComplete();
        });
    });

    function checkCodeComplete() {
        const code = getEnteredCode();
        verifyBtn.disabled = code.length !== 6;
    }

    function getEnteredCode() {
        return Array.from(codeInputs).map(i => i.value).join('');
    }

    verifyBtn.addEventListener('click', async () => {
        const code = getEnteredCode();

        verifyBtn.classList.add('loading');
        verifyBtn.disabled = true;

        try {
            const result = await verifyCode(code);
            verifiedUser = result.user;

            if (result.demo) {
                showToast('Демо: верификация успешна!', 'success');
            }

            showScreen('role');

        } catch (error) {
            showToast(error.message, 'error');
            codeInputs.forEach(i => {
                i.classList.add('error');
                setTimeout(() => i.classList.remove('error'), 500);
            });
        } finally {
            verifyBtn.classList.remove('loading');
            verifyBtn.disabled = false;
        }
    });

    backBtn.addEventListener('click', () => {
        clearCodeInputs();
        stopResendTimer();
        showScreen('phone');
    });

    resendBtn.addEventListener('click', async () => {
        resendBtn.disabled = true;
        try {
            await resendCode();
            startResendTimer();
            showToast('Код отправлен повторно', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
        resendBtn.disabled = false;
    });

    function clearCodeInputs() {
        codeInputs.forEach(i => {
            i.value = '';
            i.classList.remove('filled', 'error');
        });
        verifyBtn.disabled = true;
    }
}

// Resend Timer
function startResendTimer() {
    let seconds = 60;
    const timerEl = document.getElementById('resend-timer');
    const textEl = document.getElementById('resend-text');
    const resendBtn = document.getElementById('btn-resend');

    textEl.parentElement.style.display = 'block';
    resendBtn.style.display = 'none';

    resendTimer = setInterval(() => {
        seconds--;
        timerEl.textContent = seconds;

        if (seconds <= 0) {
            stopResendTimer();
            textEl.parentElement.style.display = 'none';
            resendBtn.style.display = 'block';
        }
    }, 1000);
}

function stopResendTimer() {
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
}

// Role Screen
function initRoleScreen() {
    const roleCards = document.querySelectorAll('.role-card');

    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            roleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedRole = card.dataset.role;

            // Update profile screen
            const masterFields = document.getElementById('master-fields');
            const profileIcon = document.getElementById('profile-icon');

            if (selectedRole === 'master') {
                masterFields.style.display = 'block';
                profileIcon.textContent = '🛠️';
                document.getElementById('profile-subtitle').textContent =
                    'Заполните информацию о себе как мастере';
            } else {
                masterFields.style.display = 'none';
                profileIcon.textContent = '🙋';
                document.getElementById('profile-subtitle').textContent =
                    'Заполните информацию о себе';
            }

            setTimeout(() => showScreen('profile'), 300);
        });
    });
}

// Profile Screen
function initProfileScreen() {
    const form = document.getElementById('profile-form');
    const createBtn = document.getElementById('btn-create-profile');
    const backBtn = document.getElementById('btn-back-role');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('input-firstname').value.trim();
        const lastName = document.getElementById('input-lastname').value.trim();
        const email = document.getElementById('input-email').value.trim();

        if (!firstName || !lastName) {
            showToast('Заполните обязательные поля', 'error');
            return;
        }

        if (selectedRole === 'master') {
            const spec = document.getElementById('input-specialization').value;
            if (!spec) {
                showToast('Выберите специализацию', 'error');
                return;
            }
        }

        createBtn.classList.add('loading');
        createBtn.disabled = true;

        try {
            const userData = {
                uid: verifiedUser?.uid || 'demo-' + Date.now(),
                phone: verifiedUser?.phoneNumber || '+7 XXX XXX XX XX',
                role: selectedRole,
                firstName,
                lastName,
                email,
                specialization: document.getElementById('input-specialization')?.value,
                experience: document.getElementById('input-experience')?.value
            };

            const profile = await createUserProfile(userData);

            // Update success screen
            document.getElementById('user-name').textContent =
                `${profile.firstName} ${profile.lastName}`;
            document.getElementById('user-role').textContent = getRoleName(profile.role);
            document.getElementById('user-avatar').textContent =
                profile.role === 'master' ? '🛠️' : '🙋';

            showScreen('success');

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            createBtn.classList.remove('loading');
            createBtn.disabled = false;
        }
    });

    backBtn.addEventListener('click', () => {
        showScreen('role');
    });
}

// Success Screen
function initSuccessScreen() {
    const continueBtn = document.getElementById('btn-continue');

    continueBtn.addEventListener('click', () => {
        showToast('Добро пожаловать в EcoMaster! 🌿', 'success');
        // Here you would redirect to main app
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
