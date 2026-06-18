// otp-handler.js - FIXED VERSION WITH CORRECT URL
// ============================================
// ✅ Uses Firebase's built-in password reset email links
// ✅ Fixed "Invalid authority in continue url" error
// ============================================

// DOM Elements
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const resetModal = document.getElementById('resetModal');
const sendResetLinkBtn = document.getElementById('sendResetLinkBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const resendResetLinkBtn = document.getElementById('resendResetLinkBtn');
const closeResetModalBtn = document.getElementById('closeResetModalBtn');

// Message Elements
const step1Message = document.getElementById('step1Message');
const step2Message = document.getElementById('step2Message');

let currentResetEmail = '';
let resendCooldown = 0;
let resendInterval = null;

// Helper function to show messages
function showMessage(element, text, type = "info") {
    if (!element) return;
    element.textContent = text;
    element.className = "message-container " + type;
    element.style.display = text ? 'block' : 'none';
    
    if (type === "success") {
        setTimeout(() => {
            if (element.textContent === text) {
                element.style.display = 'none';
            }
        }, 5000);
    }
}

// Check if user exists in Firebase
async function checkUserExists(email) {
    try {
        // Check Firebase Authentication
        const methods = await window.firebaseAuth.fetchSignInMethodsForEmail(email);
        if (methods && methods.length > 0) {
            return true;
        }
        
        // Check Firestore collections
        const collections = ['faculty', 'facultyProfiles'];
        for (const collection of collections) {
            try {
                const snapshot = await window.firebaseDB.collection(collection)
                    .where('email', '==', email.toLowerCase())
                    .limit(1)
                    .get();
                if (!snapshot.empty) {
                    return true;
                }
            } catch (err) {
                console.log(`Collection ${collection} check:`, err.message);
            }
        }
        
        return false;
    } catch (error) {
        console.error("Error checking user:", error);
        return false;
    }
}

// Send password reset email using Firebase with CORRECT URL
async function sendPasswordResetEmail(email) {
    try {
        console.log("📧 Sending password reset email to:", email);
        
        // IMPORTANT: Use a simple, valid URL without query parameters
        // The URL must be a valid page in your application
        const resetUrl = window.location.origin + '/facultyLogin.html';
        
        // Validate URL
        try {
            new URL(resetUrl);
            console.log("✅ Reset URL is valid:", resetUrl);
        } catch (urlError) {
            console.error("❌ Invalid URL:", resetUrl);
            throw new Error("Invalid redirect URL configuration");
        }
        
        // Configure action code settings with proper URL
        const actionCodeSettings = {
            // URL must be a valid page in your domain
            url: resetUrl,
            // Handle code in app false means Firebase will handle the email link
            handleCodeInApp: false,
            // Set the iOS bundle ID if you have iOS app (optional)
            // iOS: { bundleId: 'com.example.ios' },
            // Set the Android package name if you have Android app (optional)
            // android: { packageName: 'com.example.android' },
            // Set dynamic link domain if you have custom domain (optional)
            // dynamicLinkDomain: 'your-custom-domain.com'
        };
        
        await window.firebaseAuth.sendPasswordResetEmail(email, actionCodeSettings);
        console.log("✅ Password reset email sent successfully");
        return { success: true };
        
    } catch (error) {
        console.error("❌ Error sending password reset email:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        throw error;
    }
}

// Start resend cooldown timer
function startResendCooldown() {
    if (resendInterval) clearInterval(resendInterval);
    resendCooldown = 60; // 60 seconds cooldown
    
    if (resendResetLinkBtn) {
        resendResetLinkBtn.disabled = true;
        resendResetLinkBtn.style.opacity = '0.5';
        resendResetLinkBtn.style.cursor = 'not-allowed';
    }
    
    resendInterval = setInterval(() => {
        resendCooldown--;
        if (resendCooldown <= 0) {
            clearInterval(resendInterval);
            if (resendResetLinkBtn) {
                resendResetLinkBtn.disabled = false;
                resendResetLinkBtn.style.opacity = '1';
                resendResetLinkBtn.style.cursor = 'pointer';
            }
        }
    }, 1000);
}

// Show specific step
function showStep(stepNumber) {
    const step1 = document.getElementById('resetStep1');
    const step2 = document.getElementById('resetStep2');
    
    if (step1) step1.style.display = stepNumber === 1 ? 'block' : 'none';
    if (step2) step2.style.display = stepNumber === 2 ? 'block' : 'none';
    
    // Clear messages
    if (step1Message) showMessage(step1Message, '', 'info');
    if (step2Message) showMessage(step2Message, '', 'info');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Forgot Password Link
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get email from login form
        const loginEmail = document.getElementById('email')?.value.trim();
        const resetEmailInput = document.getElementById('resetEmail');
        if (resetEmailInput && loginEmail) {
            resetEmailInput.value = loginEmail;
        }
        
        if (resetModal) {
            resetModal.style.display = 'flex';
            showStep(1);
            currentResetEmail = '';
        }
        
        setTimeout(() => {
            document.getElementById('resetEmail')?.focus();
        }, 100);
    });
}

// Close Modal
if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function() {
        if (resetModal) resetModal.style.display = 'none';
        if (resendInterval) clearInterval(resendInterval);
        showStep(1);
    });
}

if (closeResetModalBtn) {
    closeResetModalBtn.addEventListener('click', function() {
        if (resetModal) resetModal.style.display = 'none';
        if (resendInterval) clearInterval(resendInterval);
        showStep(1);
    });
}

// Send Reset Link Button
if (sendResetLinkBtn) {
    sendResetLinkBtn.addEventListener('click', async function() {
        const emailInput = document.getElementById('resetEmail');
        const email = emailInput?.value.trim();
        
        if (!email) {
            showMessage(step1Message, "Please enter your email address", "error");
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMessage(step1Message, "Please enter a valid email address", "error");
            return;
        }
        
        // Disable button and show loading
        sendResetLinkBtn.disabled = true;
        const btnText = sendResetLinkBtn.querySelector('.btn-text');
        const btnLoading = sendResetLinkBtn.querySelector('.btn-loading');
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-block';
        
        showMessage(step1Message, "Checking your email...", "info");
        
        try {
            // Check if user exists
            const userExists = await checkUserExists(email);
            
            if (!userExists) {
                showMessage(step1Message, "❌ No account found with this email. Please sign up first.", "error");
                return;
            }
            
            showMessage(step1Message, "✅ Email verified! Sending password reset link...", "success");
            
            // Send password reset email
            const result = await sendPasswordResetEmail(email);
            
            if (result.success) {
                currentResetEmail = email;
                showStep(2);
                showMessage(step2Message, "✅ Password reset link sent! Check your email inbox and spam folder.", "success");
                startResendCooldown();
            }
            
        } catch (error) {
            console.error("Error sending reset link:", error);
            
            let errorMessage = "Failed to send reset link";
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many attempts. Please try again later";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address";
            } else if (error.code === 'auth/invalid-continue-uri') {
                errorMessage = "Invalid redirect URL. Please contact support.";
                console.error("Invalid continue URI - Check Firebase Console > Authentication > Sign-in method > Authorized domains");
            } else {
                errorMessage = error.message || "Please try again later";
            }
            
            showMessage(step1Message, `❌ ${errorMessage}`, "error");
            
        } finally {
            sendResetLinkBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    });
}

// Resend Reset Link Button
if (resendResetLinkBtn) {
    resendResetLinkBtn.addEventListener('click', async function() {
        if (!currentResetEmail) {
            showMessage(step2Message, "❌ Please enter email first", "error");
            showStep(1);
            return;
        }
        
        if (resendResetLinkBtn.disabled) {
            showMessage(step2Message, "Please wait before resending", "info");
            return;
        }
        
        // Disable button temporarily
        resendResetLinkBtn.disabled = true;
        const originalText = resendResetLinkBtn.innerHTML;
        resendResetLinkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        showMessage(step2Message, "🔄 Sending new password reset link...", "info");
        
        try {
            const result = await sendPasswordResetEmail(currentResetEmail);
            
            if (result.success) {
                showMessage(step2Message, "✅ New password reset link sent! Check your inbox.", "success");
                startResendCooldown();
            }
            
        } catch (error) {
            console.error("Error resending:", error);
            showMessage(step2Message, "❌ Failed to resend. Please try again later.", "error");
            resendResetLinkBtn.disabled = false;
            resendResetLinkBtn.innerHTML = originalText;
        } finally {
            if (!resendResetLinkBtn.disabled) {
                resendResetLinkBtn.innerHTML = originalText;
            }
        }
    });
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === resetModal) {
        if (resetModal) resetModal.style.display = 'none';
        if (resendInterval) clearInterval(resendInterval);
        showStep(1);
    }
});

// Check URL parameters for reset success
window.addEventListener('DOMContentLoaded', function() {
    console.log("✅ OTP Handler initialized - USING FIREBASE EMAIL LINK FOR PASSWORD RESET");
    console.log("✅ Current origin:", window.location.origin);
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'success') {
        const mainMessage = document.getElementById('message');
        if (mainMessage) {
            mainMessage.textContent = "✅ Password reset successful! Please login with your new password.";
            mainMessage.className = "message-container success";
            mainMessage.style.display = 'block';
            
            setTimeout(() => {
                mainMessage.style.display = 'none';
            }, 5000);
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});