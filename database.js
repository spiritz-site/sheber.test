/**
 * 💾 Database Module
 */

let currentUserData = null;

async function createUserProfile(userData) {
    const { uid, phone, role, firstName, lastName, email, specialization, experience } = userData;

    const profileData = {
        uid, phone, role, firstName, lastName,
        email: email || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (role === 'master') {
        profileData.specialization = specialization || null;
        profileData.experience = experience || null;
        profileData.rating = 0;
        profileData.reviewsCount = 0;
    }

    if (!isFirebaseConfigured()) {
        await new Promise(r => setTimeout(r, 1000));
        localStorage.setItem('ecomaster_user', JSON.stringify(profileData));
        currentUserData = profileData;
        return profileData;
    }

    await db.collection('users').doc(uid).set(profileData);
    currentUserData = profileData;
    return profileData;
}

async function getUserProfile(uid) {
    if (!isFirebaseConfigured()) {
        const saved = localStorage.getItem('ecomaster_user');
        return saved ? JSON.parse(saved) : null;
    }
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
}

function getCurrentUserData() {
    return currentUserData;
}

function getSpecializationName(code) {
    const map = {
        'plumber': 'Сантехник',
        'electrician': 'Электрик',
        'carpenter': 'Плотник',
        'painter': 'Маляр',
        'cleaner': 'Клининг',
        'handyman': 'Мастер на все руки',
        'other': 'Другое'
    };
    return map[code] || code;
}

function getRoleName(role) {
    return role === 'master' ? 'Мастер' : 'Клиент';
}
