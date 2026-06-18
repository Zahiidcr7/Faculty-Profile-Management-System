// ============================================
// DASHBOARD.JS - COMPLETE ENHANCED VERSION
// ✅ PROFESSIONAL BODY MEMBERSHIPS ADDED
// ✅ ENHANCED WORKSHOPS WITH FDP/STTP
// ✅ FULL FIREBASE INTEGRATION
// ✅ FIXED: Student counts display in research projects
// ✅ FIXED: Remove auto-approval (requires admin approval)
// ✅ FIXED: User data isolation - no cross-account data sharing
// ============================================

// ============================================
// GLOBAL VARIABLES
// ============================================

let profileData = {
    personalInfo: {},
    qualifications: [],
    researchProjects: [],
    publications: [],
    patents: [],
    awards: [],
    certificates: [],
    professionalMemberships: [],
    workshops: [],
    extraFields: {},
    employeeId: '',
    department: '',
    lastUpdated: null,
    createdAt: null
};

let currentSection = 'dashboard';
let editIndex = -1;
let editType = '';
let workshopType = 'attended';
let isDashboardInitialized = false;
let firebaseCheckInterval = null;
let firebaseReady = false;
let extraFieldCounter = 0;
let dataLoaded = false;
let currentUserId = null;

const DOM = {};

// ============================================
// INITIALIZATION
// ============================================

function initDashboard() {
    console.log("🚀 Initializing dashboard...");
    
    if (isDashboardInitialized) return;
    
    try {
        initDOM();
        setupEventListeners();
        setupNavigation();
        initExtraFieldHandlers();
        initProfessionalMembershipHandlers();
        showSection('dashboard');
        
        checkFirebaseAndLoadData();
        
        isDashboardInitialized = true;
        console.log("✅ Dashboard initialized successfully");
    } catch (error) {
        console.error("❌ Dashboard initialization error:", error);
        showMessage("Error initializing dashboard: " + error.message, "error");
    }
}

function initDOM() {
    DOM.saveProfileBtn = document.getElementById('saveProfileBtn');
    DOM.sidebarSaveBtn = document.getElementById('sidebarSaveBtn');
    DOM.clearAllBtn = document.getElementById('clearAllBtn');
    DOM.submitProfileBtn = document.getElementById('submitProfileBtn');
    DOM.exportPdfBtn = document.getElementById('exportPdfBtn');
    DOM.logoutBtn = document.getElementById('logoutBtn');
    DOM.scrollToTop = document.getElementById('scrollToTop');
    DOM.notificationIcon = document.getElementById('notificationIcon');
    DOM.notificationPanel = document.getElementById('notificationPanel');
    DOM.notificationClose = document.getElementById('notificationClose');
    DOM.employeeIdInput = document.getElementById('employeeId');
    DOM.departmentInput = document.getElementById('department');
    DOM.sidebarCompletion = document.getElementById('sidebarCompletion');
    DOM.sidebarProgressFill = document.getElementById('sidebarProgressFill');
    
    console.log("✅ DOM elements initialized");
}

// ============================================
// USER DATA ISOLATION FUNCTIONS
// ============================================

function resetProfileData() {
    console.log("🔄 Resetting profile data for new user");
    profileData = {
        personalInfo: {},
        qualifications: [],
        researchProjects: [],
        publications: [],
        patents: [],
        awards: [],
        certificates: [],
        professionalMemberships: [],
        workshops: [],
        extraFields: {},
        employeeId: '',
        department: '',
        lastUpdated: null,
        createdAt: null
    };
    
    clearAllFormFields();
    clearAllDisplayLists();
    updateProgress();
}

function clearAllFormFields() {
    const fields = ['fullName', 'dob', 'gender', 'email', 'phone', 'address', 'employeeId', 'department'];
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) el.value = '';
    });
}

function clearAllDisplayLists() {
    const lists = [
        { list: 'qualificationsList', empty: 'qualificationsEmptyMessage' },
        { list: 'researchList', empty: 'researchEmptyMessage' },
        { list: 'publicationsList', empty: 'publicationsEmptyMessage' },
        { list: 'patentsList', empty: 'patentsEmptyMessage' },
        { list: 'awardsList', empty: 'awardsEmptyMessage' },
        { list: 'certificatesList', empty: 'certificatesEmptyMessage' },
        { list: 'membershipsList', empty: 'membershipsEmptyMessage' },
        { list: 'workshopsList', empty: 'workshopsEmptyMessage' }
    ];
    
    lists.forEach(item => {
        const listEl = document.getElementById(item.list);
        const emptyEl = document.getElementById(item.empty);
        if (listEl) {
            listEl.innerHTML = '';
            listEl.style.display = 'none';
        }
        if (emptyEl) emptyEl.style.display = 'block';
    });
}

function clearAllDisplayedData() {
    clearAllFormFields();
    clearAllDisplayLists();
    displaySavedData();
    updateProgress();
    showMessage("Previous user data cleared", "info");
}

// ============================================
// PROFESSIONAL MEMBERSHIPS
// ============================================

function initProfessionalMembershipHandlers() {
    const membershipType = document.getElementById('membershipType');
    if (membershipType) {
        membershipType.addEventListener('change', function() {
            const otherContainer = document.getElementById('otherMembershipContainer');
            if (otherContainer) {
                otherContainer.style.display = this.value === 'other' ? 'block' : 'none';
            }
        });
    }
}

function showMembershipForm() {
    hideElement('membershipsEmptyMessage');
    hideElement('membershipsList');
    showElement('membershipForm');
    editIndex = -1;
    editType = 'membership';
    clearMembershipForm();
}

function cancelMembership() {
    hideElement('membershipForm');
    
    if (profileData.professionalMemberships?.length > 0) {
        showElement('membershipsList');
    } else {
        showElement('membershipsEmptyMessage');
    }
    
    clearMembershipForm();
}

function clearMembershipForm() {
    document.getElementById('membershipType').value = '';
    document.getElementById('otherMembershipName').value = '';
    document.getElementById('membershipNumber').value = '';
    document.getElementById('membershipValidFrom').value = '';
    document.getElementById('membershipValidUntil').value = '';
    document.getElementById('membershipStatus').value = 'active';
    
    const otherContainer = document.getElementById('otherMembershipContainer');
    if (otherContainer) otherContainer.style.display = 'none';
}

async function saveMembership() {
    const membershipType = document.getElementById('membershipType')?.value || '';
    let organizationName = '';
    
    if (membershipType === 'other') {
        organizationName = document.getElementById('otherMembershipName')?.value?.trim() || '';
    } else {
        const select = document.getElementById('membershipType');
        const selectedOption = select.options[select.selectedIndex];
        organizationName = selectedOption.text;
    }
    
    const membership = {
        type: membershipType,
        organizationName: organizationName,
        membershipNumber: document.getElementById('membershipNumber')?.value?.trim() || '',
        validFrom: document.getElementById('membershipValidFrom')?.value || '',
        validUntil: document.getElementById('membershipValidUntil')?.value || '',
        status: document.getElementById('membershipStatus')?.value || 'active',
        id: Date.now().toString()
    };
    
    if (!membership.type) {
        showMessage("Please select membership type", "error");
        document.getElementById('membershipType')?.classList.add('error');
        return;
    }
    
    if (membership.type === 'other' && !membership.organizationName) {
        showMessage("Please specify organization name", "error");
        document.getElementById('otherMembershipName')?.classList.add('error');
        return;
    }
    
    if (!membership.membershipNumber) {
        showMessage("Membership Number is required", "error");
        document.getElementById('membershipNumber')?.classList.add('error');
        return;
    }
    
    document.getElementById('membershipType')?.classList.remove('error');
    document.getElementById('otherMembershipName')?.classList.remove('error');
    document.getElementById('membershipNumber')?.classList.remove('error');
    
    if (!profileData.professionalMemberships) profileData.professionalMemberships = [];
    
    if (editIndex >= 0 && editType === 'membership') {
        profileData.professionalMemberships[editIndex] = { ...profileData.professionalMemberships[editIndex], ...membership };
    } else {
        profileData.professionalMemberships.push(membership);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayMemberships();
        cancelMembership();
        showMessage("Professional membership saved successfully!", "success");
    }
}

function displayMemberships() {
    const list = document.getElementById('membershipsList');
    const empty = document.getElementById('membershipsEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.professionalMemberships || profileData.professionalMemberships.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Professional Memberships</h3>';
    profileData.professionalMemberships.forEach((m, index) => {
        const validFrom = m.validFrom ? new Date(m.validFrom).toLocaleDateString() : 'N/A';
        const validUntil = m.validUntil ? new Date(m.validUntil).toLocaleDateString() : 'Lifetime';
        
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(m.organizationName || '')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Membership No:</strong> ${escapeHtml(m.membershipNumber || '')}</p>
                    <p style="margin-bottom: 5px;"><strong>Valid From:</strong> ${validFrom}</p>
                    <p style="margin-bottom: 5px;"><strong>Valid Until:</strong> ${validUntil}</p>
                    <p style="margin-bottom: 5px;">
                        <span class="status-badge ${m.status === 'active' ? 'status-active' : m.status === 'expired' ? 'status-expired' : 'status-pending'}">
                            ${m.status === 'active' ? 'Active' : m.status === 'expired' ? 'Expired' : 'Pending'}
                        </span>
                    </p>
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editMembership(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteMembership(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editMembership(index) {
    const m = profileData.professionalMemberships[index];
    if (!m) return;
    
    document.getElementById('membershipType').value = m.type || '';
    document.getElementById('otherMembershipName').value = m.organizationName || '';
    document.getElementById('membershipNumber').value = m.membershipNumber || '';
    document.getElementById('membershipValidFrom').value = m.validFrom || '';
    document.getElementById('membershipValidUntil').value = m.validUntil || '';
    document.getElementById('membershipStatus').value = m.status || 'active';
    
    const otherContainer = document.getElementById('otherMembershipContainer');
    if (otherContainer) {
        otherContainer.style.display = m.type === 'other' ? 'block' : 'none';
    }
    
    editIndex = index;
    editType = 'membership';
    showMembershipForm();
}

async function deleteMembership(index) {
    if (confirm("Are you sure you want to delete this membership?")) {
        profileData.professionalMemberships.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayMemberships();
            showMessage("Membership deleted", "success");
        }
    }
}

// ============================================
// ENHANCED WORKSHOPS WITH FDP/STTP
// ============================================

function showWorkshopForm() {
    hideElement('workshopsEmptyMessage');
    hideElement('workshopsList');
    showElement('workshopForm');
    editIndex = -1;
    editType = 'workshop';
    
    selectWorkshopType('attended');
    clearWorkshopForm();
}

function cancelWorkshop() {
    hideElement('workshopForm');
    
    if (profileData.workshops?.length > 0) {
        showElement('workshopsList');
    } else {
        showElement('workshopsEmptyMessage');
    }
    
    clearWorkshopForm();
}

function clearWorkshopForm() {
    document.getElementById('workshopTitleAttended').value = '';
    document.getElementById('workshopInstituteAttended').value = '';
    document.getElementById('workshopStartDateAttended').value = '';
    document.getElementById('workshopEndDateAttended').value = '';
    document.getElementById('workshopModeAttended').value = '';
    document.getElementById('certificateIssuedAttended').value = '';
    document.getElementById('workshopLearnings').value = '';
    document.getElementById('workshopCategoryAttended').value = 'workshop';
    
    document.getElementById('workshopTitleOrganized').value = '';
    document.getElementById('organizedFor').value = '';
    document.getElementById('workshopStartDateOrganized').value = '';
    document.getElementById('workshopEndDateOrganized').value = '';
    document.getElementById('participantsCount').value = '';
    document.getElementById('workshopRole').value = '';
    document.getElementById('workshopDescription').value = '';
    document.getElementById('workshopCategoryOrganized').value = 'workshop';
    document.getElementById('workshopFunding').value = '';
}

function selectWorkshopType(type) {
    workshopType = type;
    
    document.querySelectorAll('.workshop-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.workshop-type-btn[data-type="${type}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.workshop-form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const formSection = document.getElementById(`workshop${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
    if (formSection) formSection.classList.add('active');
}

async function saveWorkshop() {
    let workshop = { 
        type: workshopType,
        id: Date.now().toString()
    };
    
    if (workshopType === 'attended') {
        workshop = {
            ...workshop,
            title: document.getElementById('workshopTitleAttended')?.value?.trim() || '',
            institute: document.getElementById('workshopInstituteAttended')?.value?.trim() || '',
            startDate: document.getElementById('workshopStartDateAttended')?.value || '',
            endDate: document.getElementById('workshopEndDateAttended')?.value || '',
            mode: document.getElementById('workshopModeAttended')?.value || '',
            certificateIssued: document.getElementById('certificateIssuedAttended')?.value || '',
            learnings: document.getElementById('workshopLearnings')?.value?.trim() || '',
            category: document.getElementById('workshopCategoryAttended')?.value || 'workshop'
        };
        
        if (!workshop.title || !workshop.institute || !workshop.startDate) {
            showMessage("Title, Institute, and Start Date are required", "error");
            return;
        }
    } else {
        workshop = {
            ...workshop,
            title: document.getElementById('workshopTitleOrganized')?.value?.trim() || '',
            organizedFor: document.getElementById('organizedFor')?.value || '',
            startDate: document.getElementById('workshopStartDateOrganized')?.value || '',
            endDate: document.getElementById('workshopEndDateOrganized')?.value || '',
            participants: parseInt(document.getElementById('participantsCount')?.value) || 0,
            role: document.getElementById('workshopRole')?.value || '',
            description: document.getElementById('workshopDescription')?.value?.trim() || '',
            category: document.getElementById('workshopCategoryOrganized')?.value || 'workshop',
            funding: document.getElementById('workshopFunding')?.value?.trim() || ''
        };
        
        if (!workshop.title || !workshop.organizedFor || !workshop.startDate) {
            showMessage("Title, Audience, and Start Date are required", "error");
            return;
        }
    }
    
    if (!profileData.workshops) profileData.workshops = [];
    
    if (editIndex >= 0 && editType === 'workshop') {
        profileData.workshops[editIndex] = { ...profileData.workshops[editIndex], ...workshop };
    } else {
        profileData.workshops.push(workshop);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayWorkshops();
        cancelWorkshop();
        showMessage("Workshop/FDP/STTP saved successfully!", "success");
    }
}

function displayWorkshops() {
    const list = document.getElementById('workshopsList');
    const empty = document.getElementById('workshopsEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.workshops || profileData.workshops.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Workshops & FDP/STTP</h3>';
    profileData.workshops.forEach((w, index) => {
        const typeText = w.type === 'attended' ? 'Attended' : 'Organized';
        const categoryMap = {
            'workshop': 'Workshop',
            'fdp': 'FDP',
            'sttp': 'STTP',
            'seminar': 'Seminar',
            'conference': 'Conference',
            'other': 'Other'
        };
        const categoryText = categoryMap[w.category] || 'Workshop';
        const startDate = w.startDate ? new Date(w.startDate).toLocaleDateString() : 'N/A';
        const endDate = w.endDate ? new Date(w.endDate).toLocaleDateString() : 'N/A';
        
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(w.title || '')} 
                        <span style="background: var(--primary-blue); color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; margin-left: 10px;">
                            ${typeText}
                        </span>
                        <span style="background: #10b981; color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; margin-left: 5px;">
                            ${categoryText}
                        </span>
                    </h4>
                    ${w.type === 'attended' ? `
                        <p style="margin-bottom: 5px;"><strong>Institute:</strong> ${escapeHtml(w.institute || '')}</p>
                        <p style="margin-bottom: 5px;"><strong>Duration:</strong> ${startDate} to ${endDate}</p>
                        <p style="margin-bottom: 5px;"><strong>Mode:</strong> ${escapeHtml(w.mode || 'N/A')}</p>
                        <p style="margin-bottom: 5px;"><strong>Certificate Issued:</strong> ${escapeHtml(w.certificateIssued || 'N/A')}</p>
                        ${w.learnings ? `<p style="margin-bottom: 5px;"><strong>Learnings:</strong> ${escapeHtml(w.learnings)}</p>` : ''}
                    ` : `
                        <p style="margin-bottom: 5px;"><strong>Organized For:</strong> ${escapeHtml(w.organizedFor || '')}</p>
                        <p style="margin-bottom: 5px;"><strong>Duration:</strong> ${startDate} to ${endDate}</p>
                        <p style="margin-bottom: 5px;"><strong>Participants:</strong> ${w.participants || 0}</p>
                        <p style="margin-bottom: 5px;"><strong>Your Role:</strong> ${escapeHtml(w.role || 'N/A')}</p>
                        ${w.funding ? `<p style="margin-bottom: 5px;"><strong>Funding:</strong> ${escapeHtml(w.funding)}</p>` : ''}
                        ${w.description ? `<p style="margin-bottom: 5px;"><strong>Description:</strong> ${escapeHtml(w.description)}</p>` : ''}
                    `}
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editWorkshop(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteWorkshop(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editWorkshop(index) {
    const w = profileData.workshops[index];
    if (!w) return;
    
    if (w.type) {
        selectWorkshopType(w.type);
    }
    
    if (w.type === 'attended') {
        document.getElementById('workshopTitleAttended').value = w.title || '';
        document.getElementById('workshopInstituteAttended').value = w.institute || '';
        document.getElementById('workshopStartDateAttended').value = w.startDate || '';
        document.getElementById('workshopEndDateAttended').value = w.endDate || '';
        document.getElementById('workshopModeAttended').value = w.mode || '';
        document.getElementById('certificateIssuedAttended').value = w.certificateIssued || '';
        document.getElementById('workshopLearnings').value = w.learnings || '';
        document.getElementById('workshopCategoryAttended').value = w.category || 'workshop';
    } else {
        document.getElementById('workshopTitleOrganized').value = w.title || '';
        document.getElementById('organizedFor').value = w.organizedFor || '';
        document.getElementById('workshopStartDateOrganized').value = w.startDate || '';
        document.getElementById('workshopEndDateOrganized').value = w.endDate || '';
        document.getElementById('participantsCount').value = w.participants || '';
        document.getElementById('workshopRole').value = w.role || '';
        document.getElementById('workshopDescription').value = w.description || '';
        document.getElementById('workshopCategoryOrganized').value = w.category || 'workshop';
        document.getElementById('workshopFunding').value = w.funding || '';
    }
    
    editIndex = index;
    editType = 'workshop';
    showWorkshopForm();
}

async function deleteWorkshop(index) {
    if (confirm("Are you sure you want to delete this workshop?")) {
        profileData.workshops.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayWorkshops();
            showMessage("Workshop deleted", "success");
        }
    }
}

// ============================================
// FIREBASE CONNECTION - FIXED with user isolation
// ============================================

function checkFirebaseAndLoadData() {
    console.log("🔍 Checking Firebase connection...");
    
    if (firebaseCheckInterval) {
        clearInterval(firebaseCheckInterval);
        firebaseCheckInterval = null;
    }
    
    if (window.firebaseAuth && window.firebaseDB) {
        console.log("✅ Firebase services available");
        
        const user = window.firebaseAuth.currentUser;
        if (user) {
            console.log("✅ User is logged in:", user.email, "UID:", user.uid);
            window.firebaseCurrentUser = user;
            currentUserId = user.uid;
            firebaseReady = true;
            
            resetProfileData();
            
            loadProfileData().then(() => {
                displayUserInfo();
                showMessage(`Welcome ${user.email}!`, "success");
            });
            return;
        } else {
            console.log("⏳ No user logged in yet, waiting for auth state...");
            
            const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    console.log("✅ Auth state changed: User logged in", user.email, "UID:", user.uid);
                    window.firebaseCurrentUser = user;
                    currentUserId = user.uid;
                    firebaseReady = true;
                    
                    resetProfileData();
                    
                    loadProfileData();
                    displayUserInfo();
                    showMessage(`Welcome ${user.email}!`, "success");
                } else {
                    console.log("❌ User logged out");
                    resetProfileData();
                    clearAllDisplayedData();
                }
                unsubscribe();
            });
        }
    }
    
    let attempts = 0;
    const maxAttempts = 20;
    
    firebaseCheckInterval = setInterval(() => {
        attempts++;
        
        if (window.firebaseAuth && window.firebaseDB) {
            const user = window.firebaseAuth.currentUser;
            if (user) {
                console.log(`✅ Firebase ready after ${attempts} attempts`);
                window.firebaseCurrentUser = user;
                currentUserId = user.uid;
                firebaseReady = true;
                
                resetProfileData();
                loadProfileData();
                displayUserInfo();
                
                clearInterval(firebaseCheckInterval);
                firebaseCheckInterval = null;
                return;
            }
        }
        
        if (attempts >= maxAttempts) {
            console.log("⏰ Firebase timeout - check if user is logged in");
            clearInterval(firebaseCheckInterval);
            firebaseCheckInterval = null;
        }
    }, 500);
}

function isFirebaseReady() {
    return !!(window.firebaseAuth && 
              window.firebaseDB && 
              window.firebaseAuth.currentUser);
}

function displayUserInfo() {
    const user = window.firebaseAuth?.currentUser;
    if (!user) return;
    
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    const userEmail = document.getElementById('userEmail');
    
    if (userInfoDisplay && userEmail) {
        userInfoDisplay.style.display = 'flex';
        userEmail.textContent = user.email;
    }
    
    const accountEmail = document.getElementById('accountEmail');
    const accountUserId = document.getElementById('accountUserId');
    
    if (accountEmail) accountEmail.textContent = user.email || 'Not available';
    if (accountUserId) accountUserId.textContent = user.uid || 'Not available';
}

function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        showMessage("Logging out...", "info");
        
        if (window.firebaseAuth) {
            window.firebaseAuth.signOut().then(() => {
                resetProfileData();
                currentUserId = null;
                firebaseReady = false;
                dataLoaded = false;
                localStorage.removeItem('facultyProfileData');
                sessionStorage.clear();
                window.location.href = "facultyLogin.html";
            }).catch((error) => {
                console.error("Logout error:", error);
                window.location.href = "facultyLogin.html";
            });
        } else {
            window.location.href = "facultyLogin.html";
        }
    }
}

// ============================================
// FIREBASE DATA OPERATIONS - FIXED with user isolation
// ============================================

async function loadProfileData() {
    console.log("📥 Loading profile data for user:", currentUserId);
    
    if (!window.firebaseAuth?.currentUser || !window.firebaseDB) {
        console.log("❌ Cannot load: Firebase not ready");
        return false;
    }
    
    try {
        showMessage("Loading profile data...", "info");
        
        const userId = window.firebaseAuth.currentUser.uid;
        
        if (currentUserId && currentUserId !== userId) {
            console.log("⚠️ User mismatch, resetting data");
            resetProfileData();
            currentUserId = userId;
        }
        
        const profileRef = window.firebaseDB.collection('facultyProfiles').doc(userId);
        const doc = await profileRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log("✅ Profile loaded from Firestore for user:", userId);
            
            profileData = {
                personalInfo: { ...profileData.personalInfo, ...(data.personalInfo || {}) },
                qualifications: data.qualifications || [],
                researchProjects: data.researchProjects || [],
                publications: data.publications || [],
                patents: data.patents || [],
                awards: data.awards || [],
                certificates: data.certificates || [],
                professionalMemberships: data.professionalMemberships || [],
                workshops: data.workshops || [],
                extraFields: data.extraFields || {},
                employeeId: data.employeeId || '',
                department: data.department || '',
                lastUpdated: data.lastUpdated ? (data.lastUpdated.seconds ? new Date(data.lastUpdated.seconds * 1000).toISOString() : data.lastUpdated) : null,
                createdAt: data.createdAt || null
            };
            
            populateForms();
            updateProgress();
            updateLastSavedTime();
            displaySavedData();
            
            const status = data.submissionStatus || 'draft';
            if (status === 'approved') {
                showMessage("Your profile is approved and active!", "success");
            } else if (status === 'pending') {
                showMessage("Your profile is pending admin approval", "warning");
            } else {
                showMessage("Profile loaded successfully", "success");
            }
            
            dataLoaded = true;
            return true;
        } else {
            console.log("📭 No existing profile data for user:", userId);
            resetProfileData();
            displaySavedData();
            return false;
        }
    } catch (error) {
        console.error("❌ Load error:", error);
        showMessage("Failed to load profile: " + error.message, "error");
        return false;
    }
}

async function saveToFirebase() {
    console.log("💾 Saving profile data for user:", currentUserId);
    
    if (!window.firebaseAuth?.currentUser) {
        console.log("❌ No user logged in, cannot save");
        showMessage("Please login to save data", "error");
        return false;
    }
    
    const currentUser = window.firebaseAuth.currentUser;
    const userId = currentUser.uid;
    
    profileData.lastUpdated = new Date().toISOString();
    
    if (isFirebaseReady() && window.firebaseDB) {
        try {
            const profileRef = window.firebaseDB.collection('facultyProfiles').doc(userId);
            
            const currentDoc = await profileRef.get();
            const currentData = currentDoc.exists ? currentDoc.data() : {};
            
            const currentStatus = currentData.submissionStatus || 'draft';
            const currentProfileComplete = currentData.profileComplete || false;
            
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
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId,
                email: currentUser.email,
                submissionStatus: currentStatus,
                profileComplete: currentProfileComplete
            };
            
            await profileRef.set(firestoreData, { merge: true });
            console.log("✅ Saved to Firestore for user:", userId);
            
            try {
                const facultyRef = window.firebaseDB.collection('faculty').doc(userId);
                await facultyRef.set({
                    fullName: profileData.personalInfo?.fullName || '',
                    department: profileData.department || '',
                    employeeId: profileData.employeeId || '',
                    email: currentUser.email,
                    profileComplete: currentProfileComplete,
                    submissionStatus: currentStatus,
                    userId: userId,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (facultyError) {
                console.warn("Faculty collection update failed:", facultyError);
            }
            
            updateProgress();
            updateLastSavedTime();
            displaySavedData();
            
            showMessage("Profile saved successfully!", "success");
            return true;
            
        } catch (error) {
            console.error("❌ Firestore save error:", error);
            showMessage("Failed to save: " + error.message, "error");
            return false;
        }
    } else {
        console.log("📱 Firebase not ready - cannot save");
        showMessage("Cannot save: Not connected to Firebase", "error");
        return false;
    }
}

function updateLastSavedTime() {
    const lastSavedTime = document.getElementById('lastSavedTime');
    if (lastSavedTime && profileData.lastUpdated) {
        const date = new Date(profileData.lastUpdated);
        lastSavedTime.textContent = date.toLocaleString();
    } else if (lastSavedTime) {
        lastSavedTime.textContent = 'Not saved yet';
    }
}

// ============================================
// POPULATE FORMS WITH LOADED DATA
// ============================================

function populateForms() {
    console.log("📋 Populating forms with loaded data:", profileData);
    
    try {
        const pi = profileData.personalInfo || {};
        
        setFieldValue('fullName', pi.fullName);
        setFieldValue('dob', pi.dob);
        setFieldValue('gender', pi.gender);
        setFieldValue('email', pi.email);
        setFieldValue('phone', pi.phone);
        setFieldValue('address', pi.address);
        setFieldValue('employeeId', profileData.employeeId);
        setFieldValue('department', profileData.department);
        
        displayQualifications();
        displayResearchProjects();
        displayPublications();
        displayPatents();
        displayAwards();
        displayCertificates();
        displayMemberships();
        displayWorkshops();
        displaySavedData();
        
        console.log("✅ Forms populated successfully");
    } catch (error) {
        console.error("Error populating forms:", error);
    }
}

function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value || '';
    }
}

// ============================================
// EXTRA FIELDS
// ============================================

function showExtraPersonalField() { addExtraField('extraPersonalFields', 'personal'); }
function addExtraQualificationField() { addExtraField('extraQualificationFields', 'qualification'); }
function addExtraResearchField() { addExtraField('extraResearchFields', 'research'); }
function addExtraPublicationField() { addExtraField('extraPublicationFields', 'publication'); }
function addExtraPatentField() { addExtraField('extraPatentFields', 'patent'); }
function addExtraAwardField() { addExtraField('extraAwardFields', 'award'); }
function addExtraCertificateField() { addExtraField('extraCertificateFields', 'certificate'); }
function addExtraWorkshopField() { addExtraField('extraWorkshopFields', 'workshop'); }

function addExtraField(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    extraFieldCounter++;
    const fieldId = `extra_${type}_${extraFieldCounter}_${Date.now()}`;
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'extra-field';
    fieldDiv.id = fieldId;
    fieldDiv.innerHTML = `
        <input type="text" class="form-control" placeholder="Field Name" style="flex: 1;">
        <input type="text" class="form-control" placeholder="Field Value" style="flex: 2;">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeExtraField('${fieldId}')" style="padding: 10px 15px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(fieldDiv);
    showMessage("Extra field added", "success");
}

function removeExtraField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.remove();
        showMessage("Extra field removed", "info");
    }
}

function initExtraFieldHandlers() {
    window.removeExtraField = removeExtraField;
}

// ============================================
// PERSONAL INFORMATION
// ============================================

async function savePersonalInfo() {
    const personalData = {
        fullName: document.getElementById('fullName')?.value?.trim() || '',
        dob: document.getElementById('dob')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        email: document.getElementById('email')?.value?.trim() || '',
        phone: document.getElementById('phone')?.value?.trim() || '',
        address: document.getElementById('address')?.value?.trim() || ''
    };
    
    if (!personalData.fullName) {
        showMessage("Full Name is required", "error");
        document.getElementById('fullName')?.classList.add('error');
        return;
    }
    
    if (!personalData.email) {
        showMessage("Email is required", "error");
        document.getElementById('email')?.classList.add('error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalData.email)) {
        showMessage("Please enter a valid email address", "error");
        document.getElementById('email')?.classList.add('error');
        return;
    }
    
    document.getElementById('fullName')?.classList.remove('error');
    document.getElementById('email')?.classList.remove('error');
    
    profileData.employeeId = document.getElementById('employeeId')?.value?.trim() || '';
    profileData.department = document.getElementById('department')?.value?.trim() || '';
    profileData.personalInfo = personalData;
    
    const saved = await saveToFirebase();
    if (saved) {
        showSuccessMessage();
        showMessage("Personal information saved successfully!", "success");
        updateProgress();
    }
}

// ============================================
// QUALIFICATIONS
// ============================================

function showQualificationForm() {
    hideElement('qualificationsEmptyMessage');
    hideElement('qualificationsList');
    showElement('qualificationForm');
    editIndex = -1;
    editType = 'qualification';
    clearQualificationForm();
}

function cancelQualification() {
    hideElement('qualificationForm');
    
    if (profileData.qualifications?.length > 0) {
        showElement('qualificationsList');
    } else {
        showElement('qualificationsEmptyMessage');
    }
    
    clearQualificationForm();
}

function clearQualificationForm() {
    document.getElementById('degreeName').value = '';
    document.getElementById('specialization').value = '';
    document.getElementById('university').value = '';
    document.getElementById('completionYear').value = '';
    document.getElementById('grade').value = '';
}

async function saveQualification() {
    const qualification = {
        degreeName: document.getElementById('degreeName')?.value?.trim() || '',
        specialization: document.getElementById('specialization')?.value?.trim() || '',
        university: document.getElementById('university')?.value?.trim() || '',
        completionYear: document.getElementById('completionYear')?.value || '',
        grade: document.getElementById('grade')?.value?.trim() || '',
        id: Date.now().toString()
    };
    
    if (!qualification.degreeName) {
        showMessage("Degree Name is required", "error");
        document.getElementById('degreeName')?.classList.add('error');
        return;
    }
    
    if (!qualification.university) {
        showMessage("University is required", "error");
        document.getElementById('university')?.classList.add('error');
        return;
    }
    
    if (!qualification.completionYear) {
        showMessage("Year of Completion is required", "error");
        document.getElementById('completionYear')?.classList.add('error');
        return;
    }
    
    document.getElementById('degreeName')?.classList.remove('error');
    document.getElementById('university')?.classList.remove('error');
    document.getElementById('completionYear')?.classList.remove('error');
    
    if (!profileData.qualifications) profileData.qualifications = [];
    
    if (editIndex >= 0 && editType === 'qualification') {
        profileData.qualifications[editIndex] = { ...profileData.qualifications[editIndex], ...qualification };
    } else {
        profileData.qualifications.push(qualification);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayQualifications();
        cancelQualification();
        showMessage("Qualification saved successfully!", "success");
    }
}

function displayQualifications() {
    const list = document.getElementById('qualificationsList');
    const empty = document.getElementById('qualificationsEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.qualifications || profileData.qualifications.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Qualifications</h3>';
    profileData.qualifications.forEach((q, index) => {
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(q.degreeName || '')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Specialization:</strong> ${escapeHtml(q.specialization || 'N/A')}</p>
                    <p style="margin-bottom: 5px;"><strong>University:</strong> ${escapeHtml(q.university || '')}</p>
                    <p style="margin-bottom: 5px;"><strong>Year:</strong> ${escapeHtml(q.completionYear || '')} | <strong>Grade:</strong> ${escapeHtml(q.grade || 'N/A')}</p>
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editQualification(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteQualification(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editQualification(index) {
    const q = profileData.qualifications[index];
    if (!q) return;
    
    document.getElementById('degreeName').value = q.degreeName || '';
    document.getElementById('specialization').value = q.specialization || '';
    document.getElementById('university').value = q.university || '';
    document.getElementById('completionYear').value = q.completionYear || '';
    document.getElementById('grade').value = q.grade || '';
    
    editIndex = index;
    editType = 'qualification';
    showQualificationForm();
}

async function deleteQualification(index) {
    if (confirm("Are you sure you want to delete this qualification?")) {
        profileData.qualifications.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayQualifications();
            showMessage("Qualification deleted", "success");
        }
    }
}

// ============================================
// RESEARCH PROJECTS - FIXED with student counts
// ============================================

function showResearchForm() {
    hideElement('researchEmptyMessage');
    hideElement('researchList');
    showElement('researchForm');
    editIndex = -1;
    editType = 'research';
    clearResearchForm();
}

function cancelResearch() {
    hideElement('researchForm');
    
    if (profileData.researchProjects?.length > 0) {
        showElement('researchList');
    } else {
        showElement('researchEmptyMessage');
    }
    
    clearResearchForm();
}

function clearResearchForm() {
    document.getElementById('researchTitle').value = '';
    document.getElementById('fundingDetails').value = '';
    document.getElementById('phdStudents').value = '';
    document.getElementById('mastersStudents').value = '';
    document.getElementById('ugStudents').value = '';
    document.getElementById('projectStartYear').value = '';
    document.getElementById('projectEndYear').value = '';
    document.getElementById('projectRole').value = '';
}

async function saveResearch() {
    const research = {
        title: document.getElementById('researchTitle')?.value?.trim() || '',
        fundingDetails: document.getElementById('fundingDetails')?.value?.trim() || '',
        phdStudents: parseInt(document.getElementById('phdStudents')?.value) || 0,
        mastersStudents: parseInt(document.getElementById('mastersStudents')?.value) || 0,
        ugStudents: parseInt(document.getElementById('ugStudents')?.value) || 0,
        startYear: document.getElementById('projectStartYear')?.value || '',
        endYear: document.getElementById('projectEndYear')?.value || '',
        role: document.getElementById('projectRole')?.value || '',
        id: Date.now().toString()
    };
    
    if (!research.title) {
        showMessage("Project Title is required", "error");
        document.getElementById('researchTitle')?.classList.add('error');
        return;
    }
    
    if (!research.startYear) {
        showMessage("Start Year is required", "error");
        document.getElementById('projectStartYear')?.classList.add('error');
        return;
    }
    
    if (!research.role) {
        showMessage("Role is required", "error");
        document.getElementById('projectRole')?.classList.add('error');
        return;
    }
    
    document.getElementById('researchTitle')?.classList.remove('error');
    document.getElementById('projectStartYear')?.classList.remove('error');
    document.getElementById('projectRole')?.classList.remove('error');
    
    if (!profileData.researchProjects) profileData.researchProjects = [];
    
    if (editIndex >= 0 && editType === 'research') {
        profileData.researchProjects[editIndex] = { ...profileData.researchProjects[editIndex], ...research };
    } else {
        profileData.researchProjects.push(research);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayResearchProjects();
        cancelResearch();
        showMessage("Research project saved successfully!", "success");
    }
}

function displayResearchProjects() {
    const list = document.getElementById('researchList');
    const empty = document.getElementById('researchEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.researchProjects || profileData.researchProjects.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Research Projects</h3>';
    profileData.researchProjects.forEach((r, index) => {
        const phdCount = r.phdStudents || 0;
        const mastersCount = r.mastersStudents || 0;
        const ugCount = r.ugStudents || 0;
        const totalStudents = phdCount + mastersCount + ugCount;
        
        let studentsDisplay = '';
        if (totalStudents > 0) {
            studentsDisplay = `
                <div style="margin-top: 8px;">
                    <strong>Students Guided:</strong> 
                    <span style="background: #eef2ff; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">
                        Total: ${totalStudents}
                    </span>
                    ${phdCount > 0 ? `<span style="background: #fef3c7; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">PhD: ${phdCount}</span>` : ''}
                    ${mastersCount > 0 ? `<span style="background: #dcfce7; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">Masters: ${mastersCount}</span>` : ''}
                    ${ugCount > 0 ? `<span style="background: #e0f2fe; padding: 2px 8px; border-radius: 12px;">UG: ${ugCount}</span>` : ''}
                </div>
            `;
        }
        
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(r.title || 'Research Project')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Role:</strong> ${escapeHtml(r.role || 'N/A')}</p>
                    <p style="margin-bottom: 5px;"><strong>Duration:</strong> ${escapeHtml(r.startYear || '')} - ${escapeHtml(r.endYear || 'Present')}</p>
                    ${r.fundingDetails ? `<p style="margin-bottom: 5px;"><strong>Funding:</strong> ${escapeHtml(r.fundingDetails)}</p>` : ''}
                    ${studentsDisplay}
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editResearch(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteResearch(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editResearch(index) {
    const r = profileData.researchProjects[index];
    if (!r) return;
    
    document.getElementById('researchTitle').value = r.title || '';
    document.getElementById('fundingDetails').value = r.fundingDetails || '';
    document.getElementById('phdStudents').value = r.phdStudents || '';
    document.getElementById('mastersStudents').value = r.mastersStudents || '';
    document.getElementById('ugStudents').value = r.ugStudents || '';
    document.getElementById('projectStartYear').value = r.startYear || '';
    document.getElementById('projectEndYear').value = r.endYear || '';
    document.getElementById('projectRole').value = r.role || '';
    
    editIndex = index;
    editType = 'research';
    showResearchForm();
}

async function deleteResearch(index) {
    if (confirm("Are you sure you want to delete this research project?")) {
        profileData.researchProjects.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayResearchProjects();
            showMessage("Research project deleted", "success");
        }
    }
}

// ============================================
// PUBLICATIONS
// ============================================

function showPublicationForm() {
    hideElement('publicationsEmptyMessage');
    hideElement('publicationsList');
    showElement('publicationForm');
    editIndex = -1;
    editType = 'publication';
    clearPublicationForm();
}

function cancelPublication() {
    hideElement('publicationForm');
    
    if (profileData.publications?.length > 0) {
        showElement('publicationsList');
    } else {
        showElement('publicationsEmptyMessage');
    }
    
    clearPublicationForm();
}

function clearPublicationForm() {
    document.getElementById('paperTitle').value = '';
    document.getElementById('journalName').value = '';
    document.getElementById('publicationDate').value = '';
    document.getElementById('doiLink').value = '';
    document.getElementById('authorPosition').value = '';
}

async function savePublication() {
    const publication = {
        title: document.getElementById('paperTitle')?.value?.trim() || '',
        journal: document.getElementById('journalName')?.value?.trim() || '',
        date: document.getElementById('publicationDate')?.value || '',
        doi: document.getElementById('doiLink')?.value?.trim() || '',
        authorPosition: document.getElementById('authorPosition')?.value || '',
        id: Date.now().toString()
    };
    
    if (!publication.title) {
        showMessage("Paper Title is required", "error");
        document.getElementById('paperTitle')?.classList.add('error');
        return;
    }
    
    if (!publication.journal) {
        showMessage("Journal/Conference Name is required", "error");
        document.getElementById('journalName')?.classList.add('error');
        return;
    }
    
    if (!publication.date) {
        showMessage("Publication Date is required", "error");
        document.getElementById('publicationDate')?.classList.add('error');
        return;
    }
    
    if (!publication.authorPosition) {
        showMessage("Author Position is required", "error");
        document.getElementById('authorPosition')?.classList.add('error');
        return;
    }
    
    document.getElementById('paperTitle')?.classList.remove('error');
    document.getElementById('journalName')?.classList.remove('error');
    document.getElementById('publicationDate')?.classList.remove('error');
    document.getElementById('authorPosition')?.classList.remove('error');
    
    if (!profileData.publications) profileData.publications = [];
    
    if (editIndex >= 0 && editType === 'publication') {
        profileData.publications[editIndex] = { ...profileData.publications[editIndex], ...publication };
    } else {
        profileData.publications.push(publication);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayPublications();
        cancelPublication();
        showMessage("Publication saved successfully!", "success");
    }
}

function displayPublications() {
    const list = document.getElementById('publicationsList');
    const empty = document.getElementById('publicationsEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.publications || profileData.publications.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Publications</h3>';
    profileData.publications.forEach((p, index) => {
        const date = p.date ? new Date(p.date).toLocaleDateString() : 'N/A';
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(p.title || '')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Journal:</strong> ${escapeHtml(p.journal || '')}</p>
                    <p style="margin-bottom: 5px;"><strong>Date:</strong> ${date}</p>
                    <p style="margin-bottom: 5px;"><strong>Author Position:</strong> ${escapeHtml(p.authorPosition || 'N/A')}</p>
                    ${p.doi ? `<p style="margin-bottom: 5px;"><strong>DOI:</strong> <a href="${p.doi}" target="_blank">${escapeHtml(p.doi)}</a></p>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editPublication(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deletePublication(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editPublication(index) {
    const p = profileData.publications[index];
    if (!p) return;
    
    document.getElementById('paperTitle').value = p.title || '';
    document.getElementById('journalName').value = p.journal || '';
    document.getElementById('publicationDate').value = p.date || '';
    document.getElementById('doiLink').value = p.doi || '';
    document.getElementById('authorPosition').value = p.authorPosition || '';
    
    editIndex = index;
    editType = 'publication';
    showPublicationForm();
}

async function deletePublication(index) {
    if (confirm("Are you sure you want to delete this publication?")) {
        profileData.publications.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayPublications();
            showMessage("Publication deleted", "success");
        }
    }
}

// ============================================
// PATENTS
// ============================================

function showPatentForm() {
    hideElement('patentsEmptyMessage');
    hideElement('patentsList');
    showElement('patentForm');
    editIndex = -1;
    editType = 'patent';
    clearPatentForm();
}

function cancelPatent() {
    hideElement('patentForm');
    
    if (profileData.patents?.length > 0) {
        showElement('patentsList');
    } else {
        showElement('patentsEmptyMessage');
    }
    
    clearPatentForm();
}

function clearPatentForm() {
    document.getElementById('patentTitle').value = '';
    document.getElementById('patentNumber').value = '';
    document.getElementById('filingDate').value = '';
    document.getElementById('publishingDate').value = '';
    document.getElementById('patentStatus').value = '';
}

async function savePatent() {
    const patent = {
        title: document.getElementById('patentTitle')?.value?.trim() || '',
        number: document.getElementById('patentNumber')?.value?.trim() || '',
        filingDate: document.getElementById('filingDate')?.value || '',
        publishingDate: document.getElementById('publishingDate')?.value || '',
        status: document.getElementById('patentStatus')?.value || '',
        id: Date.now().toString()
    };
    
    if (!patent.title) {
        showMessage("Patent Title is required", "error");
        document.getElementById('patentTitle')?.classList.add('error');
        return;
    }
    
    if (!patent.status) {
        showMessage("Status is required", "error");
        document.getElementById('patentStatus')?.classList.add('error');
        return;
    }
    
    document.getElementById('patentTitle')?.classList.remove('error');
    document.getElementById('patentStatus')?.classList.remove('error');
    
    if (!profileData.patents) profileData.patents = [];
    
    if (editIndex >= 0 && editType === 'patent') {
        profileData.patents[editIndex] = { ...profileData.patents[editIndex], ...patent };
    } else {
        profileData.patents.push(patent);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayPatents();
        cancelPatent();
        showMessage("Patent saved successfully!", "success");
    }
}

function displayPatents() {
    const list = document.getElementById('patentsList');
    const empty = document.getElementById('patentsEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.patents || profileData.patents.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Patents</h3>';
    profileData.patents.forEach((p, index) => {
        const filingDate = p.filingDate ? new Date(p.filingDate).toLocaleDateString() : 'N/A';
        const publishingDate = p.publishingDate ? new Date(p.publishingDate).toLocaleDateString() : 'N/A';
        
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(p.title || '')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Status:</strong> ${escapeHtml(p.status || 'N/A')}</p>
                    ${p.number ? `<p style="margin-bottom: 5px;"><strong>Patent No:</strong> ${escapeHtml(p.number)}</p>` : ''}
                    <p style="margin-bottom: 5px;"><strong>Filed:</strong> ${filingDate}</p>
                    ${p.publishingDate ? `<p style="margin-bottom: 5px;"><strong>Published:</strong> ${publishingDate}</p>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editPatent(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deletePatent(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editPatent(index) {
    const p = profileData.patents[index];
    if (!p) return;
    
    document.getElementById('patentTitle').value = p.title || '';
    document.getElementById('patentNumber').value = p.number || '';
    document.getElementById('filingDate').value = p.filingDate || '';
    document.getElementById('publishingDate').value = p.publishingDate || '';
    document.getElementById('patentStatus').value = p.status || '';
    
    editIndex = index;
    editType = 'patent';
    showPatentForm();
}

async function deletePatent(index) {
    if (confirm("Are you sure you want to delete this patent?")) {
        profileData.patents.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayPatents();
            showMessage("Patent deleted", "success");
        }
    }
}

// ============================================
// AWARDS
// ============================================

function showAwardForm() {
    hideElement('awardsEmptyMessage');
    hideElement('awardsList');
    showElement('awardForm');
    editIndex = -1;
    editType = 'award';
    clearAwardForm();
}

function cancelAward() {
    hideElement('awardForm');
    
    if (profileData.awards?.length > 0) {
        showElement('awardsList');
    } else {
        showElement('awardsEmptyMessage');
    }
    
    clearAwardForm();
}

function clearAwardForm() {
    document.getElementById('awardTitle').value = '';
    document.getElementById('awardOrganization').value = '';
    document.getElementById('awardYear').value = '';
    document.getElementById('awardDescription').value = '';
}

async function saveAward() {
    const award = {
        title: document.getElementById('awardTitle')?.value?.trim() || '',
        organization: document.getElementById('awardOrganization')?.value?.trim() || '',
        year: document.getElementById('awardYear')?.value || '',
        description: document.getElementById('awardDescription')?.value?.trim() || '',
        id: Date.now().toString()
    };
    
    if (!award.title) {
        showMessage("Award Title is required", "error");
        document.getElementById('awardTitle')?.classList.add('error');
        return;
    }
    
    if (!award.organization) {
        showMessage("Awarding Organization is required", "error");
        document.getElementById('awardOrganization')?.classList.add('error');
        return;
    }
    
    if (!award.year) {
        showMessage("Year is required", "error");
        document.getElementById('awardYear')?.classList.add('error');
        return;
    }
    
    document.getElementById('awardTitle')?.classList.remove('error');
    document.getElementById('awardOrganization')?.classList.remove('error');
    document.getElementById('awardYear')?.classList.remove('error');
    
    if (!profileData.awards) profileData.awards = [];
    
    if (editIndex >= 0 && editType === 'award') {
        profileData.awards[editIndex] = { ...profileData.awards[editIndex], ...award };
    } else {
        profileData.awards.push(award);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayAwards();
        cancelAward();
        showMessage("Award saved successfully!", "success");
    }
}

function displayAwards() {
    const list = document.getElementById('awardsList');
    const empty = document.getElementById('awardsEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.awards || profileData.awards.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Awards</h3>';
    profileData.awards.forEach((a, index) => {
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(a.title || '')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Awarded by:</strong> ${escapeHtml(a.organization || '')}</p>
                    <p style="margin-bottom: 5px;"><strong>Year:</strong> ${escapeHtml(a.year || '')}</p>
                    ${a.description ? `<p style="margin-bottom: 5px;"><strong>Description:</strong> ${escapeHtml(a.description)}</p>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editAward(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteAward(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editAward(index) {
    const a = profileData.awards[index];
    if (!a) return;
    
    document.getElementById('awardTitle').value = a.title || '';
    document.getElementById('awardOrganization').value = a.organization || '';
    document.getElementById('awardYear').value = a.year || '';
    document.getElementById('awardDescription').value = a.description || '';
    
    editIndex = index;
    editType = 'award';
    showAwardForm();
}

async function deleteAward(index) {
    if (confirm("Are you sure you want to delete this award?")) {
        profileData.awards.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayAwards();
            showMessage("Award deleted", "success");
        }
    }
}

// ============================================
// CERTIFICATES
// ============================================

function showCertificateForm() {
    hideElement('certificatesEmptyMessage');
    hideElement('certificatesList');
    showElement('certificateForm');
    editIndex = -1;
    editType = 'certificate';
    clearCertificateForm();
}

function cancelCertificate() {
    hideElement('certificateForm');
    
    if (profileData.certificates?.length > 0) {
        showElement('certificatesList');
    } else {
        showElement('certificatesEmptyMessage');
    }
    
    clearCertificateForm();
}

function clearCertificateForm() {
    document.getElementById('certificateTitle').value = '';
    document.getElementById('issuingOrganization').value = '';
    document.getElementById('certificateIssueDate').value = '';
    document.getElementById('certificateExpiryDate').value = '';
}

async function saveCertificate() {
    const certificate = {
        title: document.getElementById('certificateTitle')?.value?.trim() || '',
        organization: document.getElementById('issuingOrganization')?.value?.trim() || '',
        issueDate: document.getElementById('certificateIssueDate')?.value || '',
        expiryDate: document.getElementById('certificateExpiryDate')?.value || null,
        id: Date.now().toString()
    };
    
    if (!certificate.title) {
        showMessage("Certificate Title is required", "error");
        document.getElementById('certificateTitle')?.classList.add('error');
        return;
    }
    
    if (!certificate.organization) {
        showMessage("Issuing Organization is required", "error");
        document.getElementById('issuingOrganization')?.classList.add('error');
        return;
    }
    
    if (!certificate.issueDate) {
        showMessage("Issue Date is required", "error");
        document.getElementById('certificateIssueDate')?.classList.add('error');
        return;
    }
    
    document.getElementById('certificateTitle')?.classList.remove('error');
    document.getElementById('issuingOrganization')?.classList.remove('error');
    document.getElementById('certificateIssueDate')?.classList.remove('error');
    
    if (!profileData.certificates) profileData.certificates = [];
    
    if (editIndex >= 0 && editType === 'certificate') {
        profileData.certificates[editIndex] = { ...profileData.certificates[editIndex], ...certificate };
    } else {
        profileData.certificates.push(certificate);
    }
    
    const saved = await saveToFirebase();
    if (saved) {
        displayCertificates();
        cancelCertificate();
        showMessage("Certificate saved successfully!", "success");
    }
}

function displayCertificates() {
    const list = document.getElementById('certificatesList');
    const empty = document.getElementById('certificatesEmptyMessage');
    
    if (!list || !empty) return;
    
    if (!profileData.certificates || profileData.certificates.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 20px;">Your Certificates</h3>';
    profileData.certificates.forEach((c, index) => {
        const issueDate = c.issueDate ? new Date(c.issueDate).toLocaleDateString() : 'N/A';
        const expiryDate = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'No expiry';
        
        html += `
            <div class="entry-item">
                <div class="entry-content">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(c.title || '')}</h4>
                    <p style="margin-bottom: 5px;"><strong>Issued by:</strong> ${escapeHtml(c.organization || '')}</p>
                    <p style="margin-bottom: 5px;"><strong>Issue Date:</strong> ${issueDate}</p>
                    <p style="margin-bottom: 5px;"><strong>Expiry Date:</strong> ${expiryDate}</p>
                </div>
                <div class="entry-actions">
                    <button class="btn-action edit" onclick="editCertificate(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteCertificate(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
}

function editCertificate(index) {
    const c = profileData.certificates[index];
    if (!c) return;
    
    document.getElementById('certificateTitle').value = c.title || '';
    document.getElementById('issuingOrganization').value = c.organization || '';
    document.getElementById('certificateIssueDate').value = c.issueDate || '';
    document.getElementById('certificateExpiryDate').value = c.expiryDate || '';
    
    editIndex = index;
    editType = 'certificate';
    showCertificateForm();
}

async function deleteCertificate(index) {
    if (confirm("Are you sure you want to delete this certificate?")) {
        profileData.certificates.splice(index, 1);
        const saved = await saveToFirebase();
        if (saved) {
            displayCertificates();
            showMessage("Certificate deleted", "success");
        }
    }
}

// ============================================
// SAVED DATA VIEWER
// ============================================

function displaySavedData() {
    const container = document.getElementById('savedDataContainer');
    if (!container) return;
    
    if (!profileData || Object.keys(profileData).length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <i class="fas fa-database" style="font-size: 48px; color: #9ca3af; margin-bottom: 20px;"></i>
                <h4 style="margin-bottom: 10px; color: #374151;">No Saved Data</h4>
                <p style="color: #6b7280;">Start adding profile information to see it here.</p>
            </div>
        `;
        return;
    }
    
    const stats = {
        personal: profileData.personalInfo && Object.keys(profileData.personalInfo).length > 0 ? 1 : 0,
        qualifications: profileData.qualifications?.length || 0,
        research: profileData.researchProjects?.length || 0,
        publications: profileData.publications?.length || 0,
        patents: profileData.patents?.length || 0,
        awards: profileData.awards?.length || 0,
        certificates: profileData.certificates?.length || 0,
        memberships: profileData.professionalMemberships?.length || 0,
        workshops: profileData.workshops?.length || 0,
        totalEntries: 0
    };
    
    stats.totalEntries = Object.values(stats).reduce((a, b) => a + b, 0) - stats.personal;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 15px; color: var(--dark-gray);">Profile Summary</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="background: white; padding: 15px; border-radius: var(--border-radius);">
                    <div style="font-size: 24px; font-weight: bold; color: var(--primary-blue);">${stats.totalEntries}</div>
                    <div style="font-size: 13px; color: var(--medium-gray);">Total Entries</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: var(--border-radius);">
                    <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.workshops}</div>
                    <div style="font-size: 13px; color: var(--medium-gray);">Workshops</div>
                </div>
            </div>
        </div>
        
        <div style="background: white; border-radius: var(--border-radius); overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: var(--light-gray);">
                    <th style="padding: 12px; text-align: left;">Section</th>
                    <th style="padding: 12px; text-align: center;">Count</th>
                    <th style="padding: 12px; text-align: center;">Status</th>
                 </tr>
    `;
    
    const sections = [
        { name: 'Personal Info', count: stats.personal, icon: 'fa-user' },
        { name: 'Qualifications', count: stats.qualifications, icon: 'fa-certificate' },
        { name: 'Research Projects', count: stats.research, icon: 'fa-flask' },
        { name: 'Publications', count: stats.publications, icon: 'fa-file-alt' },
        { name: 'Patents', count: stats.patents, icon: 'fa-lightbulb' },
        { name: 'Awards', count: stats.awards, icon: 'fa-award' },
        { name: 'Certificates', count: stats.certificates, icon: 'fa-file-certificate' },
        { name: 'Professional Memberships', count: stats.memberships, icon: 'fa-id-card' },
        { name: 'Workshops/FDP/STTP', count: stats.workshops, icon: 'fa-chalkboard-teacher' }
    ];
    
    sections.forEach(section => {
        html += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">
                    <i class="fas ${section.icon}" style="color: var(--primary-blue); margin-right: 10px;"></i>
                    ${section.name}
                 </td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${section.count}</td>
                <td style="padding: 12px; text-align: center;">
                    ${section.count > 0 
                        ? '<span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Saved</span>' 
                        : '<span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Pending</span>'}
                 </td>
             </tr>
        `;
    });
    
    html += `
             </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: var(--light-blue); border-radius: var(--border-radius);">
            <p style="margin-bottom: 5px; color: var(--primary-blue); font-weight: 600;">
                <i class="fas fa-clock"></i> Last Updated
            </p>
            <p style="color: var(--dark-gray);">
                ${profileData.lastUpdated ? new Date(profileData.lastUpdated).toLocaleString() : 'Not saved yet'}
            </p>
        </div>
    `;
    
    container.innerHTML = html;
}

function refreshSavedData() {
    displaySavedData();
    showMessage("Data refreshed", "success");
}

function downloadProfileData() {
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `faculty_profile_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showMessage("Profile data downloaded as JSON", "success");
}

function syncProfileData() {
    saveToFirebase().then(() => {
        showMessage("Profile synced with Firebase", "success");
        refreshSavedData();
    });
}

// ============================================
// PDF EXPORT
// ============================================

function exportToPDF(type = 'complete') {
    showMessage("Generating PDF...", "info");
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        doc.setProperties({
            title: 'Faculty Profile',
            subject: 'Academic Profile',
            author: profileData.personalInfo?.fullName || 'Faculty Member',
            creator: 'EduPortal'
        });
        
        doc.setFont('helvetica');
        let yPos = 20;
        let pageHeight = doc.internal.pageSize.height;
        
        doc.setFontSize(20);
        doc.setTextColor(26, 86, 219);
        doc.text('FACULTY PROFILE', 105, yPos, { align: 'center' });
        yPos += 15;
        
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Personal Information', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        
        const personal = profileData.personalInfo || {};
        const personalLines = [
            `Name: ${personal.fullName || 'Not provided'}`,
            `Email: ${personal.email || 'Not provided'}`,
            `Phone: ${personal.phone || 'Not provided'}`,
            `Date of Birth: ${personal.dob || 'Not provided'}`,
            `Gender: ${personal.gender || 'Not provided'}`,
            `Address: ${personal.address || 'Not provided'}`,
            `Employee ID: ${profileData.employeeId || 'Not provided'}`,
            `Department: ${profileData.department || 'Not provided'}`
        ];
        
        personalLines.forEach(line => {
            if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
            doc.text(line, 25, yPos);
            yPos += 7;
        });
        
        yPos += 5;
        
        if (profileData.qualifications && profileData.qualifications.length > 0) {
            if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.text('Qualifications', 20, yPos);
            yPos += 10;
            doc.setFontSize(11);
            profileData.qualifications.forEach((q, i) => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                doc.text(`${i + 1}. ${q.degreeName || ''} - ${q.university || ''} (${q.completionYear || ''})`, 25, yPos);
                yPos += 6;
            });
            yPos += 5;
        }
        
        if (profileData.researchProjects && profileData.researchProjects.length > 0) {
            if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.text('Research Projects', 20, yPos);
            yPos += 10;
            doc.setFontSize(11);
            profileData.researchProjects.forEach((r, i) => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                const totalStudents = (r.phdStudents || 0) + (r.mastersStudents || 0) + (r.ugStudents || 0);
                doc.text(`${i + 1}. ${r.title || ''}`, 25, yPos);
                yPos += 5;
                doc.text(`   Role: ${r.role || 'N/A'}`, 25, yPos);
                yPos += 5;
                doc.text(`   Duration: ${r.startYear || ''} - ${r.endYear || 'Present'}`, 25, yPos);
                yPos += 5;
                if (totalStudents > 0) {
                    doc.text(`   Students Guided: ${totalStudents} (PhD: ${r.phdStudents || 0}, Masters: ${r.mastersStudents || 0}, UG: ${r.ugStudents || 0})`, 25, yPos);
                    yPos += 5;
                }
                yPos += 4;
            });
            yPos += 5;
        }
        
        if (profileData.publications && profileData.publications.length > 0) {
            if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.text('Publications', 20, yPos);
            yPos += 10;
            doc.setFontSize(11);
            profileData.publications.forEach((p, i) => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                doc.text(`${i + 1}. ${p.title || ''} - ${p.journal || ''} (${p.date || 'N/A'})`, 25, yPos);
                yPos += 6;
            });
            yPos += 5;
        }
        
        if (profileData.professionalMemberships && profileData.professionalMemberships.length > 0) {
            if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.text('Professional Memberships', 20, yPos);
            yPos += 10;
            doc.setFontSize(11);
            profileData.professionalMemberships.forEach((m, i) => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                const validFrom = m.validFrom ? new Date(m.validFrom).toLocaleDateString() : 'N/A';
                const validUntil = m.validUntil ? new Date(m.validUntil).toLocaleDateString() : 'Lifetime';
                doc.text(`${i + 1}. ${m.organizationName || ''} - Member No: ${m.membershipNumber || ''}`, 25, yPos);
                yPos += 5;
                doc.text(`   Valid: ${validFrom} to ${validUntil} (${m.status || 'Active'})`, 25, yPos);
                yPos += 6;
            });
            yPos += 5;
        }
        
        if (profileData.workshops && profileData.workshops.length > 0) {
            if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.text('Workshops / FDP / STTP', 20, yPos);
            yPos += 10;
            doc.setFontSize(11);
            profileData.workshops.forEach((w, i) => {
                if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                const type = w.type === 'attended' ? 'Attended' : 'Organized';
                const category = w.category || 'Workshop';
                const categoryMap = {
                    'workshop': 'Workshop',
                    'fdp': 'FDP',
                    'sttp': 'STTP',
                    'seminar': 'Seminar',
                    'conference': 'Conference',
                    'other': 'Other'
                };
                const categoryText = categoryMap[category] || 'Workshop';
                doc.text(`${i + 1}. ${w.title || ''} (${type} - ${categoryText})`, 25, yPos);
                yPos += 5;
                if (w.type === 'attended') {
                    doc.text(`   Institute: ${w.institute || ''}, Mode: ${w.mode || 'N/A'}`, 25, yPos);
                    yPos += 5;
                } else {
                    doc.text(`   Organized For: ${w.organizedFor || ''}, Role: ${w.role || ''}`, 25, yPos);
                    yPos += 5;
                    if (w.funding) {
                        doc.text(`   Funding: ${w.funding}`, 25, yPos);
                        yPos += 5;
                    }
                }
                yPos += 4;
            });
        }
        
        const fileName = `Faculty_Profile_${profileData.personalInfo?.fullName?.replace(/\s+/g, '_') || 'Faculty'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        showMessage("PDF exported successfully!", "success");
        showPDFPreview(doc);
        
    } catch (error) {
        console.error("PDF export error:", error);
        showMessage("Error generating PDF: " + error.message, "error");
    }
}

function showPDFPreview(doc) {
    const modal = document.getElementById('pdfPreviewModal');
    const body = document.getElementById('pdfPreviewBody');
    
    if (modal && body) {
        body.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-file-pdf" style="font-size: 64px; color: #f05252; margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 20px;">PDF Generated Successfully!</h3>
                <p style="margin-bottom: 30px; color: #666;">Your profile has been exported as a PDF file.</p>
                <p style="margin-bottom: 10px;"><strong>File:</strong> Faculty_Profile_${new Date().toISOString().split('T')[0]}.pdf</p>
                <p><strong>Status:</strong> Downloaded automatically</p>
            </div>
        `;
        modal.style.display = 'flex';
    }
}

function closePDFPreview() {
    const modal = document.getElementById('pdfPreviewModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function updateProgress() {
    try {
        const sections = [
            !!(profileData.personalInfo?.fullName && profileData.personalInfo?.email),
            !!(profileData.employeeId && profileData.department),
            (profileData.qualifications?.length || 0) > 0,
            (profileData.researchProjects?.length || 0) > 0,
            (profileData.publications?.length || 0) > 0,
            (profileData.patents?.length || 0) > 0,
            (profileData.awards?.length || 0) > 0,
            (profileData.certificates?.length || 0) > 0,
            (profileData.professionalMemberships?.length || 0) > 0,
            (profileData.workshops?.length || 0) > 0
        ];
        
        const completed = sections.filter(Boolean).length;
        const percentage = Math.round((completed / sections.length) * 100);
        
        document.querySelectorAll('.progress-fill').forEach(bar => {
            bar.style.width = percentage + '%';
        });
        
        document.querySelectorAll('.progress-percentage, .completion-percentage').forEach(el => {
            el.textContent = percentage + '%';
        });
        
        if (DOM.sidebarCompletion) {
            DOM.sidebarCompletion.textContent = `${percentage}%`;
        }
        
        if (DOM.sidebarProgressFill) {
            DOM.sidebarProgressFill.style.width = percentage + '%';
        }
        
        updateStatusIndicators();
    } catch (error) {
        console.error("Error updating progress:", error);
    }
}

function updateStatusIndicators() {
    try {
        const sections = {
            'personal-info': !!(profileData.personalInfo?.fullName && profileData.personalInfo?.email),
            'qualifications': (profileData.qualifications?.length || 0) > 0,
            'research-guidance': (profileData.researchProjects?.length || 0) > 0,
            'publications': (profileData.publications?.length || 0) > 0,
            'patents': (profileData.patents?.length || 0) > 0,
            'awards': (profileData.awards?.length || 0) > 0,
            'certificates': (profileData.certificates?.length || 0) > 0 || (profileData.professionalMemberships?.length || 0) > 0,
            'workshops': (profileData.workshops?.length || 0) > 0
        };
        
        for (const [sectionId, isComplete] of Object.entries(sections)) {
            const section = document.getElementById(sectionId);
            if (section) {
                const indicator = section.querySelector('.status-indicator');
                if (indicator) {
                    indicator.textContent = isComplete ? 'Complete' : 'Incomplete';
                    indicator.className = `status-indicator ${isComplete ? 'complete' : 'incomplete'}`;
                }
            }
        }
    } catch (error) {
        console.error("Error updating status indicators:", error);
    }
}

function showSuccessMessage() {
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'flex';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }
}

function showMessage(text, type = "info") {
    if (typeof window.showFirebaseMessage === 'function') {
        window.showFirebaseMessage(text, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${text}`);
        
        const existing = document.querySelectorAll('.dashboard-message');
        existing.forEach(msg => msg.remove());
        
        const msg = document.createElement('div');
        msg.className = 'dashboard-message';
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'success' ? '#10b981' : 
                         type === 'error' ? '#ef4444' : 
                         type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
        `;
        msg.textContent = text;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }, 3000);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showElement(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.style.display = 'block';
}

function hideElement(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.style.display = 'none';
}

async function clearAllData() {
    if (!window.firebaseAuth?.currentUser) {
        showMessage("No user logged in", "error");
        return;
    }
    
    if (confirm("⚠️ Are you sure you want to DELETE ALL your profile data? This action cannot be undone!")) {
        const userId = window.firebaseAuth.currentUser.uid;
        
        profileData = {
            personalInfo: {},
            qualifications: [],
            researchProjects: [],
            publications: [],
            patents: [],
            awards: [],
            certificates: [],
            professionalMemberships: [],
            workshops: [],
            extraFields: {},
            employeeId: '',
            department: '',
            lastUpdated: new Date().toISOString()
        };
        
        document.getElementById('fullName').value = '';
        document.getElementById('dob').value = '';
        document.getElementById('gender').value = '';
        document.getElementById('email').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('address').value = '';
        document.getElementById('employeeId').value = '';
        document.getElementById('department').value = '';
        
        displayQualifications();
        displayResearchProjects();
        displayPublications();
        displayPatents();
        displayAwards();
        displayCertificates();
        displayMemberships();
        displayWorkshops();
        
        if (window.firebaseDB) {
            try {
                await window.firebaseDB.collection('facultyProfiles').doc(userId).delete();
                await window.firebaseDB.collection('faculty').doc(userId).delete();
                console.log("✅ Firestore data cleared for user:", userId);
            } catch (error) {
                console.error("Error clearing Firebase data:", error);
            }
        }
        
        updateProgress();
        displaySavedData();
        showMessage("All your profile data has been cleared", "success");
    }
}

async function submitProfile() {
    if (!isFirebaseReady()) {
        showMessage("Cannot submit: Not connected to Firebase", "error");
        return;
    }
    
    const currentUser = window.firebaseAuth.currentUser;
    if (!currentUser) {
        showMessage("Please login to submit profile", "error");
        return;
    }
    
    const hasPersonalInfo = !!(profileData.personalInfo?.fullName && profileData.personalInfo?.email);
    const hasEmployeeId = !!(profileData.employeeId && profileData.department);
    const hasQualification = (profileData.qualifications?.length || 0) > 0;
    
    if (!hasPersonalInfo || !hasEmployeeId || !hasQualification) {
        showMessage("Please complete Personal Info, Employee Details, and at least one Qualification", "warning");
        return;
    }
    
    if (confirm("Submit your complete profile for admin review?")) {
        try {
            const saved = await saveToFirebase();
            if (saved && isFirebaseReady()) {
                const userId = currentUser.uid;
                
                await window.firebaseDB.collection('faculty').doc(userId).set({
                    fullName: profileData.personalInfo?.fullName || '',
                    department: profileData.department || '',
                    employeeId: profileData.employeeId || '',
                    email: currentUser.email,
                    profileComplete: false,
                    submissionStatus: 'pending',
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: userId
                }, { merge: true });
                
                await window.firebaseDB.collection('facultyProfiles').doc(userId).set({
                    profileComplete: false,
                    submissionStatus: 'pending',
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                showMessage("Profile submitted for admin review!", "success");
            }
        } catch (error) {
            console.error("Submit error:", error);
            showMessage("Failed to submit profile: " + error.message, "error");
        }
    }
}

// ============================================
// NAVIGATION & EVENT LISTENERS
// ============================================

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.getAttribute('data-section');
            
            if (section === 'export') {
                showSection('export-section');
                return;
            }
            
            if (section === 'settings') {
                showSection('settings-section');
                setTimeout(() => displaySavedData(), 100);
                return;
            }
            
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    if (!sectionId) return;
    
    currentSection = sectionId;
    
    document.querySelectorAll('.section-card, #dashboard-overview, .progress-tracker, #export-section, #settings-section').forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    if (sectionId === 'dashboard') {
        const dashboardOverview = document.getElementById('dashboard-overview');
        const progressTracker = document.querySelector('.progress-tracker');
        
        if (dashboardOverview) dashboardOverview.style.display = 'block';
        if (progressTracker) progressTracker.style.display = 'block';
        
        document.querySelectorAll('.section-card').forEach(section => {
            if (section.id !== 'export-section' && section.id !== 'settings-section') {
                section.style.display = 'block';
            }
        });
    } else if (sectionId === 'export-section' || sectionId === 'settings-section') {
        const target = document.getElementById(sectionId);
        if (target) target.style.display = 'block';
    } else {
        const target = document.getElementById(sectionId);
        if (target) {
            target.style.display = 'block';
            
            const dashboardOverview = document.getElementById('dashboard-overview');
            const progressTracker = document.querySelector('.progress-tracker');
            
            if (dashboardOverview) dashboardOverview.style.display = 'block';
            if (progressTracker) progressTracker.style.display = 'block';
        }
    }
}

function setupEventListeners() {
    if (DOM.saveProfileBtn) {
        DOM.saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    if (DOM.sidebarSaveBtn) {
        DOM.sidebarSaveBtn.addEventListener('click', saveProfile);
    }
    
    if (DOM.clearAllBtn) {
        DOM.clearAllBtn.addEventListener('click', clearAllData);
    }
    
    if (DOM.submitProfileBtn) {
        DOM.submitProfileBtn.addEventListener('click', submitProfile);
    }
    
    if (DOM.exportPdfBtn) {
        DOM.exportPdfBtn.addEventListener('click', function() {
            exportToPDF('complete');
        });
    }
    
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutUser);
    }
    
    if (DOM.notificationIcon) {
        DOM.notificationIcon.addEventListener('click', function() {
            if (DOM.notificationPanel) {
                DOM.notificationPanel.style.display = DOM.notificationPanel.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
    
    if (DOM.notificationClose) {
        DOM.notificationClose.addEventListener('click', function() {
            if (DOM.notificationPanel) {
                DOM.notificationPanel.style.display = 'none';
            }
        });
    }
    
    if (DOM.scrollToTop) {
        DOM.scrollToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        window.addEventListener('scroll', () => {
            const show = window.scrollY > 300;
            if (DOM.scrollToTop) {
                DOM.scrollToTop.style.opacity = show ? '1' : '0';
                DOM.scrollToTop.style.visibility = show ? 'visible' : 'hidden';
            }
        });
    }
}

async function saveProfile() {
    profileData.employeeId = document.getElementById('employeeId')?.value?.trim() || '';
    profileData.department = document.getElementById('department')?.value?.trim() || '';
    
    const saved = await saveToFirebase();
    if (saved) {
        showSuccessMessage();
        showMessage("Profile saved successfully!", "success");
    }
}

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================

window.savePersonalInfo = savePersonalInfo;
window.showExtraPersonalField = showExtraPersonalField;

window.showQualificationForm = showQualificationForm;
window.cancelQualification = cancelQualification;
window.saveQualification = saveQualification;
window.editQualification = editQualification;
window.deleteQualification = deleteQualification;

window.showResearchForm = showResearchForm;
window.cancelResearch = cancelResearch;
window.saveResearch = saveResearch;
window.editResearch = editResearch;
window.deleteResearch = deleteResearch;

window.showPublicationForm = showPublicationForm;
window.cancelPublication = cancelPublication;
window.savePublication = savePublication;
window.editPublication = editPublication;
window.deletePublication = deletePublication;

window.showPatentForm = showPatentForm;
window.cancelPatent = cancelPatent;
window.savePatent = savePatent;
window.editPatent = editPatent;
window.deletePatent = deletePatent;

window.showAwardForm = showAwardForm;
window.cancelAward = cancelAward;
window.saveAward = saveAward;
window.editAward = editAward;
window.deleteAward = deleteAward;

window.showCertificateForm = showCertificateForm;
window.cancelCertificate = cancelCertificate;
window.saveCertificate = saveCertificate;
window.editCertificate = editCertificate;
window.deleteCertificate = deleteCertificate;

window.showMembershipForm = showMembershipForm;
window.cancelMembership = cancelMembership;
window.saveMembership = saveMembership;
window.editMembership = editMembership;
window.deleteMembership = deleteMembership;

window.showWorkshopForm = showWorkshopForm;
window.cancelWorkshop = cancelWorkshop;
window.saveWorkshop = saveWorkshop;
window.editWorkshop = editWorkshop;
window.deleteWorkshop = deleteWorkshop;
window.selectWorkshopType = selectWorkshopType;

window.addExtraQualificationField = addExtraQualificationField;
window.addExtraResearchField = addExtraResearchField;
window.addExtraPublicationField = addExtraPublicationField;
window.addExtraPatentField = addExtraPatentField;
window.addExtraAwardField = addExtraAwardField;
window.addExtraCertificateField = addExtraCertificateField;
window.addExtraWorkshopField = addExtraWorkshopField;
window.removeExtraField = removeExtraField;

window.exportToPDF = exportToPDF;
window.closePDFPreview = closePDFPreview;

window.refreshSavedData = refreshSavedData;
window.downloadProfileData = downloadProfileData;
window.syncProfileData = syncProfileData;
window.clearAllData = clearAllData;
window.logoutUser = logoutUser;

window.submitProfile = submitProfile;

window.onProfileDataLoaded = function(data, isRealTime = false) {
    if (data) {
        console.log("📡 Profile data loaded from listener:", data);
        profileData = { ...profileData, ...data };
        populateForms();
        updateProgress();
        displaySavedData();
        
        if (isRealTime) {
            showMessage("Profile updated in real-time", "info");
        } else {
            showMessage("Profile data loaded", "success");
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================

if (!document.querySelector('#dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
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
}

function initialize() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("📄 DOMContentLoaded - initializing dashboard");
            initDashboard();
        });
    } else {
        console.log("📄 DOM already loaded - initializing dashboard");
        initDashboard();
    }
}

initialize();

console.log("✅ Dashboard.js loaded - COMPLETE FIXED VERSION with User Isolation");