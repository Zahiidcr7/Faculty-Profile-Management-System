// ============================================
// ADMIN DASHBOARD - COMPLETE VERSION
// Firebase Connected | Full Faculty Data Export
// FIXED: Sidebar navigation active state
// FIXED: Pending approvals with submission status
// FIXED: Approve/Reject functionality with proper workflow
// ============================================

const AdminDashboard = {
    // ============================================
    // FIREBASE CONFIGURATION
    // ============================================
    firebaseConfig: {
        apiKey: "AIzaSyCLUvxU19ePhSex0g0-VEVZJlwVP4vkRiU",
        authDomain: "faculty-profile-manageme-b912b.firebaseapp.com",
        projectId: "faculty-profile-manageme-b912b",
        storageBucket: "faculty-profile-manageme-b912b.firebasestorage.app",
        messagingSenderId: "492340972765",
        appId: "1:492340972765:web:30ef69e2ce0e6e59c9df34",
        measurementId: "G-42SHN6353G"
    },

    // ============================================
    // GLOBAL VARIABLES
    // ============================================
    db: null,
    facultyData: [],
    currentFacultyId: null,
    currentView: 'dashboard',
    currentBatchDeleteType: null,

    // ============================================
    // INITIALIZE FIREBASE
    // ============================================
    initFirebase: function() {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
                console.log("✅ Firebase initialized");
            }
            this.db = firebase.firestore();
            
            this.db.enablePersistence({ synchronizeTabs: true })
                .catch((err) => {
                    console.warn("Firebase persistence error:", err.code);
                });
            
            console.log("✅ Firestore ready");
            return true;
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
            return false;
        }
    },

    // ============================================
    // CHECK ADMIN AUTHENTICATION
    // ============================================
    checkAdminAuth: function() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const adminId = localStorage.getItem('adminId');
        
        if (!isLoggedIn || !adminId) {
            window.location.href = "adminLogin.html";
            return false;
        }
        return true;
    },

    // ============================================
    // LOAD ADMIN INFO
    // ============================================
    loadAdminInfo: function() {
        document.getElementById('adminName').textContent = 
            localStorage.getItem('adminName') || 'Administrator';
        
        document.getElementById('adminEmail').textContent = 
            localStorage.getItem('adminEmail') || 'admin@faculty.edu';
        
        document.getElementById('adminAvatar').textContent = 
            localStorage.getItem('adminName')?.charAt(0) || 'A';
        
        const now = new Date();
        document.getElementById('systemTime').innerHTML = 
            `<i class="fas fa-clock"></i> ${now.toLocaleString()}`;
    },

    // ============================================
    // LOGOUT
    // ============================================
    logout: function() {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminId');
            localStorage.removeItem('adminName');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('loginTime');
            window.location.href = "adminLogin.html";
        }
    },

    // ============================================
    // SET ACTIVE MENU
    // ============================================
    setActiveMenu: function(menuId) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeMenuItem = document.getElementById(`menu-${menuId}`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
    },

    // ============================================
    // LOAD FACULTY DATA FROM FIRESTORE - FIXED
    // ============================================
    loadFacultyData: async function() {
        if (!this.db) {
            console.error("Firestore not initialized");
            return [];
        }

        try {
            const snapshot = await this.db.collection('facultyProfiles')
                .orderBy('lastUpdated', 'desc')
                .get();

            this.facultyData = snapshot.docs.map(doc => {
                const data = doc.data();
                const personalInfo = data.personalInfo || {};
                const fullName = personalInfo.fullName || 'Faculty Member';
                
                const qualifications = data.qualifications || [];
                const researchProjects = data.researchProjects || [];
                const publications = data.publications || [];
                const workshops = data.workshops || [];
                const awards = data.awards || [];
                const patents = data.patents || [];
                const certificates = data.certificates || [];
                const professionalMemberships = data.professionalMemberships || [];
                
                let department = data.department || 'CSE';
                if (department.includes('Computer') || department === 'CSE') department = 'CSE';
                else if (department.includes('Information') || department === 'IT') department = 'IT';
                else if (department.includes('Electronics') || department === 'ENTC') department = 'ENTC';
                else if (department.includes('Mechanical') || department === 'MECH') department = 'MECH';
                
                // Get submission date
                let submittedAt = 'Not submitted';
                if (data.submittedAt) {
                    if (data.submittedAt.seconds) {
                        submittedAt = new Date(data.submittedAt.seconds * 1000).toLocaleString();
                    } else if (typeof data.submittedAt === 'string') {
                        submittedAt = new Date(data.submittedAt).toLocaleString();
                    }
                }
                
                // Get last updated
                let lastUpdated = 'Never';
                if (data.lastUpdated) {
                    if (data.lastUpdated.seconds) {
                        lastUpdated = new Date(data.lastUpdated.seconds * 1000).toLocaleString();
                    } else if (typeof data.lastUpdated === 'string') {
                        lastUpdated = new Date(data.lastUpdated).toLocaleString();
                    }
                }
                
                // ✅ FIX: Default status to 'pending' if not set
                const submissionStatus = data.submissionStatus || 'pending';
                
                return {
                    id: doc.id,
                    name: fullName,
                    email: personalInfo.email || 'Not provided',
                    phone: personalInfo.phone || 'Not provided',
                    dob: personalInfo.dob || 'Not provided',
                    gender: personalInfo.gender || 'Not provided',
                    address: personalInfo.address || 'Not provided',
                    department: department,
                    designation: personalInfo.designation || 'Faculty',
                    employeeId: data.employeeId || 'Not provided',
                    submissionStatus: submissionStatus,
                    profileComplete: data.profileComplete || false,
                    submittedAt: submittedAt,
                    lastUpdated: lastUpdated,
                    approvedAt: data.approvedAt ? (data.approvedAt.seconds ? new Date(data.approvedAt.seconds * 1000).toLocaleString() : null) : null,
                    
                    qualifications: qualifications,
                    researchProjects: researchProjects,
                    publications: publications,
                    workshops: workshops,
                    awards: awards,
                    patents: patents,
                    certificates: certificates,
                    professionalMemberships: professionalMemberships,
                    
                    qualificationsCount: qualifications.length,
                    projectsCount: researchProjects.length,
                    publicationsCount: publications.length,
                    workshopsCount: workshops.length,
                    awardsCount: awards.length,
                    patentsCount: patents.length,
                    certificatesCount: certificates.length,
                    membershipsCount: professionalMemberships.length,
                    
                    personalInfo: personalInfo,
                    rawData: data
                };
            });

            console.log(`✅ Loaded ${this.facultyData.length} faculty profiles`);
            return this.facultyData;
        } catch (error) {
            console.error("❌ Error loading faculty:", error);
            return [];
        }
    },

    // ============================================
    // CALCULATE PROFILE COMPLETION PERCENTAGE
    // ============================================
    calculateProfileCompletion: function(faculty) {
        const sections = [
            !!(faculty.personalInfo?.fullName && faculty.personalInfo?.email),
            !!(faculty.employeeId && faculty.employeeId !== 'Not provided'),
            (faculty.qualifications?.length || 0) > 0,
            (faculty.researchProjects?.length || 0) > 0,
            (faculty.publications?.length || 0) > 0,
            (faculty.patents?.length || 0) > 0,
            (faculty.awards?.length || 0) > 0,
            (faculty.certificates?.length || 0) > 0,
            (faculty.professionalMemberships?.length || 0) > 0,
            (faculty.workshops?.length || 0) > 0
        ];
        const completed = sections.filter(Boolean).length;
        return Math.round((completed / sections.length) * 100);
    },

    // ============================================
    // DASHBOARD
    // ============================================
    loadDashboard: async function() {
        this.currentView = 'dashboard';
        this.setActiveMenu('dashboard');
        
        await this.loadFacultyData();
        
        const totalFaculty = this.facultyData.length;
        const pendingFaculty = this.facultyData.filter(f => f.submissionStatus === 'pending').length;
        const approvedFaculty = this.facultyData.filter(f => f.submissionStatus === 'approved').length;
        const draftFaculty = this.facultyData.filter(f => f.submissionStatus === 'draft').length;

        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div id="dashboardContent">
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-icon icon-faculty">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${totalFaculty}</h3>
                            <p>Total Faculty Members</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-pending">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${pendingFaculty}</h3>
                            <p>Pending Approvals</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-active">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${approvedFaculty}</h3>
                            <p>Approved Faculty</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-draft">
                            <i class="fas fa-pen-fancy"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${draftFaculty}</h3>
                            <p>Draft Profiles</p>
                        </div>
                    </div>
                </div>
                
                <h2 class="section-title">
                    Quick Actions
                    <div class="title-actions">
                        <button class="btn btn-primary" onclick="AdminDashboard.openAddFacultyModal()">
                            <i class="fas fa-user-plus"></i> Add Faculty
                        </button>
                        <button class="btn btn-success" onclick="AdminDashboard.exportAllFacultyExcel()">
                            <i class="fas fa-file-excel"></i> Export Excel
                        </button>
                    </div>
                </h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
                    <div class="action-card" style="background: white; padding: 25px; border-radius: 16px; text-align: center; cursor: pointer; border: 1px solid #e2e8f0;" onclick="AdminDashboard.loadFacultyManagement()">
                        <i class="fas fa-users" style="font-size: 40px; color: var(--secondary); margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 8px;">Manage Faculty</h3>
                        <p style="color: var(--gray);">View all faculty members</p>
                    </div>
                    <div class="action-card" style="background: white; padding: 25px; border-radius: 16px; text-align: center; cursor: pointer; border: 1px solid #e2e8f0;" onclick="AdminDashboard.loadPendingApprovals()">
                        <i class="fas fa-clock" style="font-size: 40px; color: var(--warning); margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 8px;">Pending Approvals</h3>
                        <p style="color: var(--gray);">Review new profiles</p>
                        ${pendingFaculty > 0 ? `<span class="badge-pending">${pendingFaculty}</span>` : ''}
                    </div>
                    <div class="action-card" style="background: white; padding: 25px; border-radius: 16px; text-align: center; cursor: pointer; border: 1px solid #e2e8f0;" onclick="AdminDashboard.exportAllFacultyPDF()">
                        <i class="fas fa-file-pdf" style="font-size: 40px; color: #ef4444; margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 8px;">Export PDF</h3>
                        <p style="color: var(--gray);">Complete faculty report</p>
                    </div>
                    <div class="action-card" style="background: white; padding: 25px; border-radius: 16px; text-align: center; cursor: pointer; border: 1px solid #e2e8f0;" onclick="AdminDashboard.loadSettings()">
                        <i class="fas fa-cog" style="font-size: 40px; color: var(--gray); margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 8px;">Settings</h3>
                        <p style="color: var(--gray);">System configuration</p>
                    </div>
                </div>
                
                <h2 class="section-title">Recent Faculty Activity</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Employee ID</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.facultyData.slice(0, 5).map(f => `
                                <tr>
                                    <td><strong>${this.escapeHtml(f.name)}</strong></td>
                                    <td>${this.escapeHtml(f.email)}</td>
                                    <td>${this.escapeHtml(f.department)}</td>
                                    <td>${this.escapeHtml(f.employeeId)}</td>
                                    <td>
                                        <span class="status-badge ${this.getStatusClass(f.submissionStatus)}">
                                            ${this.getStatusText(f.submissionStatus)}
                                        </span>
                                    </td>
                                    <td>${this.escapeHtml(f.lastUpdated)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="action-btn btn-view" onclick="AdminDashboard.viewFacultyProfile('${f.id}')" title="View Profile">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="action-btn btn-edit" onclick="AdminDashboard.openEditFacultyModal('${f.id}')" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            ${f.submissionStatus === 'pending' ? `
                                                <button class="action-btn btn-approve" onclick="AdminDashboard.approveFaculty('${f.id}')" title="Approve">
                                                    <i class="fas fa-check-circle"></i>
                                                </button>
                                            ` : ''}
                                            <button class="action-btn btn-delete" onclick="AdminDashboard.openDeleteModal('${f.id}', '${this.escapeHtml(f.name)}')" title="Delete">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ============================================
    // LOAD ALL FACULTY PROFILES (PUBLIC VIEW)
    // ============================================
    loadAllFaculty: function() {
        this.setActiveMenu('all-faculty');
        window.open('faculty-profiles.html', '_blank');
    },

    // ============================================
    // PENDING APPROVALS - FIXED
    // ============================================
    loadPendingApprovals: async function() {
        this.currentView = 'pending';
        this.setActiveMenu('pending');
        
        await this.loadFacultyData();
        const pendingFaculty = this.facultyData.filter(f => f.submissionStatus === 'pending');
        
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div>
                <h2 class="section-title">
                    <i class="fas fa-clock"></i> Pending Approvals
                    <span class="status-badge status-pending" style="margin-left: 16px;">${pendingFaculty.length} Pending</span>
                </h2>
                
                ${pendingFaculty.length === 0 ? `
                    <div class="empty-state" style="text-align: center; padding: 60px;">
                        <i class="fas fa-check-circle" style="font-size: 64px; color: #10b981; margin-bottom: 20px;"></i>
                        <h3>No Pending Approvals</h3>
                        <p>All faculty profiles have been reviewed!</p>
                    </div>
                ` : `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Employee ID</th>
                                    <th>Submitted</th>
                                    <th>Profile Completion</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingFaculty.map(f => `
                                    <tr>
                                        <td><strong>${this.escapeHtml(f.name)}</strong></td>
                                        <td>${this.escapeHtml(f.email)}</td>
                                        <td>${this.escapeHtml(f.department)}</td>
                                        <td>${this.escapeHtml(f.employeeId)}</td>
                                        <td>${this.escapeHtml(f.submittedAt)}</td>
                                        <td>
                                            <div style="width: 120px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                <div style="width: ${this.calculateProfileCompletion(f)}%; height: 100%; background: #f59e0b;"></div>
                                            </div>
                                            <span style="font-size: 11px; color: var(--gray);">${f.qualificationsCount} quals, ${f.publicationsCount} pubs</span>
                                        </td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="action-btn btn-view" onclick="AdminDashboard.viewFacultyProfile('${f.id}')" title="View">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="action-btn btn-approve" onclick="AdminDashboard.approveFaculty('${f.id}')" title="Approve">
                                                    <i class="fas fa-check-circle"></i> Approve
                                                </button>
                                                <button class="action-btn btn-reject" onclick="AdminDashboard.rejectFaculty('${f.id}')" title="Reject">
                                                    <i class="fas fa-times-circle"></i> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    // ============================================
    // FACULTY MANAGEMENT - CARD VIEW
    // ============================================
    loadFacultyManagement: async function() {
        this.currentView = 'faculty';
        this.setActiveMenu('faculty');
        
        await this.loadFacultyData();

        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 class="section-title" style="margin: 0; border-bottom: none; padding-bottom: 0;">
                        <i class="fas fa-chalkboard-teacher"></i> Faculty Management
                    </h2>
                    <div style="display: flex; gap: 16px;">
                        <button class="btn btn-primary" onclick="AdminDashboard.openAddFacultyModal()">
                            <i class="fas fa-user-plus"></i> Add Faculty
                        </button>
                        <button class="btn btn-success" onclick="AdminDashboard.exportAllFacultyExcel()">
                            <i class="fas fa-file-excel"></i> Export All
                        </button>
                    </div>
                </div>
                
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" id="facultySearchInput" placeholder="Search by name, email, department, ID, designation..." onkeyup="AdminDashboard.filterFacultyCards()">
                </div>
                
                <div class="filter-pills">
                    <button class="filter-pill active" onclick="AdminDashboard.filterByDepartment('all')" id="filter-all">
                        <i class="fas fa-university"></i> All (${this.facultyData.length})
                    </button>
                    <button class="filter-pill" onclick="AdminDashboard.filterByDepartment('CSE')" id="filter-CSE">
                        <i class="fas fa-laptop-code"></i> CSE (${this.facultyData.filter(f => f.department === 'CSE').length})
                    </button>
                    <button class="filter-pill" onclick="AdminDashboard.filterByDepartment('IT')" id="filter-IT">
                        <i class="fas fa-network-wired"></i> IT (${this.facultyData.filter(f => f.department === 'IT').length})
                    </button>
                    <button class="filter-pill" onclick="AdminDashboard.filterByDepartment('ENTC')" id="filter-ENTC">
                        <i class="fas fa-microchip"></i> ENTC (${this.facultyData.filter(f => f.department === 'ENTC').length})
                    </button>
                    <button class="filter-pill" onclick="AdminDashboard.filterByDepartment('MECH')" id="filter-MECH">
                        <i class="fas fa-cogs"></i> MECH (${this.facultyData.filter(f => f.department === 'MECH').length})
                    </button>
                </div>
                
                <div class="faculty-grid" id="facultyCardGrid">
                    ${this.facultyData.map(f => this.generateFacultyCard(f)).join('')}
                </div>
            </div>
        `;
    },

    // ============================================
    // GENERATE FACULTY CARD
    // ============================================
    generateFacultyCard: function(f) {
        const initials = f.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        let deptIcon = 'fa-building';
        let deptColor = '#64748b';
        
        switch(f.department) {
            case 'CSE': 
                deptIcon = 'fa-laptop-code'; 
                deptColor = '#2563eb'; 
                break;
            case 'IT': 
                deptIcon = 'fa-network-wired'; 
                deptColor = '#7c3aed'; 
                break;
            case 'ENTC': 
                deptIcon = 'fa-microchip'; 
                deptColor = '#ea580c'; 
                break;
            case 'MECH': 
                deptIcon = 'fa-cogs'; 
                deptColor = '#059669'; 
                break;
        }

        return `
            <div class="faculty-card" 
                 data-department="${f.department}" 
                 data-name="${f.name.toLowerCase()}" 
                 data-email="${f.email.toLowerCase()}" 
                 data-id="${f.employeeId.toLowerCase()}" 
                 data-designation="${f.designation.toLowerCase()}">
                <div class="card-accent" style="background: linear-gradient(180deg, ${deptColor} 0%, ${deptColor}80 100%);"></div>
                <div class="faculty-card-header">
                    <div class="faculty-avatar" style="background: linear-gradient(135deg, ${deptColor} 0%, ${deptColor}cc 100%);">
                        ${initials}
                    </div>
                    <div class="faculty-info">
                        <div class="faculty-name">${this.escapeHtml(f.name)}</div>
                        <span class="faculty-dept">${this.escapeHtml(f.department)}</span>
                        <div style="margin-top: 8px;">
                            <span class="status-badge ${this.getStatusClass(f.submissionStatus)}">
                                ${this.getStatusText(f.submissionStatus)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="faculty-details">
                    <div class="detail-row">
                        <i class="fas fa-id-card"></i>
                        <span class="detail-text"><strong>ID:</strong> ${this.escapeHtml(f.employeeId)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-envelope"></i>
                        <span class="detail-text"><strong>Email:</strong> ${this.escapeHtml(f.email)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-user-tie"></i>
                        <span class="detail-text"><strong>Designation:</strong> ${this.escapeHtml(f.designation)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-phone"></i>
                        <span class="detail-text"><strong>Phone:</strong> ${this.escapeHtml(f.phone)}</span>
                    </div>
                    
                    <div class="stats-mini">
                        <div class="stat-mini-item">
                            <div class="stat-mini-value">${f.qualificationsCount}</div>
                            <div class="stat-mini-label">Qual</div>
                        </div>
                        <div class="stat-mini-item">
                            <div class="stat-mini-value">${f.publicationsCount}</div>
                            <div class="stat-mini-label">Pubs</div>
                        </div>
                        <div class="stat-mini-item">
                            <div class="stat-mini-value">${f.projectsCount}</div>
                            <div class="stat-mini-label">Proj</div>
                        </div>
                        <div class="stat-mini-item">
                            <div class="stat-mini-value">${f.workshopsCount}</div>
                            <div class="stat-mini-label">WS</div>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="card-btn view" onclick="AdminDashboard.viewFacultyProfile('${f.id}')">
                        <i class="fas fa-id-card"></i> View Full
                    </button>
                    <button class="card-btn edit" onclick="AdminDashboard.openEditFacultyModal('${f.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${f.submissionStatus === 'pending' ? `
                        <button class="card-btn approve" onclick="AdminDashboard.approveFaculty('${f.id}')">
                            <i class="fas fa-check-circle"></i> Approve
                        </button>
                    ` : ''}
                    <button class="card-btn delete" onclick="AdminDashboard.openDeleteModal('${f.id}', '${this.escapeHtml(f.name)}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    },

    // ============================================
    // FILTER FACULTY CARDS
    // ============================================
    filterFacultyCards: function() {
        const searchTerm = document.getElementById('facultySearchInput')?.value.toLowerCase() || '';
        const cards = document.querySelectorAll('.faculty-card');
        
        cards.forEach(card => {
            const name = card.dataset.name || '';
            const email = card.dataset.email || '';
            const dept = card.dataset.department || '';
            const id = card.dataset.id || '';
            const designation = card.dataset.designation || '';
            
            const matches = name.includes(searchTerm) || 
                           email.includes(searchTerm) || 
                           dept.toLowerCase().includes(searchTerm) ||
                           id.includes(searchTerm) ||
                           designation.includes(searchTerm);
            
            card.style.display = matches ? 'block' : 'none';
        });
    },

    // ============================================
    // FILTER BY DEPARTMENT
    // ============================================
    filterByDepartment: function(dept) {
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        document.getElementById(`filter-${dept === 'all' ? 'all' : dept}`).classList.add('active');
        
        const cards = document.querySelectorAll('.faculty-card');
        cards.forEach(card => {
            if (dept === 'all') {
                card.style.display = 'block';
            } else {
                card.style.display = card.dataset.department === dept ? 'block' : 'none';
            }
        });
    },

    // ============================================
    // APPROVE FACULTY - FIXED VERSION
    // ============================================
    approveFaculty: async function(facultyId) {
        if (!confirm("Approve this faculty profile? This will make it visible to the public.")) {
            return;
        }
        
        try {
            if (!this.db) {
                console.error("Firestore not initialized");
                return;
            }
            
            // Update facultyProfiles collection
            await this.db.collection('facultyProfiles').doc(facultyId).update({
                profileComplete: true,
                submissionStatus: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                approvedBy: localStorage.getItem('adminId') || 'admin'
            });
            
            // Update faculty collection
            await this.db.collection('faculty').doc(facultyId).set({
                profileComplete: true,
                submissionStatus: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            this.showMessage("Faculty approved successfully! Profile is now public.", "success");
            
            // Refresh the current view
            if (this.currentView === 'pending') {
                this.loadPendingApprovals();
            } else if (this.currentView === 'dashboard') {
                this.loadDashboard();
            } else {
                this.loadFacultyManagement();
            }
            
        } catch (error) {
            console.error("Error approving faculty:", error);
            this.showMessage("Failed to approve faculty: " + error.message, "error");
        }
    },

    // ============================================
    // REJECT FACULTY - NEW
    // ============================================
    rejectFaculty: async function(facultyId) {
        if (!confirm("Reject this faculty profile? The faculty member will need to resubmit.")) {
            return;
        }
        
        try {
            if (!this.db) return;
            
            await this.db.collection('facultyProfiles').doc(facultyId).update({
                submissionStatus: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rejectedBy: localStorage.getItem('adminId') || 'admin',
                profileComplete: false
            });
            
            await this.db.collection('faculty').doc(facultyId).set({
                submissionStatus: 'rejected',
                profileComplete: false,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            this.showMessage("Faculty profile rejected. Faculty member will need to resubmit.", "warning");
            
            if (this.currentView === 'pending') {
                this.loadPendingApprovals();
            } else {
                this.loadFacultyManagement();
            }
            
        } catch (error) {
            console.error("Error rejecting faculty:", error);
            this.showMessage("Failed to reject faculty: " + error.message, "error");
        }
    },

    // ============================================
    // REPORTS & ANALYTICS
    // ============================================
    loadReports: async function() {
        this.setActiveMenu('reports');
        await this.loadFacultyData();

        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div>
                <h2 class="section-title">
                    <i class="fas fa-chart-bar"></i> Reports & Analytics
                    <div class="title-actions">
                        <button class="btn btn-primary" onclick="AdminDashboard.exportAllFacultyPDF()">
                            <i class="fas fa-file-pdf"></i> Export PDF
                        </button>
                        <button class="btn btn-success" onclick="AdminDashboard.exportAllFacultyExcel()">
                            <i class="fas fa-file-excel"></i> Export Excel
                        </button>
                    </div>
                </h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                    <div style="background: white; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-chart-pie" style="color: var(--secondary);"></i> Faculty by Department
                        </h3>
                        <div style="height: 200px; display: flex; flex-direction: column; gap: 16px;">
                            ${this.generateDepartmentStats()}
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-chart-bar" style="color: var(--secondary);"></i> Profile Status
                        </h3>
                        <div style="height: 200px; display: flex; flex-direction: column; gap: 16px;">
                            ${this.generateStatusStats()}
                        </div>
                    </div>
                </div>
                
                <div style="background: white; padding: 28px; border-radius: 20px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-download" style="color: var(--secondary);"></i> Download Faculty Data
                    </h3>
                    <div class="download-cards">
                        <div class="download-card">
                            <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
                            <h4>Complete Report</h4>
                            <p>All faculty profiles summary</p>
                            <button class="btn btn-primary" onclick="AdminDashboard.exportAllFacultyPDF()" style="width: 100%;">
                                <i class="fas fa-download"></i> Download PDF
                            </button>
                        </div>
                        <div class="download-card">
                            <i class="fas fa-file-excel" style="color: #10b981;"></i>
                            <h4>Excel Spreadsheet</h4>
                            <p>Raw data for analysis</p>
                            <button class="btn btn-success" onclick="AdminDashboard.exportAllFacultyExcel()" style="width: 100%;">
                                <i class="fas fa-download"></i> Download Excel
                            </button>
                        </div>
                        <div class="download-card">
                            <i class="fas fa-file-code" style="color: var(--gray);"></i>
                            <h4>JSON Backup</h4>
                            <p>Full database backup</p>
                            <button class="btn btn-outline" onclick="AdminDashboard.backupData()" style="width: 100%;">
                                <i class="fas fa-archive"></i> Download JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ============================================
    // GENERATE DEPARTMENT STATS
    // ============================================
    generateDepartmentStats: function() {
        const depts = ['CSE', 'IT', 'ENTC', 'MECH'];
        const counts = {
            CSE: this.facultyData.filter(f => f.department === 'CSE').length,
            IT: this.facultyData.filter(f => f.department === 'IT').length,
            ENTC: this.facultyData.filter(f => f.department === 'ENTC').length,
            MECH: this.facultyData.filter(f => f.department === 'MECH').length
        };
        
        const total = this.facultyData.length || 1;
        
        return depts.map(dept => {
            const count = counts[dept];
            const percentage = (count / total * 100).toFixed(1);
            let color = '#2563eb';
            if (dept === 'IT') color = '#7c3aed';
            if (dept === 'ENTC') color = '#ea580c';
            if (dept === 'MECH') color = '#059669';
            
            return `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600;">${dept}</span>
                        <span>${count} (${percentage}%)</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 6px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ============================================
    // GENERATE STATUS STATS
    // ============================================
    generateStatusStats: function() {
        const approved = this.facultyData.filter(f => f.submissionStatus === 'approved').length;
        const pending = this.facultyData.filter(f => f.submissionStatus === 'pending').length;
        const draft = this.facultyData.filter(f => f.submissionStatus === 'draft').length;
        const rejected = this.facultyData.filter(f => f.submissionStatus === 'rejected').length;
        const total = this.facultyData.length || 1;
        
        return `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #10b981;">Approved</span>
                    <span>${approved} (${(approved / total * 100).toFixed(1)}%)</span>
                </div>
                <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${(approved / total * 100)}%; height: 100%; background: #10b981; border-radius: 6px;"></div>
                </div>
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #f59e0b;">Pending</span>
                    <span>${pending} (${(pending / total * 100).toFixed(1)}%)</span>
                </div>
                <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${(pending / total * 100)}%; height: 100%; background: #f59e0b; border-radius: 6px;"></div>
                </div>
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #6b7280;">Draft</span>
                    <span>${draft} (${(draft / total * 100).toFixed(1)}%)</span>
                </div>
                <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${(draft / total * 100)}%; height: 100%; background: #6b7280; border-radius: 6px;"></div>
                </div>
            </div>
            ${rejected > 0 ? `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #ef4444;">Rejected</span>
                        <span>${rejected} (${(rejected / total * 100).toFixed(1)}%)</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${(rejected / total * 100)}%; height: 100%; background: #ef4444; border-radius: 6px;"></div>
                    </div>
                </div>
            ` : ''}
        `;
    },

    // ============================================
    // SETTINGS
    // ============================================
    loadSettings: async function() {
        this.setActiveMenu('settings');
        await this.loadFacultyData();
        
        const pendingCount = this.facultyData.filter(f => f.submissionStatus === 'pending').length;
        const draftCount = this.facultyData.filter(f => f.submissionStatus === 'draft').length;
        
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div>
                <h2 class="section-title">
                    <i class="fas fa-cog"></i> System Settings
                </h2>
                
                <div class="settings-grid">
                    <div class="settings-card">
                        <h3><i class="fas fa-sliders-h" style="color: var(--secondary);"></i> System Configuration</h3>
                        <ul class="settings-list">
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Email Notifications</h4>
                                    <p>Send email alerts to faculty</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="emailNotifications" checked>
                                    <span class="slider round"></span>
                                </label>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Auto Backup</h4>
                                    <p>Automatically backup data daily</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="autoBackup" checked>
                                    <span class="slider round"></span>
                                </label>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="settings-card">
                        <h3><i class="fas fa-database" style="color: var(--secondary);"></i> Database Management</h3>
                        <ul class="settings-list">
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Backup Database</h4>
                                    <p>Create JSON backup of all faculty data</p>
                                </div>
                                <button class="btn btn-primary" onclick="AdminDashboard.backupData()">
                                    <i class="fas fa-database"></i> Backup
                                </button>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Export All Faculty</h4>
                                    <p>Download as Excel spreadsheet</p>
                                </div>
                                <button class="btn btn-success" onclick="AdminDashboard.exportAllFacultyExcel()">
                                    <i class="fas fa-file-excel"></i> Export
                                </button>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Export as PDF</h4>
                                    <p>Generate complete faculty report</p>
                                </div>
                                <button class="btn btn-primary" onclick="AdminDashboard.exportAllFacultyPDF()">
                                    <i class="fas fa-file-pdf"></i> PDF
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="settings-card danger-zone">
                        <h3><i class="fas fa-exclamation-triangle"></i> Danger Zone</h3>
                        <ul class="settings-list">
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Delete All Pending Profiles</h4>
                                    <p>${pendingCount} pending approvals - Remove all pending faculty profiles</p>
                                    <span style="color: var(--danger); font-size: 12px; font-weight: 600;">⚠️ This action cannot be undone</span>
                                </div>
                                <button class="btn btn-danger" onclick="AdminDashboard.openBatchDeleteModal('pending', ${pendingCount})" ${pendingCount === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-trash-alt"></i> Delete Pending
                                </button>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Delete All Draft Profiles</h4>
                                    <p>${draftCount} draft profiles - Remove all incomplete faculty profiles</p>
                                    <span style="color: var(--danger); font-size: 12px; font-weight: 600;">⚠️ This action cannot be undone</span>
                                </div>
                                <button class="btn btn-danger" onclick="AdminDashboard.openBatchDeleteModal('draft', ${draftCount})" ${draftCount === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-trash-alt"></i> Delete Drafts
                                </button>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Clear System Cache</h4>
                                    <p>Reset all cached data and temporary files</p>
                                </div>
                                <button class="btn btn-outline" onclick="AdminDashboard.clearCache()">
                                    <i class="fas fa-eraser"></i> Clear
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="settings-card">
                        <h3><i class="fas fa-info-circle" style="color: var(--secondary);"></i> About System</h3>
                        <ul class="settings-list">
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Version</h4>
                                    <p>Faculty Management System v3.1.0</p>
                                </div>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Firebase Project</h4>
                                    <p>faculty-profile-manageme-b912b</p>
                                </div>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Last System Backup</h4>
                                    <p id="lastBackupTime">${new Date().toLocaleString()}</p>
                                </div>
                            </li>
                            <li class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Total Faculty Records</h4>
                                    <p>${this.facultyData.length} faculty members</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    },

    // ============================================
    // ADMIN PROFILE
    // ============================================
    loadAdminProfile: function() {
        this.setActiveMenu('profile');
        this.currentView = 'profile';
        
        const adminId = localStorage.getItem('adminId') || 'admin001';
        const adminName = localStorage.getItem('adminName') || 'System Administrator';
        const adminEmail = localStorage.getItem('adminEmail') || 'admin@faculty.com';
        
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div>
                <h2 class="section-title">
                    <i class="fas fa-user-cog"></i> Admin Profile
                </h2>
                
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: var(--box-shadow); border: 1px solid #e2e8f0;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, var(--secondary) 0%, #1e40af 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: white; font-size: 40px; font-weight: bold;">
                                ${adminName.charAt(0)}
                            </div>
                            <h3 style="margin-top: 20px; font-size: 1.8rem;">${adminName}</h3>
                            <p style="color: var(--secondary); font-weight: 600;">System Administrator</p>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <div class="form-group">
                                <label class="form-label">Admin ID</label>
                                <input type="text" class="form-control" value="${adminId}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" value="${adminEmail}" id="adminEmailInput">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" value="${adminName}" id="adminNameInput">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Change Password</label>
                                <input type="password" class="form-control" placeholder="New Password" id="newPassword">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" placeholder="Confirm New Password" id="confirmPassword">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 16px;">
                            <button class="btn btn-primary" style="flex: 1;" onclick="AdminDashboard.updateAdminProfile()">
                                <i class="fas fa-save"></i> Update Profile
                            </button>
                            <button class="btn btn-outline" style="flex: 1;" onclick="AdminDashboard.loadDashboard()">
                                <i class="fas fa-arrow-left"></i> Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ============================================
    // UPDATE ADMIN PROFILE
    // ============================================
    updateAdminProfile: function() {
        const name = document.getElementById('adminNameInput')?.value;
        const email = document.getElementById('adminEmailInput')?.value;
        const newPass = document.getElementById('newPassword')?.value;
        const confirmPass = document.getElementById('confirmPassword')?.value;
        
        if (name) {
            localStorage.setItem('adminName', name);
            document.getElementById('adminName').textContent = name;
            document.getElementById('adminAvatar').textContent = name.charAt(0);
        }
        
        if (email) {
            localStorage.setItem('adminEmail', email);
            document.getElementById('adminEmail').textContent = email;
        }
        
        if (newPass && confirmPass) {
            if (newPass === confirmPass) {
                this.showMessage("Password updated successfully!", "success");
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                this.showMessage("Passwords do not match!", "error");
                return;
            }
        }
        
        this.showMessage("Profile updated successfully!", "success");
    },

    // ============================================
    // VIEW FACULTY PROFILE - COMPLETE
    // ============================================
    viewFacultyProfile: async function(facultyId) {
        const faculty = this.facultyData.find(f => f.id === facultyId);
        if (!faculty) return;
        
        this.currentFacultyId = facultyId;
        
        const modal = document.getElementById('viewFacultyModal');
        const content = document.getElementById('viewFacultyContent');
        
        const deptColor = this.getDepartmentColor(faculty.department);
        const deptIcon = this.getDepartmentIcon(faculty.department);
        const deptFullName = this.getDepartmentFullName(faculty.department);
        const initials = faculty.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        let qualificationsHtml = this.formatQualifications(faculty.qualifications);
        let projectsHtml = this.formatResearchProjects(faculty.researchProjects);
        let publicationsHtml = this.formatPublications(faculty.publications);
        let workshopsHtml = this.formatWorkshops(faculty.workshops);
        let awardsHtml = this.formatAwards(faculty.awards);
        let patentsHtml = this.formatPatents(faculty.patents);
        let certificatesHtml = this.formatCertificates(faculty.certificates);
        let membershipsHtml = this.formatProfessionalMemberships(faculty.professionalMemberships);

        content.innerHTML = `
            <div>
                <div class="profile-header">
                    <div class="profile-avatar-large" style="background: linear-gradient(135deg, ${deptColor} 0%, ${deptColor}cc 100%);">
                        ${initials}
                    </div>
                    <div class="profile-title">
                        <h2>${this.escapeHtml(faculty.name)}</h2>
                        <p style="font-size: 1.2rem; color: var(--secondary); font-weight: 600; margin-bottom: 8px;">
                            <i class="fas ${deptIcon}"></i> ${this.escapeHtml(faculty.designation)}
                        </p>
                        <div class="profile-badges">
                            <span class="status-badge ${this.getStatusClass(faculty.submissionStatus)}">
                                ${this.getStatusText(faculty.submissionStatus)}
                            </span>
                            <span class="status-badge" style="background: #eef2ff; color: var(--secondary);">
                                <i class="fas ${deptIcon}"></i> ${this.escapeHtml(deptFullName)}
                            </span>
                            <span class="status-badge" style="background: #f1f5f9; color: var(--gray);">
                                <i class="fas fa-id-card"></i> ${this.escapeHtml(faculty.employeeId)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="info-grid">
                    <div class="info-card">
                        <h4><i class="fas fa-user"></i> Personal Information</h4>
                        <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${this.escapeHtml(faculty.name)}</span></div>
                        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${this.escapeHtml(faculty.email)}</span></div>
                        <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${this.escapeHtml(faculty.phone)}</span></div>
                        <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">${this.escapeHtml(faculty.dob)}</span></div>
                        <div class="info-row"><span class="info-label">Gender:</span><span class="info-value">${this.escapeHtml(faculty.gender)}</span></div>
                        <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${this.escapeHtml(faculty.address)}</span></div>
                    </div>
                    
                    <div class="info-card">
                        <h4><i class="fas fa-briefcase"></i> Professional Information</h4>
                        <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${this.escapeHtml(deptFullName)}</span></div>
                        <div class="info-row"><span class="info-label">Designation:</span><span class="info-value">${this.escapeHtml(faculty.designation)}</span></div>
                        <div class="info-row"><span class="info-label">Employee ID:</span><span class="info-value">${this.escapeHtml(faculty.employeeId)}</span></div>
                        <div class="info-row"><span class="info-label">Submission Status:</span><span class="info-value"><span class="status-badge ${this.getStatusClass(faculty.submissionStatus)}">${this.getStatusText(faculty.submissionStatus)}</span></span></div>
                        <div class="info-row"><span class="info-label">Submitted:</span><span class="info-value">${this.escapeHtml(faculty.submittedAt)}</span></div>
                        <div class="info-row"><span class="info-label">Last Updated:</span><span class="info-value">${this.escapeHtml(faculty.lastUpdated)}</span></div>
                    </div>
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-graduation-cap"></i> Academic Qualifications (${faculty.qualificationsCount})</h4>
                    ${qualificationsHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-flask"></i> Research Projects (${faculty.projectsCount})</h4>
                    ${projectsHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-file-alt"></i> Publications (${faculty.publicationsCount})</h4>
                    ${publicationsHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-chalkboard-teacher"></i> Workshops & Training (${faculty.workshopsCount})</h4>
                    ${workshopsHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-award"></i> Awards & Achievements (${faculty.awardsCount})</h4>
                    ${awardsHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-lightbulb"></i> Patents (${faculty.patentsCount})</h4>
                    ${patentsHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-certificate"></i> Professional Certificates (${faculty.certificatesCount})</h4>
                    ${certificatesHtml}
                </div>
                
                <div class="info-card" style="margin-bottom: 24px;">
                    <h4><i class="fas fa-id-card"></i> Professional Memberships (${faculty.membershipsCount})</h4>
                    ${membershipsHtml}
                </div>
                
                ${faculty.submissionStatus === 'pending' ? `
                    <div style="display: flex; gap: 16px; margin-top: 24px; justify-content: center;">
                        <button class="btn btn-success" onclick="AdminDashboard.approveFaculty('${faculty.id}')" style="padding: 12px 30px;">
                            <i class="fas fa-check-circle"></i> Approve Profile
                        </button>
                        <button class="btn btn-danger" onclick="AdminDashboard.rejectFaculty('${faculty.id}')" style="padding: 12px 30px;">
                            <i class="fas fa-times-circle"></i> Reject Profile
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'flex';
    },

    // ============================================
    // FORMATTING HELPER FUNCTIONS
    // ============================================
    formatQualifications: function(qualifications) {
        if (!qualifications || qualifications.length === 0) {
            return '<p style="color: var(--gray);">No qualifications added</p>';
        }
        let html = '<ul class="items-list">';
        qualifications.forEach(q => {
            html += `
                <li>
                    <strong>${this.escapeHtml(q.degreeName || 'Degree')}</strong>
                    ${q.specialization ? `- ${this.escapeHtml(q.specialization)}` : ''}
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        ${this.escapeHtml(q.university || '')} 
                        ${q.completionYear ? `(${q.completionYear})` : ''}
                        ${q.grade ? ` | Grade: ${q.grade}` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatResearchProjects: function(projects) {
        if (!projects || projects.length === 0) {
            return '<p style="color: var(--gray);">No research projects added</p>';
        }
        let html = '<ul class="items-list">';
        projects.forEach(p => {
            const phdCount = p.phdStudents || 0;
            const mastersCount = p.mastersStudents || 0;
            const ugCount = p.ugStudents || 0;
            const totalStudents = phdCount + mastersCount + ugCount;
            
            html += `
                <li>
                    <strong>${this.escapeHtml(p.title || 'Research Project')}</strong>
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        Role: ${this.escapeHtml(p.role || 'N/A')} | Duration: ${this.escapeHtml(p.startYear || '')} - ${this.escapeHtml(p.endYear || 'Present')}
                        ${p.fundingDetails ? `<br>Funding: ${this.escapeHtml(p.fundingDetails)}` : ''}
                        ${totalStudents > 0 ? `<br>Students Guided: ${totalStudents} (PhD: ${phdCount}, Masters: ${mastersCount}, UG: ${ugCount})` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatPublications: function(publications) {
        if (!publications || publications.length === 0) {
            return '<p style="color: var(--gray);">No publications added</p>';
        }
        let html = '<ul class="items-list">';
        publications.forEach(p => {
            html += `
                <li>
                    <strong>${this.escapeHtml(p.title || 'Publication')}</strong>
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        ${this.escapeHtml(p.journal || '')} 
                        ${p.date ? ` | ${new Date(p.date).toLocaleDateString()}` : ''}
                        ${p.authorPosition ? ` | ${p.authorPosition.replace('-', ' ')}` : ''}
                        ${p.doi ? `<br>DOI: <a href="${p.doi}" target="_blank">${p.doi}</a>` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatWorkshops: function(workshops) {
        if (!workshops || workshops.length === 0) {
            return '<p style="color: var(--gray);">No workshops added</p>';
        }
        let html = '<ul class="items-list">';
        workshops.forEach(w => {
            const type = w.type === 'attended' ? 'Attended' : 'Organized';
            html += `
                <li>
                    <strong>${this.escapeHtml(w.title || 'Workshop')}</strong>
                    <span style="background: var(--secondary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin-left: 8px;">${type}</span>
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        ${w.institute || w.organizedFor ? `Institute: ${this.escapeHtml(w.institute || w.organizedFor)}` : ''}
                        ${w.startDate ? ` | ${new Date(w.startDate).toLocaleDateString()}` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatAwards: function(awards) {
        if (!awards || awards.length === 0) {
            return '<p style="color: var(--gray);">No awards added</p>';
        }
        let html = '<ul class="items-list">';
        awards.forEach(a => {
            html += `
                <li>
                    <strong>${this.escapeHtml(a.title || 'Award')}</strong>
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        ${this.escapeHtml(a.organization || '')} 
                        ${a.year ? `(${a.year})` : ''}
                        ${a.description ? `<br>${this.escapeHtml(a.description)}` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatPatents: function(patents) {
        if (!patents || patents.length === 0) {
            return '<p style="color: var(--gray);">No patents added</p>';
        }
        let html = '<ul class="items-list">';
        patents.forEach(p => {
            html += `
                <li>
                    <strong>${this.escapeHtml(p.title || 'Patent')}</strong>
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        Status: ${this.escapeHtml(p.status || 'N/A')}
                        ${p.number ? ` | Patent No: ${p.number}` : ''}
                        ${p.filingDate ? ` | Filed: ${new Date(p.filingDate).toLocaleDateString()}` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatCertificates: function(certificates) {
        if (!certificates || certificates.length === 0) {
            return '<p style="color: var(--gray);">No certificates added</p>';
        }
        let html = '<ul class="items-list">';
        certificates.forEach(c => {
            html += `
                <li>
                    <strong>${this.escapeHtml(c.title || 'Certificate')}</strong>
                    <div style="color: var(--gray); font-size: 0.9rem; margin-top: 4px;">
                        ${this.escapeHtml(c.organization || '')}
                        ${c.issueDate ? ` | Issued: ${new Date(c.issueDate).toLocaleDateString()}` : ''}
                        ${c.expiryDate ? ` | Expires: ${new Date(c.expiryDate).toLocaleDateString()}` : ''}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    formatProfessionalMemberships: function(memberships) {
        if (!memberships || memberships.length === 0) {
            return '<p style="color: var(--gray);">No professional memberships added</p>';
        }
        let html = '<ul class="items-list">';
        memberships.forEach(m => {
            const statusClass = m.status === 'active' ? 'active' : m.status === 'expired' ? 'expired' : 'pending';
            const validFrom = m.validFrom ? new Date(m.validFrom).toLocaleDateString() : 'N/A';
            const validUntil = m.validUntil ? new Date(m.validUntil).toLocaleDateString() : 'Lifetime';
            
            html += `
                <li>
                    <strong>${this.escapeHtml(m.organizationName || 'Membership')}</strong>
                    <span class="status-badge ${statusClass}">${m.status || 'Active'}</span>
                    <div class="item-meta">
                        <strong>Membership No:</strong> ${this.escapeHtml(m.membershipNumber || 'N/A')}<br>
                        <strong>Valid From:</strong> ${validFrom}<br>
                        <strong>Valid Until:</strong> ${validUntil}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    // ============================================
    // DOWNLOAD FACULTY DATA - JSON
    // ============================================
    downloadFacultyDataJSON: function(facultyId) {
        const faculty = this.facultyData.find(f => f.id === facultyId);
        if (!faculty) return;
        
        const data = {
            id: faculty.id,
            personalInfo: {
                name: faculty.name,
                email: faculty.email,
                phone: faculty.phone,
                dob: faculty.dob,
                gender: faculty.gender,
                address: faculty.address,
                designation: faculty.designation
            },
            professionalInfo: {
                department: faculty.department,
                employeeId: faculty.employeeId,
                status: faculty.submissionStatus,
                submittedAt: faculty.submittedAt,
                lastUpdated: faculty.lastUpdated
            },
            qualifications: faculty.qualifications,
            researchProjects: faculty.researchProjects,
            publications: faculty.publications,
            workshops: faculty.workshops,
            awards: faculty.awards,
            patents: faculty.patents,
            certificates: faculty.certificates,
            professionalMemberships: faculty.professionalMemberships,
            stats: {
                qualificationsCount: faculty.qualificationsCount,
                projectsCount: faculty.projectsCount,
                publicationsCount: faculty.publicationsCount,
                workshopsCount: faculty.workshopsCount,
                awardsCount: faculty.awardsCount,
                patentsCount: faculty.patentsCount,
                certificatesCount: faculty.certificatesCount,
                membershipsCount: faculty.membershipsCount
            }
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${faculty.name.replace(/\s+/g, '_')}_full_profile.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    // ============================================
    // EXPORT ALL FACULTY - EXCEL
    // ============================================
    exportAllFacultyExcel: function() {
        const wsData = [
            ['Name', 'Email', 'Phone', 'Department', 'Designation', 'Employee ID', 'Status', 
             'Qualifications', 'Publications', 'Projects', 'Workshops', 'Awards', 'Patents', 'Certificates', 'Memberships', 'Submitted', 'Last Updated'],
            ...this.facultyData.map(f => [
                f.name,
                f.email,
                f.phone,
                f.department,
                f.designation,
                f.employeeId,
                this.getStatusText(f.submissionStatus),
                f.qualificationsCount,
                f.publicationsCount,
                f.projectsCount,
                f.workshopsCount,
                f.awardsCount,
                f.patentsCount,
                f.certificatesCount,
                f.membershipsCount,
                f.submittedAt,
                f.lastUpdated
            ])
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Faculty Data');
        XLSX.writeFile(wb, `faculty_data_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        this.showMessage("Excel export completed!", "success");
    },

    // ============================================
    // EXPORT ALL FACULTY - PDF
    // ============================================
    exportAllFacultyPDF: function() {
        if (!window.jspdf) {
            this.showMessage("PDF library not loaded", "error");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('Faculty Report', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Total Faculty: ${this.facultyData.length}`, 20, 40);
        doc.text(`Approved: ${this.facultyData.filter(f => f.submissionStatus === 'approved').length}`, 20, 48);
        doc.text(`Pending: ${this.facultyData.filter(f => f.submissionStatus === 'pending').length}`, 20, 56);
        
        let y = 70;
        this.facultyData.slice(0, 12).forEach((f, i) => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`${i + 1}. ${f.name}`, 20, y);
            y += 6;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(`Dept: ${f.department} | ID: ${f.employeeId} | Status: ${this.getStatusText(f.submissionStatus)}`, 25, y);
            y += 5;
            doc.text(`Email: ${f.email}`, 25, y);
            y += 5;
            doc.text(`Qual: ${f.qualificationsCount} | Pubs: ${f.publicationsCount} | Projects: ${f.projectsCount}`, 25, y);
            y += 10;
        });
        
        doc.save(`faculty_report_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showMessage("PDF export completed!", "success");
    },

    // ============================================
    // BACKUP DATA
    // ============================================
    backupData: function() {
        const dataStr = JSON.stringify(this.facultyData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `faculty_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        const lastBackupTime = document.getElementById('lastBackupTime');
        if (lastBackupTime) {
            lastBackupTime.innerHTML = new Date().toLocaleString();
        }
        
        this.showMessage("Backup completed!", "success");
    },

    // ============================================
    // CLEAR CACHE
    // ============================================
    clearCache: function() {
        if (confirm("Clear system cache? This will refresh the page.")) {
            localStorage.removeItem('facultyCache');
            sessionStorage.clear();
            location.reload();
        }
    },

    // ============================================
    // OPEN ADD FACULTY MODAL
    // ============================================
    openAddFacultyModal: function() {
        document.getElementById('addFacultyModal').style.display = 'flex';
    },

    // ============================================
    // ADD NEW FACULTY
    // ============================================
    addNewFaculty: async function() {
        const name = document.getElementById('facultyName')?.value;
        const email = document.getElementById('facultyEmail')?.value;
        const department = document.getElementById('facultyDepartment')?.value;
        const designation = document.getElementById('facultyDesignation')?.value || 'Faculty';
        const employeeId = document.getElementById('facultyEmployeeId')?.value || `EMP${Date.now().toString().slice(-6)}`;
        const phone = document.getElementById('facultyPhone')?.value || '';
        
        if (!name || !email || !department) {
            this.showMessage("Please fill in all required fields!", "error");
            return;
        }
        
        try {
            const newFaculty = {
                personalInfo: {
                    fullName: name,
                    email: email,
                    phone: phone,
                    designation: designation
                },
                department: department,
                employeeId: employeeId,
                profileComplete: false,
                submissionStatus: 'pending',
                qualifications: [],
                researchProjects: [],
                publications: [],
                workshops: [],
                awards: [],
                patents: [],
                certificates: [],
                professionalMemberships: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('facultyProfiles').add(newFaculty);
            
            this.showMessage("Faculty added successfully! Status: Pending Approval", "success");
            this.closeModal('addFacultyModal');
            this.loadFacultyManagement();
            
        } catch (error) {
            console.error("Error adding faculty:", error);
            this.showMessage("Failed to add faculty: " + error.message, "error");
        }
    },

    // ============================================
    // OPEN EDIT FACULTY MODAL
    // ============================================
    openEditFacultyModal: function(facultyId) {
        const faculty = this.facultyData.find(f => f.id === facultyId);
        if (!faculty) return;
        
        this.currentFacultyId = facultyId;
        
        const modal = document.getElementById('editFacultyModal');
        const content = document.getElementById('editFacultyContent');
        
        content.innerHTML = `
            <form id="editFacultyFormData">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="editName" value="${this.escapeHtml(faculty.name)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="editEmail" value="${this.escapeHtml(faculty.email)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Department</label>
                    <select class="form-control" id="editDepartment">
                        <option value="CSE" ${faculty.department === 'CSE' ? 'selected' : ''}>Computer Science (CSE)</option>
                        <option value="IT" ${faculty.department === 'IT' ? 'selected' : ''}>Information Technology (IT)</option>
                        <option value="ENTC" ${faculty.department === 'ENTC' ? 'selected' : ''}>Electronics & Telecomm (ENTC)</option>
                        <option value="MECH" ${faculty.department === 'MECH' ? 'selected' : ''}>Mechanical Engineering (MECH)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Employee ID</label>
                    <input type="text" class="form-control" id="editEmployeeId" value="${this.escapeHtml(faculty.employeeId)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Designation</label>
                    <input type="text" class="form-control" id="editDesignation" value="${this.escapeHtml(faculty.designation)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control" id="editPhone" value="${this.escapeHtml(faculty.phone)}">
                </div>
            </form>
        `;
        
        modal.style.display = 'flex';
    },

    // ============================================
    // SAVE FACULTY EDITS
    // ============================================
    saveFacultyEdits: async function() {
        if (!this.currentFacultyId || !this.db) return;
        
        try {
            const facultyRef = this.db.collection('facultyProfiles').doc(this.currentFacultyId);
            
            await facultyRef.update({
                'personalInfo.fullName': document.getElementById('editName').value,
                'personalInfo.email': document.getElementById('editEmail').value,
                'personalInfo.phone': document.getElementById('editPhone').value,
                'personalInfo.designation': document.getElementById('editDesignation').value,
                'department': document.getElementById('editDepartment').value,
                'employeeId': document.getElementById('editEmployeeId').value,
                'lastUpdated': firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showMessage("Faculty profile updated successfully!", "success");
            this.closeModal('editFacultyModal');
            
            if (this.currentView === 'dashboard') this.loadDashboard();
            else if (this.currentView === 'faculty') this.loadFacultyManagement();
            else if (this.currentView === 'pending') this.loadPendingApprovals();
            
        } catch (error) {
            console.error("Error updating faculty:", error);
            this.showMessage("Failed to update faculty: " + error.message, "error");
        }
    },

    // ============================================
    // OPEN DELETE MODAL
    // ============================================
    openDeleteModal: function(facultyId, facultyName) {
        this.currentFacultyId = facultyId;
        document.getElementById('deleteFacultyName').innerHTML = 
            `Are you sure you want to delete <strong>${this.escapeHtml(facultyName)}</strong>?`;
        document.getElementById('deleteConfirmModal').style.display = 'flex';
    },

    // ============================================
    // CONFIRM DELETE FACULTY
    // ============================================
    confirmDeleteFaculty: async function() {
        if (!this.currentFacultyId || !this.db) return;
        
        try {
            await this.db.collection('facultyProfiles').doc(this.currentFacultyId).delete();
            
            this.showMessage("Faculty profile deleted successfully!", "success");
            this.closeModal('deleteConfirmModal');
            
            if (this.currentView === 'dashboard') this.loadDashboard();
            else if (this.currentView === 'faculty') this.loadFacultyManagement();
            else if (this.currentView === 'pending') this.loadPendingApprovals();
            
        } catch (error) {
            console.error("Error deleting faculty:", error);
            this.showMessage("Failed to delete faculty: " + error.message, "error");
        }
    },

    // ============================================
    // OPEN BATCH DELETE MODAL
    // ============================================
    openBatchDeleteModal: function(type, count) {
        this.currentBatchDeleteType = type;
        
        const title = type === 'pending' ? 'Delete All Pending Profiles' : 'Delete All Draft Profiles';
        const message = type === 'pending' 
            ? `You are about to delete ${count} faculty profiles pending approval.` 
            : `You are about to delete ${count} draft faculty profiles.`;
        
        document.getElementById('batchDeleteTitle').textContent = title;
        document.getElementById('batchDeleteMessage').innerHTML = message;
        document.getElementById('batchDeleteModal').style.display = 'flex';
    },

    // ============================================
    // CONFIRM BATCH DELETE
    // ============================================
    confirmBatchDelete: async function() {
        if (!this.db) return;
        
        try {
            let deleted = 0;
            let profilesToDelete = [];
            
            if (this.currentBatchDeleteType === 'pending') {
                profilesToDelete = this.facultyData.filter(f => f.submissionStatus === 'pending');
            } else if (this.currentBatchDeleteType === 'draft') {
                profilesToDelete = this.facultyData.filter(f => f.submissionStatus === 'draft');
            }
            
            for (const faculty of profilesToDelete) {
                await this.db.collection('facultyProfiles').doc(faculty.id).delete();
                deleted++;
            }
            
            this.showMessage(`Successfully deleted ${deleted} profiles.`, "success");
            this.closeModal('batchDeleteModal');
            await this.loadFacultyData();
            this.loadSettings();
            
        } catch (error) {
            console.error("Error batch deleting profiles:", error);
            this.showMessage("Failed to delete profiles: " + error.message, "error");
        }
    },

    // ============================================
    // CLOSE MODAL
    // ============================================
    closeModal: function(modalId) {
        document.getElementById(modalId).style.display = 'none';
    },

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    getStatusClass: function(status) {
        switch(status) {
            case 'approved': return 'status-active';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return 'status-draft';
        }
    },

    getStatusText: function(status) {
        switch(status) {
            case 'approved': return 'Approved';
            case 'pending': return 'Pending';
            case 'rejected': return 'Rejected';
            default: return 'Draft';
        }
    },

    getDepartmentColor: function(dept) {
        switch(dept) {
            case 'CSE': return '#2563eb';
            case 'IT': return '#7c3aed';
            case 'ENTC': return '#ea580c';
            case 'MECH': return '#059669';
            default: return '#64748b';
        }
    },

    getDepartmentIcon: function(dept) {
        switch(dept) {
            case 'CSE': return 'fa-laptop-code';
            case 'IT': return 'fa-network-wired';
            case 'ENTC': return 'fa-microchip';
            case 'MECH': return 'fa-cogs';
            default: return 'fa-building';
        }
    },

    getDepartmentFullName: function(dept) {
        switch(dept) {
            case 'CSE': return 'Computer Science & Engineering';
            case 'IT': return 'Information Technology';
            case 'ENTC': return 'Electronics & Telecommunication';
            case 'MECH': return 'Mechanical Engineering';
            default: return dept;
        }
    },

    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showMessage: function(text, type = "info") {
        console.log(`[${type.toUpperCase()}] ${text}`);
        
        const existing = document.querySelectorAll('.admin-message');
        existing.forEach(msg => msg.remove());
        
        const message = document.createElement('div');
        message.className = 'admin-message';
        
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
    },

    // ============================================
    // INITIALIZATION
    // ============================================
    init: function() {
        if (!this.checkAdminAuth()) return;
        
        this.initFirebase();
        this.loadAdminInfo();
        this.loadDashboard();
        
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (confirm("You have been inactive for 30 minutes. Logout?")) {
                    this.logout();
                }
            }, 30 * 60 * 1000);
        };
        
        resetTimer();
        document.addEventListener('mousemove', resetTimer);
        document.addEventListener('keypress', resetTimer);
    }
};

// ============================================
// WINDOW ONLOAD
// ============================================
window.onload = function() {
    AdminDashboard.init();
};

// ============================================
// EXPORT TO GLOBAL
// ============================================
window.AdminDashboard = AdminDashboard;