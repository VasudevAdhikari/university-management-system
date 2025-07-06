const fullLabDesc = document.getElementById('labDescText')
    ? document.getElementById('labDescText').getAttribute('data-full') || document.getElementById('labDescText').textContent.trim()
    : '';

function getFirstNWords(text, n) {
    return text.split(' ').slice(0, n).join(' ') + '...';
}

function setLabDesc(truncated) {
    const descText = document.getElementById('labDescText');
    const descToggle = document.getElementById('labDescToggle');
    if (truncated) {
        descText.textContent = getFirstNWords(fullLabDesc, 20);
        descToggle.innerHTML = '&#x25BC;';
    } else {
        descText.textContent = fullLabDesc;
        descToggle.innerHTML = '&#x25B2;';
    }
    descToggle.setAttribute('data-truncated', truncated ? '1' : '0');
}

function setupLabDescToggle() {
    const descToggle = document.getElementById('labDescToggle');
    descToggle.onclick = function () {
        const truncated = descToggle.getAttribute('data-truncated') === '1';
        setLabDesc(!truncated);
    };
    setLabDesc(true);
}

// Ensure setup runs after DOM is loaded and after toggling to Lab Details
document.addEventListener('DOMContentLoaded', function () {
    setupLabDescToggle();
});

// Utility to create and show the popup for editing
function showEditPopup(label, value, onSave, opts = {}) {
    // Remove any existing popup
    // alert(`${label} ${value}`);
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = `Edit ${label}`;
    popup.appendChild(title);

    // Input, textarea, or file
    let input;
    if (opts.file) {
        input = document.createElement('input');
        input.type = 'file';
        input.className = 'edit-popup-input';
        input.accept = opts.accept || '';
        popup.appendChild(input);
    } else if (opts.textarea) {
        input = document.createElement('textarea');
        input.className = 'edit-popup-textarea';
        input.value = value;
        input.rows = opts.rows || 8;
        input.style.resize = 'vertical';
        popup.appendChild(input);
    } else {
        input = document.createElement('input');
        input.className = 'edit-popup-input';
        input.type = 'text';
        input.value = value;
        popup.appendChild(input);
    }

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Save Changes';
    saveBtn.style.display = opts.file ? 'inline-block' : 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    // Show save button only if value changed (for text/textarea)
    if (!opts.file) {
        input.addEventListener('input', function () {
            saveBtn.style.display = input.value !== value ? 'inline-block' : 'none';
        });
    }

    // Save handler
    saveBtn.onclick = function () {
        if (opts.file) {
            if (!input.files || !input.files[0]) return;
            if (confirm('Are you sure you want to upload this file?')) {
                onSave(input.files[0]);
                document.body.removeChild(backdrop);
                location.reload();
            }
        } else {
            if (confirm('Are you sure you want to save changes?')) {
                onSave(input.value);
                document.body.removeChild(backdrop);
                location.reload();
            }
        }
    };

    // Cancel handler
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    // Close popup on backdrop click
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    input.focus();
}

// Attach edit icon click handlers for each editable-group
function setupEditIcons() {
    // Lab Name (main title)
    document.querySelectorAll('h1.editable-group .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Lab Name', document.querySelector('h1.editable-group').childNodes[0].textContent.trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { lab_name: val },
                    (response) => { location.reload(); },
                    (error) => { alert('Failed to update lab name'); }
                );
            });
        };
    });

    // Lab Location
    document.querySelectorAll('.lab-location .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Location', document.querySelector('.lab-location').textContent.replace('📍', '').replace('✎', '').trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { location: val },
                    (response) => { location.reload(); },
                    (error) => { alert('Failed to update lab location'); }
                );
            });
        };
    });

    // Head of Lab Name
    document.querySelectorAll('.lab-head-name .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Head Name', document.querySelector('.lab-head-name').childNodes[0].textContent.trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { head_of_lab: val },
                    (response) => { location.reload(); },
                    (error) => { alert('Failed to update head of lab'); }
                );
            });
        };
    });

    // Head of Lab Title (select from popup)
    document.querySelectorAll('.lab-head-title .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            const currentName = document.querySelector('.lab-head-title').childNodes[0].textContent.trim();
            showHeadSelectPopup(currentName, function (profile) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { head_of_lab: profile.id },
                    (response) => {location.reload(); },
                    (error) => { alert('Failed to update head of labjalkfjalk'); }
                );
            });
        };
    });

    // Head of Lab Dept
    document.querySelectorAll('.lab-head-dept .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup('Department', document.querySelector('.lab-head-dept').childNodes[0].textContent.trim(), function (val) {
                ajaxLabAPI(
                    `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                    'POST',
                    { department: val },
                    (response) => { location.reload(); },
                    (error) => { alert('Failed to update department'); }
                );
            });
        };
    });

    // Lab Description: use textarea in popup
    document.querySelectorAll('.lab-description .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            showEditPopup(
                'Lab Description',
                document.getElementById('labDescText').getAttribute('description'),
                function (val) {
                    ajaxLabAPI(
                        `/executives/api/labs/edit/${encodeURIComponent(window.currentLabKey)}/`,
                        'POST',
                        { description: val },
                        (response) => { location.reload(); },
                        (error) => { alert('Failed to update lab description'); }
                    );
                },
                { textarea: true, rows: 20 }
            );
        };
    });

    // Lab Photos Title (not a real field, so skip API)

    // Lab Photo Images: add delete button instead of edit icon
    document.querySelectorAll('.lab-photo').forEach((img, idx) => {
        // Remove any existing edit icon for photos
        const editIcon = img.parentElement.querySelector('.edit-icon-photo');
        if (editIcon) editIcon.remove();

        // Add delete button if not already present
        if (!img.parentElement.querySelector('.delete-photo-btn')) {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-photo-btn';
            delBtn.title = 'Delete Photo';
            delBtn.innerHTML = '<i class="fa fa-trash"></i>';
            delBtn.onclick = function (e) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this photo?')) {
                    ajaxLabAPI(
                        `/executives/api/labs/delete_photo/${encodeURIComponent(window.currentLabKey)}/`,
                        'POST',
                        { photo_key: img.src },
                        (response) => { location.reload(); },
                        (error) => { alert('Failed to delete photo'); }
                    );
                }
            };
            img.parentElement.appendChild(delBtn);
        }
    });

    // Project Name
    document.querySelectorAll('.project-title.editable-group .edit-icon').forEach(icon => {
        icon.onclick = function (e) {
            e.stopPropagation();
            const titleElem = icon.parentElement;
            const projectId = titleElem.closest('.project-card').getAttribute('data-project-id');
            showEditPopup('Project Name', titleElem.childNodes[0].textContent.trim(), function (val) {
                updateProject(window.currentLabKey, projectId, { title: val }, null, () => location.reload());
            });
        };
    });

    // Project Tags
    document.querySelectorAll('.project-header .project-tags .project-tags-edit').forEach(editIcon => {
        editIcon.onclick = function (e) {
            e.stopPropagation();
            const tagsDiv = editIcon.parentElement;
            const tagSpans = Array.from(tagsDiv.querySelectorAll('.project-tag'));
            const tagsValue = tagSpans.map(t => t.textContent.trim()).join(', ');
            const projectId = tagsDiv.closest('.project-card').getAttribute('data-project-id');
            showEditPopup('Project Tags', tagsValue, function (val) {
                if (confirm('Are you sure you want to save these tags?')) {
                    const tagsObj = {};
                    val.split(',').forEach((tag, idx) => { tagsObj[`tag${idx+1}`] = tag.trim(); });
                    updateProject(window.currentLabKey, projectId, { tags: tagsObj }, null, () => location.reload());
                }
            });
        };
    });

    // Project Description
    document.querySelectorAll('.project-desc-block .project-desc-text').forEach(descElem => {
        const projectId = descElem.closest('.project-card').getAttribute('data-project-id');
        if (!descElem.parentElement.querySelector('.edit-icon')) {
            const editIcon = document.createElement('span');
            editIcon.className = 'edit-icon';
            editIcon.title = 'Edit';
            editIcon.innerHTML = '&#9998;';
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup(
                    'Project Description',
                    descElem.getAttribute('data-full') || descElem.textContent,
                    function (val) {
                        updateProject(window.currentLabKey, projectId, { description: val }, null, () => location.reload());
                    },
                    { textarea: true, rows: 10 }
                );
            };
            descElem.parentElement.appendChild(editIcon);
        }
        descElem.style.cursor = 'pointer';
    });

    // Project Demo Link
    document.querySelectorAll('.project-links-block .editable-group').forEach(group => {
        const link = group.querySelector('a.project-link');
        const editIcon = group.querySelector('.edit-icon');
        const projectId = group.closest('.project-card') ? group.closest('.project-card').getAttribute('data-project-id') : null;
        if (link && editIcon && link.href && link.href.includes('example.com') && projectId) {
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup('Live Demo Link', link.href, function (val) {
                    updateProject(window.currentLabKey, projectId, { project_demo: val }, null, () => location.reload());
                });
            };
        }
    });

    // Project GitHub Link
    document.querySelectorAll('.project-links-block .editable-group').forEach(group => {
        const link = group.querySelector('a.project-link');
        const editIcon = group.querySelector('.edit-icon');
        const projectId = group.closest('.project-card') ? group.closest('.project-card').getAttribute('data-project-id') : null;
        if (link && editIcon && link.href && link.href.includes('github.com') && projectId) {
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup('GitHub Link', link.href, function (val) {
                    updateProject(window.currentLabKey, projectId, { project_link: val }, null, () => location.reload());
                });
            };
        }
    });

    // Project Attachment (file)
    document.querySelectorAll('.project-links-block .editable-group').forEach(group => {
        const link = group.querySelector('a.project-link.project-attachment-link');
        const editIcon = group.querySelector('.edit-icon');
        const projectId = group.closest('.project-card') ? group.closest('.project-card').getAttribute('data-project-id') : null;
        if (link && editIcon && projectId) {
            editIcon.onclick = function (e) {
                e.stopPropagation();
                showEditPopup('Project Attachment', '', function (file) {
                    updateProject(window.currentLabKey, projectId, {}, { attachment: file }, () => location.reload());
                }, { file: true, accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" });
            };
        }
    });

    // Project Photo
    document.querySelectorAll('.project-photo-block .project-photo').forEach(img => {
        img.onclick = function (e) {
            e.stopPropagation();
            if (window.editor) {
                const projectId = img.closest('.project-card').getAttribute('data-project-id');
                showProjectPhotoEditPopup(img.src, function (file) {
                    updateProject(window.currentLabKey, projectId, {}, { project_photo: file }, () => location.reload());
                });
            }
        };
        img.style.cursor = 'pointer';
        img.title = 'Edit Photo';
    });

    // Project Leader
    document.querySelectorAll('.project-leader-block .edit-icon').forEach(editIcon => {
        editIcon.onclick = function (e) {
            e.stopPropagation();
            const leaderSpan = editIcon.parentElement.querySelector('.project-leader-name');
            const currentName = leaderSpan ? leaderSpan.textContent.replace('(Leader)', '').trim() : '';
            const projectId = editIcon.closest('.project-card').getAttribute('data-project-id');
            showProjectLeaderSelectPopup(currentName, function (selectedLeader) {
                // selectedLeader is a name, but we want to send the user id
                // Find the user id from allProjectLeaders
                let userObj = window.allProjectLeaders.find(u => u.name === selectedLeader);
                let userId = userObj ? userObj.id : null;
                if (userId) {
                    updateProject(window.currentLabKey, projectId, { project_lead: userId }, null, () => location.reload());
                } else {
                    alert('Could not find user for leader');
                }
            });
        };
    });

    // Project Members (add/remove)
    document.querySelectorAll('.project-member .fa-trash, .project-member .fa.fa-trash').forEach(delIcon => {
        delIcon.onclick = function (e) {
            e.stopPropagation();
            const memberElem = delIcon.closest('.project-member');
            const name = memberElem.querySelector('.project-member-name').textContent.trim();
            const projectId = memberElem.closest('.project-card').getAttribute('data-project-id');
            updateProject(window.currentLabKey, projectId, { remove_member: name }, null, () => location.reload());
        };
    });

    document.querySelectorAll('.project-members-list .fa-plus, .project-members-list .fa.fa-plus').forEach(plusIcon => {
        plusIcon.onclick = function (e) {
            e.stopPropagation();
            const membersList = plusIcon.closest('.project-members-list');
            const projectId = membersList.closest('.project-card').getAttribute('data-project-id');
            const currentMembers = Array.from(membersList.querySelectorAll('.project-member-name')).map(n => n.textContent.trim());
            showProjectMembersSelectPopup(currentMembers, function (selectedMembers) {
                // Find user ids for selected members
                let userIds = selectedMembers.map(name => {
                    let userObj = window.allProjectMembers.find(u => u.name === name);
                    return userObj ? userObj.id : null;
                }).filter(Boolean);
                updateProject(window.currentLabKey, projectId, { add_members: userIds }, null, () => location.reload());
            });
        };
    });
}

// Call setupEditIcons after DOMContentLoaded and after toggling to Lab Details
document.addEventListener('DOMContentLoaded', function () {
    setupLabDescToggle();
    setupEditIcons();
});

// Project description show more/less logic
function setupProjectDescToggles() {
    document.querySelectorAll('.project-desc-toggle').forEach(toggle => {
        const target = toggle.getAttribute('data-target');
        const descSpan = document.getElementById('projectDescText' + target);
        if (!descSpan) return;
        const fullText = descSpan.getAttribute('data-full') || descSpan.textContent.trim();
        function setDesc(truncated) {
            if (truncated) {
                descSpan.textContent = fullText.split(' ').slice(0, 25).join(' ') + '...';
                toggle.innerHTML = '&#x25BC;';
            } else {
                descSpan.textContent = fullText;
                toggle.innerHTML = '&#x25B2;';
            }
            toggle.setAttribute('data-truncated', truncated ? '1' : '0');
        }
        toggle.onclick = function () {
            const truncated = toggle.getAttribute('data-truncated') === '1';
            setDesc(!truncated);
        };
        setDesc(true);
    });
}

// Call setupProjectDescToggles after DOMContentLoaded and after toggling to Lab Details
document.addEventListener('DOMContentLoaded', function () {
    setupLabDescToggle();
    setupEditIcons();
    setupProjectDescToggles();
});

function showSection(section) {
    const labBtn = document.getElementById('labBtn');
    const projectsBtn = document.getElementById('projectsBtn');
    const labSection = document.getElementById('labSection');
    const projectsSection = document.getElementById('projectsSection');
    if (section === 'lab') {
        labBtn.classList.add('active');
        projectsBtn.classList.remove('active');
        labSection.style.display = '';
        projectsSection.style.display = 'none';
        setupLabDescToggle();
        setupEditIcons();
    } else {
        labBtn.classList.remove('active');
        projectsBtn.classList.add('active');
        labSection.style.display = 'none';
        projectsSection.style.display = '';
        setupProjectDescToggles();
    }
}

// Example profiles data (replace with real data from server)
const labProfiles = window.allLabHeads;


// Show popup for selecting head of lab
function showHeadSelectPopup(currentName, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Select Head of Lab';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search by name...';
    popup.appendChild(search);

    // Profiles list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Render profiles
    function renderProfiles(filter) {
        list.innerHTML = '';
        labProfiles
            .filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(profile => {
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (profile.name === currentName) item.classList.add('selected');
                item.innerHTML = `
                    <img src="${profile.img}" alt="${profile.name}" class="profile-select-img">
                    <span class="profile-select-name">${profile.name}</span>
                `;
                item.onclick = function () {
                    if (confirm(`Set "${profile.name}" as Head of Lab?`)) {
                        onSave(profile);
                        document.body.removeChild(backdrop);
                        location.reload();
                    }
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No profiles found.';
            list.appendChild(nores);
        }
    }
    renderProfiles('');

    // Search handler
    search.oninput = function () {
        renderProfiles(search.value);
    };

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };
    popup.appendChild(cancelBtn);

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Example project members data (replace with real data from server)
const allProjectMembers = window.allProjectMembers

// Show popup for selecting project members (multi-select)
function showProjectMembersSelectPopup(currentMembers, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Add Project Members';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search by name...';
    popup.appendChild(search);

    // Members list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Add Selected';
    saveBtn.style.display = 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    // Multi-select logic
    let selected = [];
    function renderProfiles(filter) {
        list.innerHTML = '';
        allProjectMembers
            .filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(profile => {
                const alreadyMember = currentMembers.includes(profile.name);
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (selected.includes(profile.name)) item.classList.add('selected');
                if (alreadyMember) item.style.opacity = '0.5';
                item.innerHTML = `
                    <img src="${profile.img}" alt="${profile.name}" class="profile-select-img">
                    <span class="profile-select-name">${profile.name}</span>
                `;
                item.onclick = function () {
                    if (alreadyMember) return;
                    if (selected.includes(profile.name)) {
                        selected = selected.filter(n => n !== profile.name);
                    } else {
                        selected.push(profile.name);
                    }
                    renderProfiles(search.value);
                    saveBtn.style.display = selected.length > 0 ? 'inline-block' : 'none';
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No members found.';
            list.appendChild(nores);
        }
    }
    renderProfiles('');

    // Search handler
    search.oninput = function () {
        renderProfiles(search.value);
    };

    // Save handler
    saveBtn.onclick = function () {
        if (selected.length > 0 && confirm('Add selected member(s) to project?')) {
            onSave(selected);
            document.body.removeChild(backdrop);
            location.reload();
        }
    };

    // Cancel handler
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Example project leaders data (replace with real data from server)
const allProjectLeaders = window.allProjectLeaders

// Show popup for selecting project leader (single-select)
function showProjectLeaderSelectPopup(currentName, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Select Project Leader';
    popup.appendChild(title);

    // Search box
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'edit-popup-input';
    search.placeholder = 'Search by name...';
    popup.appendChild(search);

    // Profiles list
    const list = document.createElement('div');
    list.className = 'profile-select-list';
    popup.appendChild(list);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    let selected = null;
    function renderProfiles(filter) {
        list.innerHTML = '';
        allProjectLeaders
            .filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(profile => {
                const item = document.createElement('div');
                item.className = 'profile-select-item';
                if (profile.name === (selected || currentName)) item.classList.add('selected');
                item.innerHTML = `
                    <img src="${profile.img}" alt="${profile.name}" class="profile-select-img">
                    <span class="profile-select-name">${profile.name}</span>
                `;
                item.onclick = function () {
                    selected = profile.name;
                    renderProfiles(search.value);
                    saveBtn.style.display = 'inline-block';
                };
                list.appendChild(item);
            });
        if (!list.childNodes.length) {
            const nores = document.createElement('div');
            nores.className = 'profile-select-nores';
            nores.textContent = 'No leaders found.';
            list.appendChild(nores);
        }
    }
    renderProfiles('');

    search.oninput = function () {
        renderProfiles(search.value);
    };

    saveBtn.onclick = function () {
        if (selected && confirm('Set selected leader for this project?')) {
            onSave(selected);
            document.body.removeChild(backdrop);
            location.reload();
        }
    };

    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    search.focus();
}

// Show popup for editing project photo
function showProjectPhotoEditPopup(currentImgUrl, onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Edit Project Photo';
    popup.appendChild(title);

    // Image preview
    const preview = document.createElement('img');
    preview.className = 'edit-popup-img-preview';
    preview.style.maxHeight = '200px';
    preview.style.objectFit = 'contain';
    preview.style.display = currentImgUrl ? 'block' : 'none';
    if (currentImgUrl) preview.src = currentImgUrl;
    popup.appendChild(preview);

    // File input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'edit-popup-input';
    popup.appendChild(input);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';
    popup.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    popup.appendChild(cancelBtn);

    // File change handler
    input.onchange = function () {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                saveBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    // Save handler
    saveBtn.onclick = function () {
        if (input.files && input.files[0]) {
            if (confirm('Are you sure you want to update the project photo?')) {
                onSave(input.files[0]);
                document.body.removeChild(backdrop);
                location.reload();
            }
        }
    };

    // Cancel handler
    cancelBtn.onclick = function () {
        document.body.removeChild(backdrop);
    };

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    input.focus();
}

function showAddProjectPopup(onSave) {
    // Remove any existing popup
    const existing = document.getElementById('edit-popup-backdrop');
    if (existing) existing.remove();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'edit-popup-backdrop';
    backdrop.className = 'edit-popup-backdrop';

    // Popup
    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    popup.id = 'add-project-popup'
    popup.style.maxWidth = '480px';

    // Title
    const title = document.createElement('div');
    title.className = 'edit-popup-title';
    title.textContent = 'Add New Project';
    popup.appendChild(title);

    // Form
    const form = document.createElement('form');
    form.className = 'add-project-form';

    // Project Name
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Project Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-popup-input';
    nameInput.required = true;
    form.appendChild(nameLabel);
    form.appendChild(nameInput);

    // Project Photo
    const photoLabel = document.createElement('label');
    photoLabel.textContent = 'Project Photo';
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.className = 'edit-popup-input';
    const photoPreview = document.createElement('img');
    photoPreview.className = 'edit-popup-img-preview';
    photoPreview.style.maxWidth = '100%';
    photoPreview.style.maxHeight = '180px';
    photoPreview.style.display = 'none';
    form.appendChild(photoLabel);
    form.appendChild(photoInput);
    form.appendChild(photoPreview);

    // Project Tags
    const tagsLabel = document.createElement('label');
    tagsLabel.textContent = 'Project Tags (comma separated)';
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.className = 'edit-popup-input';
    form.appendChild(tagsLabel);
    form.appendChild(tagsInput);

    // Project External Link
    const extLabel = document.createElement('label');
    extLabel.textContent = 'External Link';
    const extInput = document.createElement('input');
    extInput.type = 'url';
    extInput.className = 'edit-popup-input';
    form.appendChild(extLabel);
    form.appendChild(extInput);

    // Live Demo Link
    const liveLabel = document.createElement('label');
    liveLabel.textContent = 'Live Demo Link';
    const liveInput = document.createElement('input');
    liveInput.type = 'url';
    liveInput.className = 'edit-popup-input';
    form.appendChild(liveLabel);
    form.appendChild(liveInput);

    // Attachment
    const attachLabel = document.createElement('label');
    attachLabel.textContent = 'Attachment (PDF)';
    const attachInput = document.createElement('input');
    attachInput.type = 'file';
    attachInput.accept = '.pdf,application/pdf';
    attachInput.className = 'edit-popup-input';
    form.appendChild(attachLabel);
    form.appendChild(attachInput);

    // Project Description
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Project Description';
    const descInput = document.createElement('textarea');
    descInput.className = 'edit-popup-input';
    descInput.rows = 4;
    descInput.required = true;
    form.appendChild(descLabel);
    form.appendChild(descInput);

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'edit-popup-save';
    saveBtn.textContent = 'Add Project';
    saveBtn.style.marginTop = '18px';
    form.appendChild(saveBtn);

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'edit-popup-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginLeft = '10px';
    form.appendChild(cancelBtn);

    // Image preview logic
    photoInput.onchange = function () {
        if (photoInput.files && photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(photoInput.files[0]);
        }
    };

    // Cancel handler
    cancelBtn.onclick = function (e) {
        e.preventDefault();
        document.body.removeChild(backdrop);
    };

    // Form submit handler
    form.onsubmit = function (e) {
        e.preventDefault();
        if (!nameInput.value.trim() || !descInput.value.trim()) {
            alert('Please fill in required fields.');
            return;
        }
        if (confirm('Add this project?')) {
            onSave({
                name: nameInput.value.trim(),
                photo: photoInput.files[0] || null,
                tags: tagsInput.value.trim(),
                external: extInput.value.trim(),
                live: liveInput.value.trim(),
                attachment: attachInput.files[0] || null,
                desc: descInput.value.trim()
            });
            document.body.removeChild(backdrop);
            location.reload();
        }
    };

    // Backdrop click closes popup
    backdrop.onclick = function (e) {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    };

    popup.appendChild(form);
    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    nameInput.focus();
}

// Add new project button
const addBtn = document.getElementById('addProjectBtn');
if (addBtn) {
    addBtn.onclick = function () {
        showAddProjectPopup(function (projectData) {
            // Use FormData if there are files, else JSON
            const data = {
                name: projectData.name,
                desc: projectData.desc,
                tags: projectData.tags,
                external: projectData.external,
                live: projectData.live,
            };
            const files = {};
            if (projectData.photo) files.project_photo = projectData.photo;
            if (projectData.attachment) files.attachment = projectData.attachment;
            // Optionally add project_lead and members as ids if available
            if (projectData.project_lead_id) data.project_lead = projectData.project_lead_id;
            if (projectData.member_ids) data.members = projectData.member_ids;
            const url = `/executives/api/labs/add_project/${encodeURIComponent(window.currentLabKey)}/`;
            if (files.project_photo || files.attachment) {
                const formData = new FormData();
                for (const k in data) formData.append(k, data[k]);
                if (files.project_photo) formData.append('project_photo', files.project_photo);
                if (files.attachment) formData.append('attachment', files.attachment);
                fetch(url, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
                    body: formData
                })
                .then(res => res.json())
                .then(function(resp) {
                    if (resp.success) {
                        location.reload();
                    } else {
                        alert('Failed to add project');
                    }
                })
                .catch(() => alert('AJAX error'));
            } else {
                ajaxLabAPI(
                    url,
                    'POST',
                    data,
                    function(resp) {
                        if (resp.success) {
                            location.reload();
                        } else {
                            alert('Failed to add project');
                        }
                    },
                    function() { alert('AJAX error'); }
                );
            }
        });
    };
}

// Utility for AJAX
function ajaxLabAPI(url, method, data, onSuccess, onError) {
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || ''
        },
        body: data ? JSON.stringify(data) : undefined
    })
    .then(res => res.json())
    .then(onSuccess)
    .catch(onError || (err => alert('AJAX error: ' + err)));
}

// Utility to update project via AJAX (handles file and non-file fields)
function updateProject(labKey, projectId, data, files, cb) {
    if (files && (files.project_photo || files.attachment)) {
        const formData = new FormData();
        for (const k in data) formData.append(k, typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);
        if (files.project_photo) formData.append('project_photo', files.project_photo);
        if (files.attachment) formData.append('attachment', files.attachment);
        fetch(`/executives/api/labs/edit_project/${encodeURIComponent(labKey)}/${encodeURIComponent(projectId)}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
            body: formData
        })
        .then(res => res.json())
        .then(cb)
        .catch(() => alert('AJAX error'));
    } else {
        ajaxLabAPI(
            `/executives/api/labs/edit_project/${encodeURIComponent(labKey)}/${encodeURIComponent(projectId)}/`,
            'POST',
            data,
            cb,
            () => alert('AJAX error')
        );
    }
}

// Add this function to handle photo upload via AJAX
function addLabPhoto(labKey, file, cb) {
    const formData = new FormData();
    formData.append('photo', file);
    alert('gonna go to submit photo');
    fetch(`/executives/api/labs/add_photo/${encodeURIComponent(labKey)}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
        body: formData
    })
    .then(res => res.json())
    .then(cb)
    .catch(err => alert('AJAX error: ' + err));
}

// Update handlePhotoInputChange to use the above function
function handlePhotoInputChange(e) {
    const fileInput = e.target;
    if (fileInput.files && fileInput.files[0]) {
        if (confirm('Are you sure you want to add this image?')) {
            alert('something');
            addLabPhoto(window.currentLabKey, fileInput.files[0], function(resp) {
                if (resp.success) {
                    alert("successful");
                    // location.reload();
                } else {
                    alert('Failed to add photo');
                }
            });
        } else {
            fileInput.value = '';
        }
    }
}
//             alert('Failed to delete project');
//         }
//     });
// }

// // Example: Add Lab Photo
// function addLabPhoto(lab_id, file, cb) {
//     const formData = new FormData();
//     formData.append('photo', file);
//     fetch(`/executives/api/labs/add_photo/${lab_id}/`, {
//         method: 'POST',
//         headers: { 'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '' },
//         body: formData
//     })
//     .then(res => res.json())
//     .then(cb)
//     .catch(err => alert('AJAX error: ' + err));
// }
//     .then(cb)
//     .catch(err => alert('AJAX error: ' + err));
// }
//         body: data ? JSON.stringify(data) : undefined
//     })
//     .then(res => res.json())
//     .then(onSuccess)
