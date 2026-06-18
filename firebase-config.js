// ============================================
// FIREBASE-CONFIG.JS - COMPLETE FIXED VERSION
// ✅ Added submissionStatus handling
// ✅ Added profileComplete flag
// ✅ Added submittedAt timestamp
// ✅ Full approval workflow implementation
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCLUvxU19ePhSex0g0-VEVZJlwVP4vkRiU",
    authDomain: "faculty-profile-manageme-b912b.firebaseapp.com",
    projectId: "faculty-profile-manageme-b912b",
    storageBucket: "faculty-profile-manageme-b912b.firebasestorage.app",
    messagingSenderId: "492340972765",
    appId: "1:492340972765:web:30ef69e2ce0e6e59c9df34",
    measurementId: "G-42SHN6353G"
};

// Firebase services
let auth = null;
let db = null;
let storage = null;
let currentUser = null;
let isFirebaseInitialized = false;
let realtimeListener = null;

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized with correct config");
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // IMPORTANT: Set auth domain explicitly
    auth.useDeviceLanguage();
    
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Multiple tabs open, persistence enabled in single tab mode");
            } else if (err.code === 'unimplemented') {
                console.warn("Browser doesn't support persistence");
            }
        });
    
    isFirebaseInitialized = true;
    
    // Make globally available
    window.firebaseAuth = auth;
    window.firebaseDB = db;
    window.firebaseStorage = storage;
    window.firebaseCurrentUser = null;
    window.isFirebaseReady = function() {
        return !!(auth && db && currentUser);
    };
    
    // Set up auth state listener
    auth.onAuthStateChanged(handleAuthStateChange);
    
    console.log("✅ Firebase services ready");
    console.log("📋 Project ID:", firebaseConfig.projectId);
    console.log("🔐 Auth Domain:", firebaseConfig.authDomain);
    
} catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    isFirebaseInitialized = false;
}

// ============================================
// AUTH STATE HANDLER
// ============================================
async function handleAuthStateChange(user) {
    currentUser = user;
    window.firebaseCurrentUser = user;
    
    if (user) {
        console.log("✅ User authenticated:", user.email);
        console.log("🆔 User UID:", user.uid);
        
        // Load profile data
        const profileData = await loadProfileData();
        
        // Dispatch event for dashboard
        const event = new CustomEvent('firebaseUserReady', { 
            detail: { user: user, profileData: profileData } 
        });
        window.dispatchEvent(event);
        
        showMessage(`Welcome ${user.email}!`, "success");
        
    } else {
        console.log("❌ No user signed in");
        currentUser = null;
        window.firebaseCurrentUser = null;
        
        const event = new CustomEvent('firebaseUserLoggedOut', { detail: {} });
        window.dispatchEvent(event);
    }
}

// ============================================
// LOAD PROFILE DATA
// ============================================
async function loadProfileData() {
    if (!currentUser || !db) {
        console.log("⚠️ Cannot load: No user or DB");
        return null;
    }
    
    try {
        const userId = currentUser.uid;
        console.log("📥 Loading profile for user:", userId);
        
        const profileRef = db.collection('facultyProfiles').doc(userId);
        const doc = await profileRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log("✅ Profile loaded from Firestore");
            console.log("📊 Submission Status:", data.submissionStatus || 'pending');
            
            // Save to localStorage as backup
            try {
                localStorage.setItem('facultyProfileBackup', JSON.stringify(data));
            } catch (e) {
                console.warn("LocalStorage backup failed:", e);
            }
            
            return data;
        } else {
            console.log("📭 No existing profile data found");
            
            // Try to load from localStorage
            try {
                const backup = localStorage.getItem('facultyProfileBackup');
                if (backup) {
                    const data = JSON.parse(backup);
                    console.log("✅ Loaded from localStorage backup");
                    return data;
                }
            } catch (e) {
                console.warn("LocalStorage load failed:", e);
            }
            
            return null;
        }
    } catch (error) {
        console.error("❌ Error loading profile:", error);
        return null;
    }
}

// ============================================
// SAVE PROFILE DATA - COMPLETE FIXED VERSION
// ✅ Added submissionStatus: "pending"
// ✅ Added profileComplete: false
// ✅ Added submittedAt timestamp
// ============================================
async function saveProfileData(profileData) {
    if (!window.firebaseAuth?.currentUser) {
        console.log("⚠️ Cannot save: No user logged in");
        
        // Save to localStorage as fallback
        try {
            localStorage.setItem('facultyProfileBackup', JSON.stringify(profileData));
            console.log("✅ Saved to localStorage (offline mode)");
            showMessage("Profile saved locally. Login to sync with cloud.", "info");
            return true;
        } catch (e) {
            console.error("LocalStorage save failed:", e);
            return false;
        }
    }
    
    try {
        const currentUser = window.firebaseAuth.currentUser;
        const userId = currentUser.uid;
        console.log("📤 Saving profile for user:", userId);
        
        // Check if profile already exists to preserve status
        const existingDoc = await db.collection('facultyProfiles').doc(userId).get();
        let submissionStatus = 'pending';
        let profileComplete = false;
        
        // If profile already exists and is approved or rejected, keep that status
        // Only set to pending if it's a new submission or draft
        if (existingDoc.exists) {
            const existingData = existingDoc.data();
            const existingStatus = existingData.submissionStatus;
            
            // Don't change approved/rejected status on normal save
            if (existingStatus === 'approved') {
                submissionStatus = 'approved';
                profileComplete = true;
                console.log("Profile already approved, keeping approved status");
            } else if (existingStatus === 'rejected') {
                submissionStatus = 'rejected';
                profileComplete = false;
                console.log("Profile was rejected, keeping rejected status");
            } else {
                submissionStatus = 'pending';
                profileComplete = false;
                console.log("Profile set to pending for approval");
            }
        }
        
        // ✅ IMPORTANT FIX: Set status to pending for new profiles
        const firestoreData = {
            personalInfo: profileData.personalInfo || {},
            qualifications: profileData.qualifications || [],
            researchProjects: profileData.researchProjects || [],
            publications: profileData.publications || [],
            patents: profileData.patents || [],
            awards: profileData.awards || [],
            certificates: profileData.certificates || [],
            professionalMemberships: profileData.professionalMemberships || [],
            workshops: profileData.workshops || [],
            extraFields: profileData.extraFields || {},
            employeeId: profileData.employeeId || '',
            department: profileData.department || '',
            
            // ✅ FIX: Status management
            submissionStatus: submissionStatus,
            profileComplete: profileComplete,
            
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            userId: userId,
            email: currentUser.email
        };
        
        // Add submittedAt only for new submissions
        if (!existingDoc.exists) {
            firestoreData.submittedAt = firebase.firestore.FieldValue.serverTimestamp();
            firestoreData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Save to facultyProfiles
        const profileRef = db.collection('facultyProfiles').doc(userId);
        await profileRef.set(firestoreData, { merge: true });
        console.log("✅ Profile saved to Firestore with status:", submissionStatus);
        
        // Update faculty collection
        try {
            const facultyRef = db.collection('faculty').doc(userId);
            await facultyRef.set({
                fullName: profileData.personalInfo?.fullName || '',
                department: profileData.department || '',
                employeeId: profileData.employeeId || '',
                email: currentUser.email,
                profileComplete: profileComplete,
                submissionStatus: submissionStatus,
                userId: userId,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (facultyError) {
            console.warn("Faculty collection update failed:", facultyError);
        }
        
        // Save to localStorage as backup
        try {
            localStorage.setItem('facultyProfileBackup', JSON.stringify(profileData));
        } catch (e) {
            console.warn("LocalStorage backup failed:", e);
        }
        
        // Show appropriate message based on status
        if (submissionStatus === 'approved') {
            showMessage("Profile saved! Your profile is approved and public.", "success");
        } else if (submissionStatus === 'rejected') {
            showMessage("Profile saved. Your profile was rejected. Please contact admin.", "warning");
        } else {
            showMessage("Profile saved! Waiting for admin approval.", "info");
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Error saving to Firestore:", error);
        
        // Save to localStorage as fallback
        try {
            localStorage.setItem('facultyProfileBackup', JSON.stringify(profileData));
            console.log("✅ Saved to localStorage (Firestore failed)");
            showMessage("Saved locally. Will sync when connection restored.", "info");
            return true;
        } catch (e) {
            console.error("LocalStorage save failed:", e);
            return false;
        }
    }
}

// ============================================
// SUBMIT PROFILE FOR APPROVAL
// ============================================
async function submitProfileForApproval() {
    if (!currentUser || !db) {
        showMessage("Please login to submit profile", "error");
        return false;
    }
    
    // Check if profile has minimum required data
    const profileData = await loadProfileData();
    if (!profileData) {
        showMessage("Please save your profile before submitting", "error");
        return false;
    }
    
    const hasPersonalInfo = !!(profileData.personalInfo?.fullName && profileData.personalInfo?.email);
    const hasEmployeeId = !!(profileData.employeeId && profileData.department);
    const hasQualification = (profileData.qualifications?.length || 0) > 0;
    
    if (!hasPersonalInfo || !hasEmployeeId || !hasQualification) {
        showMessage("Please complete Personal Info, Employee Details, and at least one Qualification before submitting", "warning");
        return false;
    }
    
    try {
        const userId = currentUser.uid;
        
        await db.collection('facultyProfiles').doc(userId).update({
            submissionStatus: 'pending',
            profileComplete: false,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('faculty').doc(userId).set({
            submissionStatus: 'pending',
            profileComplete: false,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        showMessage("Profile submitted for admin approval!", "success");
        return true;
        
    } catch (error) {
        console.error("Submit error:", error);
        showMessage("Failed to submit: " + error.message, "error");
        return false;
    }
}

// ============================================
// CHECK PROFILE STATUS
// ============================================
async function checkProfileStatus() {
    if (!currentUser || !db) return null;
    
    try {
        const userId = currentUser.uid;
        const doc = await db.collection('facultyProfiles').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            return {
                status: data.submissionStatus || 'pending',
                profileComplete: data.profileComplete || false,
                submittedAt: data.submittedAt,
                approvedAt: data.approvedAt,
                rejectedAt: data.rejectedAt
            };
        }
        return { status: 'pending', profileComplete: false };
    } catch (error) {
        console.error("Error checking status:", error);
        return null;
    }
}

// ============================================
// UPLOAD FILE
// ============================================
async function uploadFile(file, section) {
    if (!currentUser || !storage || !file) {
        console.log("⚠️ Upload skipped: missing user, storage, or file");
        return null;
    }
    
    try {
        const userId = currentUser.uid;
        const timestamp = Date.now();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${timestamp}_${cleanName}`;
        const filePath = `${section}/${year}/${month}/${userId}/${fileName}`;
        
        console.log("📤 Uploading to:", filePath);
        
        const storageRef = storage.ref();
        const fileRef = storageRef.child(filePath);
        
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
                originalName: file.name,
                section: section
            }
        };
        
        const snapshot = await fileRef.put(file, metadata);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        console.log("✅ Upload successful:", downloadURL);
        
        return {
            url: downloadURL,
            path: filePath,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            section: section
        };
        
    } catch (error) {
        console.error("❌ Upload failed:", error.message);
        return null;
    }
}

// ============================================
// SETUP REALTIME LISTENER
// ============================================
function setupRealtimeListener(callback) {
    if (!currentUser || !db) return null;
    
    if (realtimeListener) {
        realtimeListener();
    }
    
    const profileRef = db.collection('facultyProfiles').doc(currentUser.uid);
    realtimeListener = profileRef.onSnapshot((doc) => {
        if (doc.exists) {
            console.log("📡 Real-time update received");
            if (callback) callback(doc.data());
        }
    }, (error) => {
        console.error("❌ Realtime listener error:", error);
    });
    
    return realtimeListener;
}

// ============================================
// SHOW MESSAGE
// ============================================
function showMessage(text, type = "info") {
    console.log(`[${type.toUpperCase()}] ${text}`);
    
    const existing = document.querySelectorAll('.firebase-message');
    existing.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = 'firebase-message';
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    };
    
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 12px;
        z-index: 10000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    message.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" style="font-size: 20px;"></i>
        <span style="flex: 1;">${text}</span>
        <i class="fas fa-times" style="cursor: pointer; opacity: 0.8;" onclick="this.parentElement.remove()"></i>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 4000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;
window.firebaseCurrentUser = currentUser;
window.saveToFirestore = saveProfileData;
window.loadFromFirestore = loadProfileData;
window.uploadToStorage = uploadFile;
window.showFirebaseMessage = showMessage;
window.setupRealtimeListener = setupRealtimeListener;
window.submitProfileForApproval = submitProfileForApproval;
window.checkProfileStatus = checkProfileStatus;

console.log("✅ Firebase config loaded - READY with full approval workflow");