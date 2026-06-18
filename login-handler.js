// login-handler.js - UPDATED VERSION
// ============================================

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

function showLoginMessage(text, type = "info") {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = "message " + type;
    messageDiv.style.display = text ? 'block' : 'none';
}

// Login function
async function handleLogin() {
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    showLoginMessage("", "info");
    
    if (!email || !password) {
        showLoginMessage("Please fill in all fields", "error");
        return;
    }
    
    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Signing in...";
    
    try {
        showLoginMessage("Signing in...", "info");
        
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        await window.firebaseAuth.setPersistence(persistence);
        
        await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        
        showLoginMessage("✅ Login successful! Redirecting...", "success");
        
        setTimeout(() => {
            window.location.href = "facultyDashboard.html";
        }, 1500);
        
    } catch (error) {
        console.error("Login error:", error);
        
        let errorMessage = "Login failed";
        switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address";
                break;
            case 'auth/user-disabled':
                errorMessage = "Account has been disabled";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Too many attempts. Try again later";
                break;
            case 'auth/network-request-failed':
                errorMessage = "Network error. Check connection";
                break;
            default:
                errorMessage = error.message;
        }
        
        showLoginMessage(errorMessage, "error");
        
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
}

// Event Listeners
if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
}

if (loginForm) {
    loginForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Login page loaded");
});