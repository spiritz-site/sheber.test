/**
 * 🔐 SMS Authentication Module (Twilio)
 */

const API_URL = 'https://axiologically-unorbed-andrea.ngrok-free.dev/api';

let currentPhoneNumber = '';

/**
 * Инициализация (для совместимости)
 */
function initRecaptcha() {
    // Twilio не требует reCAPTCHA
    document.getElementById('btn-send-code').disabled = false;
    console.log('✅ Twilio режим - reCAPTCHA не нужна');
}

/**
 * Форматирование номера телефона
 */
function formatPhoneNumber(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8')) {
        digits = '7' + digits.substring(1);
    }
    if (!digits.startsWith('7')) {
        digits = '7' + digits;
    }
    return '+' + digits;
}

/**
 * Отправка SMS кода
 */
async function sendVerificationCode(phoneNumber) {
    currentPhoneNumber = phoneNumber;
    const formattedPhone = formatPhoneNumber(phoneNumber);

    console.log('📱 Отправка SMS на:', formattedPhone);

    const response = await fetch(`${API_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки SMS');
    }

    if (data.demo && data.testCode) {
        console.log('🔑 Тестовый код:', data.testCode);
        showToast(`Демо-режим. Код: ${data.testCode}`, 'info');
    }

    console.log('✅ SMS отправлен');
    return { success: true, demo: data.demo };
}

/**
 * Подтверждение SMS кода
 */
async function verifyCode(code) {
    const formattedPhone = formatPhoneNumber(currentPhoneNumber);

    console.log('🔐 Проверка кода:', code);

    const response = await fetch(`${API_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Ошибка проверки кода');
    }

    console.log('✅ Верификация успешна');
    return {
        success: true,
        user: data.user
    };
}

/**
 * Повторная отправка кода
 */
async function resendCode() {
    return sendVerificationCode(currentPhoneNumber);
}

/**
 * Проверка конфигурации (для совместимости)
 */
function isFirebaseConfigured() {
    return true; // Используем Twilio
}
