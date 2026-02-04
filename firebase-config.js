/**
 * 🌿 Firebase Configuration
 * 
 * ⚠️ ВАЖНО: Замените значения ниже на ваши данные из Firebase Console
 * 
 * Как получить эти данные:
 * 1. Перейдите на https://console.firebase.google.com/
 * 2. Создайте новый проект или выберите существующий
 * 3. Добавьте веб-приложение (значок </>)
 * 4. Скопируйте значения из firebaseConfig
 * 5. Включите Phone Authentication:
 *    - Authentication → Sign-in method → Phone → Enable
 * 6. Добавьте домен в Authorized domains:
 *    - Authentication → Settings → Authorized domains
 */

const firebaseConfig = {
    apiKey: "AIzaSyDYtNvU8HnU9B5jQuJu3IiQgrmaSDCy_EU",
    authDomain: "sheber-4b9de.firebaseapp.com",
    projectId: "sheber-4b9de",
    storageBucket: "sheber-4b9de.firebasestorage.app",
    messagingSenderId: "217494542041",
    appId: "1:217494542041:web:a326f07950e227494510c8"
};

// Инициализация Firebase
let app;
let auth;
let db;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    // Установка языка для SMS
    auth.languageCode = 'ru';

    console.log('✅ Firebase инициализирован успешно');
} catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
}

// Проверка конфигурации
function isFirebaseConfigured() {
    // Для тестирования установите false - будет демо-режим с кодом 123456
    const TEST_MODE = true; // Изменить на false для реальных SMS
    
    if (TEST_MODE) {
        return false; // Демо-режим
    }
    return firebaseConfig.apiKey !== "ВАШ_API_KEY";
}
