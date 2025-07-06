document.addEventListener('DOMContentLoaded', function() {


    // --- Sample Data ---
    const sampleUsers = Array.from({length: 30}, (_, i) => ({
        id: `user${i+1}`,
        name: `User ${i+1}`,
        avatar: `https://randomuser.me/api/portraits/${i%2===0?'men':'women'}/${i+10}.jpg`
    }));
    const sampleMembers = Array.from({length: 40}, (_, i) => ({
        id: `member${i+1}`,
        name: `Member ${i+1}`,
        avatar: `https://randomuser.me/api/portraits/${i%2===0?'men':'women'}/${i+30}.jpg`
    }));

    // --- Demo Lab Data ---
    const labData = {
        "lab1": {
            "description": "A modern robotics and AI research lab.",
            "head_of_lab": sampleUsers[0].id,
            "photos": {
                "photo1": "photo1.jpg",
                "photo2": "photo2.jpg",
                "photo3": "photo3.jpg"
            },
            "projects": {
                "project1": {
                    "title": "Autonomous Drone",
                    "description": "Developing a drone that can navigate indoor environments using AI.",
                    "project_lead": "Dr. John Smith",
                    "members": {
                        "member1": sampleMembers[0].id,
                        "member2": sampleMembers[1].id,
                        "member3": sampleMembers[2].id
                    },
                    "tags": {
                        "tag1": "robotics", "tag2": "ai"
                    },
                    "project_photo": "drone.jpg",
                    "attachment": "drone_spec.pdf",
                    "project_link": "https://github.com/lab/drone"
                },
                "project2": {
                    "title": "Robotic Arm",
                    "description": "A collaborative robotic arm for precision assembly.",
                    "project_lead": "Dr. Jane Doe",
                    "members": {
                        "member1": sampleMembers[3].id,
                        "member2": sampleMembers[4].id
                    },
                    "tags": {
                        "tag1": "robotics", "tag2": "automation"
                    },
                    "project_photo": "arm.jpg",
                    "attachment": "arm_manual.pdf",
                    "project_link": "https://github.com/lab/arm"
                }
            }
        }
    };

    let currentLab = labData.lab1;
    let editingProjectKey = null;
    let selectedHeadId = currentLab.head_of_lab;
    let selectedProjectMembers = [];

    // --- Toast ---
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));
    function showToast(message) {
        document.getElementById('toastMessage').textContent = message;
        successToast.show();
    }

    // --- Tabs ---
    document.getElementById('labDetailsTab').onclick = function() {
        document.getElementById('labDetailsSection').classList.remove('d-none');
        document.getElementById('projectsSection').classList.add('d-none');
        this.classList.add('active');
        document.getElementById('projectsTab').classList.remove('active');
    };
    document.getElementById('projectsTab').onclick = function() {
        document.getElementById('labDetailsSection').classList.add('d-none');
        document.getElementById('projectsSection').classList.remove('d-none');
        this.classList.add('active');
        document.getElementById('labDetailsTab').classList.remove('active');
    };

    // --- Lab Photos ---
    function renderLabPhotos(editMode = false) {
        const grid = document.getElementById('labPhotosGrid');
        grid.innerHTML = '';
        const photoKeys = Object.keys(currentLab.photos || {});
        photoKeys.forEach((key, idx) => {
            const url = `/media/${currentLab.photos[key]}`;
            const box = document.createElement('div');
            box.className = 'lab-photo-box position-relative';
            box.innerHTML = `
                <img src="${url}" class="lab-photo-img" alt="Lab Photo ${idx+1}">
                ${editMode ? `
                <label class="lab-photo-upload" for="labPhotoUpload${idx+1}" title="Change Photo"><i class="fas fa-camera"></i></label>
                <input type="file" id="labPhotoUpload${idx+1}" class="d-none" accept="image/*">
                <button type="button" class="lab-photo-delete btn btn-link text-danger position-absolute top-0 end-0 m-2 p-0" title="Delete Photo"><i class="fas fa-trash-alt"></i></button>
                ` : ''}
            `;
            if (editMode) {
                // Upload handler
                box.querySelector('input[type="file"]').onchange = function(e) {
                    if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = function(ev) {
                            box.querySelector('img').src = ev.target.result;
                        };
                        reader.readAsDataURL(e.target.files[0]);
                    }
                };
                // Delete handler
                box.querySelector('.lab-photo-delete').onclick = function() {
                    if (confirm('Are you sure you want to delete this photo?')) {
                        delete currentLab.photos[key];
                        renderLabPhotos(true);
                    }
                };
            }
            grid.appendChild(box);
        });
        if (editMode) {
            // Add button for new photo
            const addBox = document.createElement('div');
            addBox.className = 'lab-photo-box d-flex align-items-center justify-content-center';
            addBox.style.background = '#e3e8f0';
            addBox.innerHTML = `
                <label class="lab-photo-upload" for="addLabPhoto" title="Add Photo"><i class="fas fa-plus"></i></label>
                <input type="file" id="addLabPhoto" class="d-none" accept="image/*">
            `;
            addBox.querySelector('input[type="file"]').onchange = function(e) {
                if (e.target.files && e.target.files[0]) {
                    // Add new photo to currentLab.photos
                    const newKey = `photo${photoKeys.length+1}`;
                    currentLab.photos[newKey] = "new_photo.jpg"; // In real app, upload and get filename
                    renderLabPhotos(true);
                }
            };
            grid.appendChild(addBox);
        }
    }

    // --- Head of Lab ---
    function renderHeadOfLab() {
        const user = sampleUsers.find(u => u.id === selectedHeadId) || sampleUsers[0];
        // document.getElementById('headOfLabAvatar').src = user.avatar;
        // document.getElementById('headOfLabName').textContent = user.name;
    }
    document.getElementById('chooseHeadBtn').onclick = function() {
        renderHeadPicker();
        new bootstrap.Modal(document.getElementById('headPickerModal')).show();
    };
    function renderHeadPicker(filter = "") {
        const list = document.getElementById('headPickerList');
        list.innerHTML = '';
        const search = filter.trim().toLowerCase();
        sampleUsers.filter(user =>
            user.name.toLowerCase().includes(search) || user.id.toLowerCase().includes(search)
        ).forEach(user => {
            const card = document.createElement('div');
            card.className = 'col-12 col-sm-6 col-md-4 user-card' + (user.id === selectedHeadId ? ' selected' : '');
            card.innerHTML = `
                <img src="${user.avatar}" class="avatar me-3" alt="${user.name}">
                <span class="fw-semibold">${user.name}</span>
            `;
            card.onclick = function() {
                selectedHeadId = user.id;
                // renderHeadOfLab();
                bootstrap.Modal.getInstance(document.getElementById('headPickerModal')).hide();
            };
            list.appendChild(card);
        });
    }
    // Search for head picker
    document.getElementById('headPickerSearch').addEventListener('input', function() {
        renderHeadPicker(this.value);
    });

    // --- Lab Details Form ---
    function populateLabDetails(editMode = false) {
        document.getElementById('labNameHeader').textContent = "Modern Robotics Lab";
        document.getElementById('labName').value = "Modern Robotics Lab";
        document.getElementById('labDescription').value = currentLab.description || "";
        renderLabPhotos(editMode);
        // renderHeadOfLab();

        // Enable/disable fields
        document.getElementById('labName').readOnly = !editMode;
        document.getElementById('labDescription').readOnly = !editMode;
        document.getElementById('chooseHeadBtn').disabled = !editMode;
        console.log('all set to click');
        // Show/hide Save/Cancel
        document.getElementById('labEditActions').style.display = editMode ? '' : 'none';
        // Hide Edit button in edit mode
        document.getElementById('editLabBtn').style.display = editMode ? 'none' : '';
    }

    // --- Edit Button ---
    document.getElementById('editLabBtn').onclick = function() {
        populateLabDetails(true);
    };

    // --- Projects ---
    function renderProjectMembers(membersArr) {
        const container = document.getElementById('projectMembersList');
        container.innerHTML = '';
        membersArr.forEach(memberId => {
            const user = sampleMembers.find(u => u.id === memberId);
            if (!user) return;
            const chip = document.createElement('div');
            chip.className = 'project-member-chip';
            chip.innerHTML = `
                <img src="${user.avatar}" class="avatar-sm" alt="${user.name}">
                <span>${user.name}</span>
                <button type="button" class="remove-member-btn" title="Remove"><i class="fas fa-times"></i></button>
            `;
            chip.querySelector('.remove-member-btn').onclick = function() {
                selectedProjectMembers = selectedProjectMembers.filter(id => id !== memberId);
                renderProjectMembers(selectedProjectMembers);
            };
            container.appendChild(chip);
        });
    }

    function renderProjects() {
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '';
        Object.entries(currentLab.projects).forEach(([key, proj]) => {
            // Members with avatars
            const memberChips = Object.values(proj.members || {}).map(memberId => {
                const user = sampleMembers.find(u => u.id === memberId);
                if (!user) return '';
                return `<div class="project-member-chip mb-1">
                    <img src="${user.avatar}" class="avatar-sm" alt="${user.name}">
                    <span>${user.name}</span>
                </div>`;
            }).join('');
            // Tags
            const tags = Object.values(proj.tags || {}).map(tag => `<span class="badge bg-primary me-1">${tag}</span>`).join('');
            // Online sample image for each project
            const sampleImg = key === "project1"
                ? "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80"
                : key === "project2"
                    ? "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
                    : "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80";
            // Project row
            const row = document.createElement('div');
            row.className = 'project-card mb-3';
            row.innerHTML = `
                <div class="card w-100">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="fw-bold mb-0 text-primary">${proj.title}</h5>
                            <div>
                                <button class="btn btn-sm btn-outline-warning edit-project-btn me-1" data-key="${key}" title="Edit"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-outline-danger delete-project-btn" data-key="${key}" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="mb-2 project-description-truncate">${proj.description}</div>
                        <div class="mb-2"><strong>Lead:</strong> ${proj.project_lead}</div>
                        <div class="mb-2 project-members-list">${memberChips}</div>
                        <div class="mb-2">${tags}</div>
                        <div>
                            <a href="${proj.project_link}" target="_blank" class="btn btn-sm btn-outline-info mb-1">External Link</a>
                            ${proj.attachment ? `<a href="/media/${proj.attachment}" target="_blank" class="btn btn-sm btn-outline-primary mb-1 ms-2">Attachment</a>` : ''}
                        </div>
                    </div>
                    <img src="${sampleImg}" alt="Project Image" class="img-fluid rounded ms-3" style="max-width: 200px;max-height:140px;object-fit:cover;">
                </div>
            `;
            projectsList.appendChild(row);
        });

        // Attach edit/delete handlers
        projectsList.querySelectorAll('.edit-project-btn').forEach(btn => {
            btn.onclick = () => openProjectModal(btn.dataset.key);
        });
        projectsList.querySelectorAll('.delete-project-btn').forEach(btn => {
            btn.onclick = () => deleteProject(btn.dataset.key);
        });
    }

    // --- Project Modal Logic ---
    function openProjectModal(key) {
        editingProjectKey = key;
        const proj = currentLab.projects[key];
        document.getElementById('modalProjectTitle').textContent = key ? "Edit Project" : "Add Project";
        document.getElementById('projectTitle').value = proj?.title || "";
        document.getElementById('projectDesc').value = proj?.description || "";
        document.getElementById('projectLead').value = proj?.project_lead || "";
        document.getElementById('projectTags').value = proj?.tags ? Object.values(proj.tags).join(', ') : "";
        document.getElementById('projectLink').value = proj?.project_link || "";
        document.getElementById('projectPhotoPreview').style.display = proj?.project_photo ? "block" : "none";
        document.getElementById('projectPhotoPreview').src = proj?.project_photo ? `/media/${proj.project_photo}` : "";
        document.getElementById('projectPhoto').value = "";
        document.getElementById('projectDocPreview').style.display = proj?.attachment ? "block" : "none";
        if (proj?.attachment) {
            document.querySelector('#projectDocPreview a').href = `/media/${proj.attachment}`;
        }
        document.getElementById('projectDoc').value = "";

        // Members
        selectedProjectMembers = proj?.members ? Object.values(proj.members) : [];
        renderProjectMembers(selectedProjectMembers);

        // Show modal
        new bootstrap.Modal(document.getElementById('editProjectModal')).show();
    }

    // --- Project Member Picker Modal ---
    document.getElementById('chooseMembersBtn').onclick = function() {
        renderMemberPicker();
        // Set z-index higher for member picker modal
        document.getElementById('memberPickerModal').style.zIndex = 1081;
        new bootstrap.Modal(document.getElementById('memberPickerModal')).show();
    };
    function renderMemberPicker(filter = "") {
        const list = document.getElementById('memberPickerList');
        list.innerHTML = '';
        const search = filter.trim().toLowerCase();
        sampleMembers.filter(user =>
            user.name.toLowerCase().includes(search) || user.id.toLowerCase().includes(search)
        ).forEach(user => {
            const selected = selectedProjectMembers.includes(user.id);
            const card = document.createElement('div');
            card.className = 'col-12 col-sm-6 col-md-4 user-card' + (selected ? ' selected' : '');
            card.innerHTML = `
                <img src="${user.avatar}" class="avatar me-3" alt="${user.name}">
                <span class="fw-semibold">${user.name}</span>
                <span class="ms-auto">${selected ? '<i class="fas fa-check-circle text-primary"></i>' : ''}</span>
            `;
            card.onclick = function() {
                if (selected) {
                    selectedProjectMembers = selectedProjectMembers.filter(id => id !== user.id);
                } else {
                    selectedProjectMembers.push(user.id);
                }
                renderMemberPicker(document.getElementById('memberPickerSearch').value);
            };
            list.appendChild(card);
        });
        // On modal close, update members in modal
        document.getElementById('memberPickerModal').addEventListener('hidden.bs.modal', function handler() {
            renderProjectMembers(selectedProjectMembers);
            document.getElementById('memberPickerModal').removeEventListener('hidden.bs.modal', handler);
        });
    }
    // Search for member picker
    document.getElementById('memberPickerSearch').addEventListener('input', function() {
        renderMemberPicker(this.value);
    });

    // --- Project Photo Preview ---
    document.getElementById('projectPhoto').onchange = function(e) {
        const preview = document.getElementById('projectPhotoPreview');
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                preview.src = ev.target.result;
                preview.style.display = "block";
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // --- Project Doc Preview ---
    document.getElementById('projectDoc').onchange = function(e) {
        const preview = document.getElementById('projectDocPreview');
        if (e.target.files && e.target.files[0]) {
            preview.style.display = "block";
        }
    };

    // --- Save Project (add/edit) ---
    document.getElementById('editProjectForm').onsubmit = function(e) {
        e.preventDefault();
        // Gather data
        const title = document.getElementById('projectTitle').value;
        const description = document.getElementById('projectDesc').value;
        const project_lead = document.getElementById('projectLead').value;
        const tags = document.getElementById('projectTags').value.split(',').map(t => t.trim()).filter(Boolean);
        const project_link = document.getElementById('projectLink').value;
        // Members
        const members = {};
        selectedProjectMembers.forEach((id, idx) => {
            members[`member${idx+1}`] = id;
        });
        // For demo, skip file uploads
        const projObj = {
            title, description, project_lead,
            tags: Object.fromEntries(tags.map((t,i)=>[`tag${i+1}`,t])),
            members,
            project_photo: "", // handle file upload in real app
            attachment: "",
            project_link
        };
        if (editingProjectKey) {
            currentLab.projects[editingProjectKey] = projObj;
        } else {
            const newKey = `project${Object.keys(currentLab.projects).length+1}`;
            currentLab.projects[newKey] = projObj;
        }
        renderProjects();
        bootstrap.Modal.getInstance(document.getElementById('editProjectModal')).hide();
    };

    // --- Add Project Button ---
    document.getElementById('addProjectBtn').onclick = function() {
        editingProjectKey = null;
        selectedProjectMembers = [];
        openProjectModal(null);
    };

    // --- Delete Project ---
    function deleteProject(key) {
        if (confirm('Delete this project?')) {
            delete currentLab.projects[key];
            renderProjects();
        }
    }

    // --- Save Lab Details ---
    document.getElementById('labEditForm').onsubmit = function(e) {
        e.preventDefault();
        currentLab.description = document.getElementById('labDescription').value;
        currentLab.head_of_lab = selectedHeadId;
        // For demo, skip file uploads
        showToast('Lab details saved!');
        populateLabDetails(false);
    };

    // --- Cancel Edit ---
    document.getElementById('cancelEditBtn').onclick = function() {
        populateLabDetails(false);
    };

    // --- Initial Load ---
    populateLabDetails(false);
    renderProjects();

    // Simulate UniversityDetails JSON storage (replace with AJAX in real app)
    let universityLabs = JSON.parse(localStorage.getItem('universityLabs')) || {
        "lab1": {
            "description": "Sample Lab",
            "head_of_lab": "",
            "photos": { "photo1": "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" },
            "projects": {}
        }
    };


    document.addEventListener('DOMContentLoaded', function() {
        renderLabs();
    });
});