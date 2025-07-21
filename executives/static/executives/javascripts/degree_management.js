const DEGREE_KEY = 'degrees_data_v1';
//localStorage.removeItem(DEGREE_KEY); 

// Get degrees from localStorage or use mock data if not present
function getDegrees() {
  // const data = localStorage.getItem(DEGREE_KEY);
  const data = window.ALL_DEGREES;
  if (data) return data;
}

function renderDegrees(degrees) {
  const grid = document.getElementById('degreeGrid');
  grid.innerHTML = '';
  if (degrees) degrees.forEach((degree, index) => {
    const card = document.createElement('div');
    card.className = 'degree-card';
    card.innerHTML = `
      <div class="degree-img">
        <img src="${degree.image}" alt="${degree.title}">
      </div>
      <h2>${degree.title}</h2>
      <p>Degree Code: ${degree.code}</p>
      <p>Duration (Years): ${degree.duration}</p>
      <p>Total Credit: ${degree.credit}</p>
      <p>Total Courses: ${degree.courses}</p>
      <p>Faculty : ${degree.faculty.name}</p>
      <div class="card-actions">
        <button class="view-btn">View</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    // View button functionality
    card.querySelector('.view-btn').onclick = function () {
      showDegreeDetailsModal(degree);
    };
    // Delete button functionality
    card.querySelector('.delete-btn').onclick = function () {
      showDeleteConfirm(() => {
        // Redirect to backend delete URL
        if (degree.id) {
          window.location.href = `/executives/degree/delete/${degree.id}`;
        } else if (degree.code) {
          window.location.href = `/executives/degree/delete/${degree.code}`;
        } else {
          showWarningBox('Cannot delete: degree ID or code missing.');
        }
      });
    };
    grid.appendChild(card);
  });
}

// Show degree details modal
function showDegreeDetailsModal(degree, degreeIndex = null, isAddMode = false) {
  // Remove existing modal if any
  const oldModal = document.getElementById('degreeDetailsModal');
  if (oldModal) oldModal.remove();

  // Clone degree object for editing
  let editing = isAddMode ? true : false;
  let tempDegree = JSON.parse(JSON.stringify(degree));
  let selectedFaculty = degree.faculty || null;
  const modal = document.createElement('div');
  modal.id = 'degreeDetailsModal';
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.25)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 4000;

  function renderModalContent() {
    // Calculate totals
    let totalCredit = 0, totalCourses = 0, totalHours = 0;
    if (tempDegree.syllabus && tempDegree.syllabus.length) {
      tempDegree.syllabus.forEach(sem => {
        let semWeeks = sem.total_weeks || 16;
        sem.courses.forEach(course => {
          totalCredit += Number(course.credit) || 0;
          totalHours += (Number(course.hours) || 0) * semWeeks;
        });
        totalCourses += sem.courses.length;
      });
    }

    // Editable fields or static text
    function field(name, value, type = "text", extra = "") {
      return editing
        ? `<input type="${type}" id="edit-${name}" value="${value}" style="width:98%;padding:6px 8px;border-radius:6px;border:1px solid #ccc;font-size:1rem;" ${extra}>`
        : `<span>${value}</span>`;
    }

    // Editable image
    const imageHtml = `
      <img id="degreeImagePreview" src="${tempDegree.image}" alt="Degree Image" style="width:100px;height:100px;object-fit:cover;border-radius:50%;border:1px solid #ccc;">
      <br>
      ${editing ? `
      <label style="margin-top:10px;display:inline-block;cursor:pointer;">
        <input type="file" id="degreeImageInput" accept="image/*" style="display:none;">
        <span style="background:#444;color:#fff;padding:8px 18px;border-radius:8px;border:none;cursor:pointer;display:inline-block;">Upload</span>
      </label>` : ""}
    `;

    // Editable courses table
    let semestersHtml = '';
    if (tempDegree.syllabus && tempDegree.syllabus.length) {
      semestersHtml = tempDegree.syllabus.map((sem, sIdx) => {
        let semCredit = 0, semHours = 0;
        // Add total_weeks field if not present
        if (editing && (typeof sem.total_weeks === 'undefined' || sem.total_weeks === null)) {
          sem.total_weeks = 16;
        }
        const rows = sem.courses.map((course, cIdx) => {
          semCredit += Number(course.credit) || 0;
          semHours += Number(course.hours) || 0;
          return editing ? `
            <tr>
              <td><span>${course.code}</span></td>
              <td><span>${course.title}</span></td>
              <td><span>${course.credit}</span></td>
              <td><span>${course.hours}</span></td>
              <td>
                <select data-sem="${sIdx}" data-course="${cIdx}" class="edit-course-field" data-field="type" style="width:120px">
                  <option value="Core" ${course.type === "Core" ? "selected" : ""}>Core</option>
                  <option value="Elective" ${course.type === "Elective" ? "selected" : ""}>Elective</option>
                  <option value="Supporting" ${course.type === "Supporting" ? "selected" : ""}>Supporting</option>
                  <option value="Extra Curricular" ${course.type === "Extra Curricular" ? "selected" : ""}>Extra Curricular</option>
                </select>
              </td>
              <td>
                <button class="remove-course-btn" data-sem="${sIdx}" data-course="${cIdx}" style="color:#ff3b3b;background:none;border:none;font-size:1.2rem;cursor:pointer;" title="Remove"><i class="fa fa-trash"></i></button>
              </td>
            </tr>
          ` : `
            <tr>
              <td style="padding:8px 12px; text-align:left;">${course.code}</td>
              <td style="padding:8px 12px; text-align:left;">${course.title}</td>
              <td style="padding:8px 12px; text-align:center;">${course.credit}</td>
              <td style="padding:8px 12px; text-align:center;">${course.hours}</td>
              <td style="padding:8px 12px; text-align:center;">${course.type}</td>
            </tr>
          `;
        }).join('');
        return `
          <details style="margin-bottom:14px; border-radius:8px; border:1px solid #e3f2fd; background:#f9fbfd;" ${editing ? "open" : ""}>
            <summary style="font-weight:600; font-size:1.1rem; color:#1da1ff; padding:10px 14px; cursor:pointer; outline:none;">
              Semester ${sem.semester}
              ${editing ? `<button class="remove-semester-btn" data-sem="${sIdx}" style="margin-left:12px;color:#ff3b3b;background:none;border:none;font-size:1.1rem;cursor:pointer;" title="Remove Semester"><i class="fa fa-trash"></i></button>` : ""}
            </summary>
            <div style="padding:12px 18px 8px 18px;">
              <div style="margin-bottom:8px;">
                <label style="font-weight:500;">Total Weeks to Study: </label>
                ${editing ? `<input type='number' min='1' max='52' value='${sem.total_weeks}' data-sem-weeks='${sIdx}' class='edit-semester-weeks' style='width:60px;padding:4px 6px;border-radius:6px;border:1px solid #ccc;font-size:1rem;'>` : `<span>${sem.total_weeks || 16}</span>`}
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#e3f2fd;">
                    <th style="padding:8px 12px; text-align:left;">Code</th>
                    <th style="padding:8px 12px; text-align:left;">Title</th>
                    <th style="padding:8px 12px; text-align:center;">Credit</th>
                    <th style="padding:8px 12px; text-align:center;">Hours</th>
                    <th style="padding:8px 12px; text-align:center;">Type</th>
                    ${editing ? `<th></th>` : ""}
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div style="text-align:right;font-size:1rem; margin-top:8px;">
                <b>Total Credits:</b> ${semCredit} &nbsp; | &nbsp; <b>Total Hours:</b> ${semHours}
              </div>
              ${editing ? `<button type="button" class="add-course-btn" data-sem="${sIdx}" style="margin-top:8px;background:#1da1ff;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;"><i class="fa fa-plus"></i> Add Course</button>` : ""}
            </div>
          </details>
        `;
      }).join('');
    } else {
      semestersHtml = `<div style=\"color:#888;\">No syllabus data available.</div>`;
    }

    // Faculty selection UI and Degree Description textarea
    let facultyHtml = '';
    if (editing) {
      facultyHtml = `x
        <div style="margin-bottom:16px;">
          <label style="font-weight:600;">Faculty</label><br>
          <button id="chooseFacultyBtn" style="margin-top:6px;background:#1da1ff;color:#fff;border:none;padding:6px 18px;border-radius:8px;cursor:pointer;">
            ${selectedFaculty ? `<img src="${window.ALL_FACULTIES.find(faculty => faculty.id === selectedFaculty.id).photo}" alt="Faculty Photo" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;">${selectedFaculty.name}` : 'Choose Faculty'}
          </button>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-weight:600;">Degree Description</label><br>
          <textarea id="edit-description" style="width:98%;min-height:70px;max-height:180px;padding:8px 10px;border-radius:6px;border:1px solid #ccc;font-size:1rem;resize:vertical;">${tempDegree.description ? tempDegree.description : ''}</textarea>
        </div>
      `;
    } else {
      facultyHtml = `<div style="margin-bottom:16px;"><label style="font-weight:600;">Faculty</label><br>${selectedFaculty ? `<img src="${window.ALL_FACULTIES.find(faculty => faculty.id === selectedFaculty.id).photo}" alt="Faculty Photo" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;">${selectedFaculty.name}` : '<span style="color:#888;">Not chosen</span>'}</div>`;
      facultyHtml += `<div style=\"margin-bottom:16px;\"><label style=\"font-weight:600;\">Degree Description</label><br><div style=\"white-space:pre-wrap;color:#444;\">${tempDegree.description ? tempDegree.description : '<span style=\"color:#888;\">No description</span>'}</div></div>`;
    }

    // Modal actions
    let actionsHtml = '';
    if (editing) {
      actionsHtml = `
        <button id="saveDegreeBtn" title="Save" class="modal-action-btn"><i class="fa-solid fa-floppy-disk"></i> Save</button>:
        <button id="cancelEditBtn" title="Cancel" class="modal-action-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>
      `;
    } else {
      actionsHtml = `
        <button id="editDegreeBtn" title="Edit" class="modal-action-btn"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
        <button id="closeDegreeDetailsBtn" title="Close" class="modal-action-btn"><i class="fa-solid fa-xmark"></i></button>
      `;
    }

    modal.innerHTML = `
      <div style="
        background: #fff;
        border-radius: 18px;
        padding: 32px 28px 24px 28px;
        box-shadow: 0 8px 32px rgba(44,44,44,0.13), 0 2px 8px rgba(0,0,0,0.08);
        font-family: 'Poppins', Arial, sans-serif;
        min-width: 340px;
        max-width: 98vw;
        width: 700px;
        position: relative;
        display: flex;
        flex-direction: column;
        height: 90vh;
        max-height: 90vh;
        overflow: hidden;
      ">
        <div class="modal-actions">
          ${actionsHtml}
        </div>
        <h2 style="margin-top:0;font-size:1.35rem;color:#1da1ff;letter-spacing:1px;">Degree Details</h2>
        <div class="degree-details-sticky" style="background:#fff;z-index:2;">
          <table style="width:100%;margin-bottom:18px;">
            <tr>
              <td style="font-weight:600;">Name</td>
              <td>${field("title", tempDegree.title)}</td>
              <td rowspan="6" style="text-align:center;vertical-align:middle;">
                ${imageHtml}
              </td>
            </tr>
            <tr>
              <td style="font-weight:600;">Degree Code</td>
              <td>${field("code", tempDegree.code)}</td>
            </tr>
            <tr>
              <td style="font-weight:600;">Duration (Years)</td>
              <td>${field("duration", tempDegree.duration)}</td>
            </tr>
            <tr>
              <td colspan="2">${facultyHtml}</td>
            </tr>
            <tr>
              <td style="font-weight:600;">Total Credits</td>
              <td id="totalCreditCell">${totalCredit}</td>
            </tr>
            <tr>
              <td style="font-weight:600;">Total Courses</td>
              <td id="totalCoursesCell">${totalCourses}</td>
            </tr>
            <tr>
              <td style="font-weight:600;">Total Hours</td>
              <td id="totalHoursCell">${totalHours}</td>
            </tr>
          </table>
        </div>
        <div class="syllabus-scrollable" style="flex:1 1 auto;overflow-y:auto;padding-top:0;margin-top:0;">
          <div style="border-top:1px solid #aaa;padding-top:14px;">
            <b style="font-size:1.1rem;">Syllabus Structure</b>
            <div style="margin-top:10px;">
              ${semestersHtml}
              ${editing ? `
                <button class="add-semester-btn" style="margin-top:18px;background:#1da1ff;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;">
                  <i class="fa fa-plus"></i> Add Semester
                </button>
              ` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Initial render
  renderModalContent();
  document.body.appendChild(modal);

  // Modal actions event delegation
  function setModalEvents() {
    // Close
    const closeBtn = modal.querySelector('#closeDegreeDetailsBtn');
    if (closeBtn) closeBtn.onclick = () => modal.remove();

    // Edit
    const editBtn = modal.querySelector('#editDegreeBtn');
    if (editBtn) editBtn.onclick = () => {
      editing = true;
      renderModalContent();
      setModalEvents();
      setEditEvents();
    };

    // Cancel
    const cancelBtn = modal.querySelector('#cancelEditBtn');
    if (cancelBtn) cancelBtn.onclick = () => {
      editing = false;
      tempDegree = JSON.parse(JSON.stringify(degree));
      renderModalContent();
      setModalEvents();
    };

    // Save
    const saveBtn = modal.querySelector('#saveDegreeBtn');
    if (saveBtn) saveBtn.onclick = () => {
      // Validate all courses: code and title must not be empty
      let invalid = false;
      if (tempDegree.syllabus && tempDegree.syllabus.length) {
        tempDegree.syllabus.forEach((sem, sIdx) => {
          sem.courses.forEach((course, cIdx) => {
            if (!course.code.trim() || !course.title.trim()) {
              invalid = true;
            }
          });
        });
      }
      if (invalid) {
        showWarningBox("Every course must have a non-empty <b>code</b> and <b>title</b>.");
        return;
      }

      // Save edited fields
      tempDegree.title = modal.querySelector('#edit-title').value;
      tempDegree.code = modal.querySelector('#edit-code').value;
      tempDegree.duration = modal.querySelector('#edit-duration').value;
      // Save degree description
      const descInput = modal.querySelector('#edit-description');
      if (descInput) tempDegree.description = descInput.value;

      // Recalculate totals
      let totalCredit = 0, totalCourses = 0, totalHours = 0;
      if (tempDegree.syllabus && tempDegree.syllabus.length) {
        tempDegree.syllabus.forEach(sem => {
          let semWeeks = sem.total_weeks || 16;
          sem.courses.forEach(course => {
            totalCredit += Number(course.credit) || 0;
            totalHours += (Number(course.hours) || 0) * semWeeks;
          });
          totalCourses += sem.courses.length;
        });
      }
      tempDegree.credit = totalCredit;
      tempDegree.courses = totalCourses;
      tempDegree.total_hours = totalHours;

      // Save image if changed
      const imgPreview = modal.querySelector('#degreeImagePreview');
      if (imgPreview && imgPreview.src) tempDegree.image = imgPreview.src;

      // Add mode: keep previous logic
      if (isAddMode) {
        // ...existing code...
        // Compose degreeData for server
        const degreeData = {
          name: tempDegree.title,
          code: tempDegree.code,
          faculty: tempDegree.faculty && tempDegree.faculty.id ? tempDegree.faculty.id : null,
          description: tempDegree.description || '',
          total_credits: tempDegree.credit,
          total_courses: tempDegree.courses,
          total_hours: tempDegree.total_hours,
          degree_image: tempDegree.image,
          semesters: (tempDegree.syllabus || []).map((sem, idx) => ({
            semester_name: `Semester ${sem.semester || idx + 1}`,
            duration_weeks: sem.total_weeks || 16,
            syllabus_structure: (sem.courses || []).map(course => ({
              course_code: course.code,
              course_name: course.title,
              course_credits: course.credit,
              course_hours: course.hours,
              type: course.type
            }))
          }))
        };
        if (!degreeData.faculty) {
          showWarningBox('Please select a faculty.');
          return;
        }
        fetch('/executives/api/degree/add/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': (window.getCSRFToken ? window.getCSRFToken() : ''),
          },
          body: JSON.stringify(degreeData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showWarningBox('Degree added successfully!');
            modal.remove();
            // Fetch updated degrees from server
            fetch('/executives/api/degree/list/')
              .then(res => res.json())
              .then(listData => {
                if (listData.success && Array.isArray(listData.degrees)) {
                  window.ALL_DEGREES = listData.degrees;
                  renderDegrees(window.ALL_DEGREES);
                } else {
                  renderDegrees(data.all_degrees);
                }
              })
              .catch(() => renderDegrees(getDegrees()));
          } else {
            showWarningBox('Error: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(err => {
          showWarningBox('Error: ' + (err.message || 'Unknown error'));
        });
      } else {
        // Edit mode: confirm before saving
        const degreeId = degree.id || degree.code;
        if (!degreeId) {
          showWarningBox('Cannot edit: degree ID or code missing.');
          return;
        }
        // Show confirm modal
        const confirmModal = document.createElement('div');
        confirmModal.id = 'confirmEditModal';
        confirmModal.style.position = 'fixed';
        confirmModal.style.top = '0';
        confirmModal.style.left = '0';
        confirmModal.style.width = '100vw';
        confirmModal.style.height = '100vh';
        confirmModal.style.background = 'rgba(0,0,0,0.25)';
        confirmModal.style.display = 'flex';
        confirmModal.style.alignItems = 'center';
        confirmModal.style.justifyContent = 'center';
        confirmModal.style.zIndex = 6000;
        confirmModal.innerHTML = `
          <div style="background:#fff;border-radius:16px;padding:32px 28px;min-width:320px;max-width:90vw;text-align:center;box-shadow:0 8px 32px rgba(44,44,44,0.13),0 2px 8px rgba(0,0,0,0.08);font-family:'Poppins',Arial,sans-serif;">
            <h2 style='color:#1da1ff;font-size:1.2rem;margin-bottom:18px;'>Confirm Save</h2>
            <div style='color:#444;font-size:1.08rem;margin-bottom:22px;'>Are you sure you want to save the changes to this degree?</div>
            <button id='confirmEditSaveBtn' style='background:#1da1ff;color:#fff;border:none;padding:10px 32px;border-radius:10px;font-size:1.08rem;font-weight:600;margin-right:18px;cursor:pointer;'>Save</button>
            <button id='cancelEditSaveBtn' style='background:#eee;color:#444;border:none;padding:10px 32px;border-radius:10px;font-size:1.08rem;font-weight:600;cursor:pointer;'>Cancel</button>
          </div>
        `;
        document.body.appendChild(confirmModal);
        document.getElementById('confirmEditSaveBtn').onclick = function() {
          confirmModal.remove();
          // Compose degreeData for server
          const degreeData = {
            name: tempDegree.title,
            code: tempDegree.code,
            faculty: tempDegree.faculty && tempDegree.faculty.id ? tempDegree.faculty.id : null,
            description: tempDegree.description || '',
            duration: document.getElementById('edit-duration').value,
            total_credits: tempDegree.credit,
            total_courses: tempDegree.courses,
            total_hours: tempDegree.total_hours,
            degree_image: tempDegree.image,
            semesters: (tempDegree.syllabus || []).map((sem, idx) => ({
              semester_name: `Semester ${sem.semester || idx + 1}`,
              duration_weeks: sem.total_weeks || 16,
              syllabus_structure: (sem.courses || []).map(course => ({
                course_code: course.code,
                course_name: course.title,
                course_credits: course.credit,
                course_hours: course.hours,
                type: course.type
              }))
            }))
          };
          // Add CSRF token if available
          const headers = {
            'Content-Type': 'application/json'
          };
          if (window.getCSRFToken) {
            headers['X-CSRFToken'] = window.getCSRFToken();
          }
          fetch(`/executives/api/degree/edit/${degreeId}/`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(degreeData)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showWarningBox('Degree updated successfully!', true);
              
              modal.remove();
              // Fetch updated degrees from server
              fetch('/executives/api/degree/list/')
                .then(res => res.json())
                .then(listData => {
                  if (listData.success && Array.isArray(listData.degrees)) {
                    window.ALL_DEGREES = listData.degrees;
                    renderDegrees(window.ALL_DEGREES);
                  } else {
                    renderDegrees(getDegrees());
                  }
                })
                .catch(() => renderDegrees(getDegrees()));
            } else {
              showWarningBox('Error: ' + (data.message || 'Unknown error'));
            }
          })
          .catch(err => {
            showWarningBox('Error: ' + (err.message || 'Unknown error'));
          });
        };
        document.getElementById('cancelEditSaveBtn').onclick = function() {
          confirmModal.remove();
        };
      }
    };
  }

  function syncDegreeFieldsFromInputs() {
    if (!editing) return;
    const titleInput = modal.querySelector('#edit-title');
    const codeInput = modal.querySelector('#edit-code');
    let durationInput = modal.querySelector('#edit-duration');
    if (titleInput) tempDegree.title = titleInput.value;
    if (codeInput) tempDegree.code = codeInput.value;
    if (durationInput) tempDegree.duration = durationInput.value;
  }

  // Set events for editing fields and courses
  function setEditEvents() {
    // Faculty choose button event
    const chooseFacultyBtn = modal.querySelector('#chooseFacultyBtn');
    if (chooseFacultyBtn) {
      chooseFacultyBtn.onclick = function(e) {
        e.preventDefault();
        showFacultySelectionModal(function(faculty) {
          selectedFaculty = faculty;
          tempDegree.faculty = faculty;
          renderModalContent();
          setModalEvents();
          setEditEvents();
        });
      };
    }

    // Image upload
    const imageInput = modal.querySelector('#degreeImageInput');
    const imagePreview = modal.querySelector('#degreeImagePreview');
    if (imageInput && imagePreview) {
      imageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function (evt) {
            imagePreview.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        } else {
          alert('Please select a valid image file.');
        }
      });
    }

    // Course field edits
    modal.querySelectorAll('.edit-course-field').forEach(input => {
      input.addEventListener('input', function (e) {
        const semIdx = +this.dataset.sem;
        const courseIdx = +this.dataset.course;
        const field = this.dataset.field;
        tempDegree.syllabus[semIdx].courses[courseIdx][field] = this.value;

        // Recalculate totals
        let totalCredit = 0, totalCourses = 0, totalHours = 0;
        tempDegree.syllabus.forEach(sem => {
          sem.courses.forEach(course => {
            totalCredit += Number(course.credit) || 0;
            totalHours += Number(course.hours) || 0;
          });
          totalCourses += sem.courses.length;
        });

        // Update totals in modal (if you use IDs for totals)
        const creditCell = modal.querySelector('#totalCreditCell');
        const coursesCell = modal.querySelector('#totalCoursesCell');
        const hoursCell = modal.querySelector('#totalHoursCell');
        if (creditCell) creditCell.textContent = totalCredit;
        if (coursesCell) coursesCell.textContent = totalCourses;
        if (hoursCell) hoursCell.textContent = totalHours;
      });
    });

    // Remove course
    modal.querySelectorAll('.remove-course-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const semIdx = +this.dataset.sem;
        const courseIdx = +this.dataset.course;
        // Save scroll position
        const scrollable = modal.querySelector('.syllabus-scrollable');
        const scrollTop = scrollable ? scrollable.scrollTop : 0;

        // Sync degree fields before changing syllabus
        syncDegreeFieldsFromInputs();

        tempDegree.syllabus[semIdx].courses.splice(courseIdx, 1);

        renderModalContent();
        setModalEvents();
        setEditEvents();

        // Restore scroll position
        const newScrollable = modal.querySelector('.syllabus-scrollable');
        if (newScrollable) newScrollable.scrollTop = scrollTop;
      });
    });

    // Add course (open course selection modal)
    modal.querySelectorAll('.add-course-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const semIdx = +this.dataset.sem;
        // Save scroll position
        const scrollable = modal.querySelector('.syllabus-scrollable');
        const scrollTop = scrollable ? scrollable.scrollTop : 0;

        // Sync degree fields before changing syllabus
        syncDegreeFieldsFromInputs();

        // Show course selection modal
        showCourseSelectionModal(selectedCourse => {
          tempDegree.syllabus[semIdx].courses.push({
            code: selectedCourse.course_code,
            title: selectedCourse.course_name,
            credit: selectedCourse.course_credits,
            hours: selectedCourse.course_hours,
            type: "Core"
          });
          renderModalContent();
          setModalEvents();
          setEditEvents();
          // Restore scroll position
          const newScrollable = modal.querySelector('.syllabus-scrollable');
          if (newScrollable) newScrollable.scrollTop = scrollTop;
        });
      });
    });

    // Semester weeks input events
    modal.querySelectorAll('.edit-semester-weeks').forEach(input => {
      input.addEventListener('input', function (e) {
        const semIdx = +this.dataset.semWeeks;
        let val = parseInt(this.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 52) val = 52;
        tempDegree.syllabus[semIdx].total_weeks = val;
        renderModalContent();
        setModalEvents();
        setEditEvents();
      });
    });

    // Add course selection modal function
    function showCourseSelectionModal(onSelect) {
      // Remove any existing modal
      const oldModal = document.getElementById('courseSelectionModal');
      if (oldModal) oldModal.remove();

      // Fetch all courses (simulate with mock data or fetch from backend if available)
      // Replace this with an AJAX call if you have an API endpoint
      const allCourses = window.ALL_COURSES;

      let filteredCourses = allCourses;

      const modal = document.createElement('div');
      modal.id = 'courseSelectionModal';
      modal.style.position = 'fixed';
      modal.style.top = 0;
      modal.style.left = 0;
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.25)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = 5001;

      function renderCourseList() {
        const rows = filteredCourses.map(course => `
          <tr class="course-select-row" style="cursor:pointer;" data-code="${course.course_code}" course-id="${course.course_id}">
            <td>${course.course_code}</td>
            <td>${course.course_name}</td>
            <td>${course.course_credits}</td>
            <td>${course.course_hours}</td>
          </tr>
        `).join('');
        return rows;
      }

      modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:28px 24px;min-width:340px;max-width:98vw;width:600px;max-height:90vh;overflow:auto;box-shadow:0 8px 32px rgba(44,44,44,0.13),0 2px 8px rgba(0,0,0,0.08);font-family:'Poppins',Arial,sans-serif;">
          <h2 style="margin-top:0;font-size:1.2rem;color:#1da1ff;">Select a Course</h2>
          <input id="courseSearchInput" type="text" placeholder="Search by code or name..." style="width:100%;padding:8px 12px;margin-bottom:14px;border-radius:8px;border:1px solid #ccc;font-size:1rem;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#e3f2fd;">
                <th style="padding:8px 12px;">Code</th>
                <th style="padding:8px 12px;">Name</th>
                <th style="padding:8px 12px;">Credits</th>
                <th style="padding:8px 12px;">Hours</th>
              </tr>
            </thead>
            <tbody id="courseListBody">
              ${renderCourseList()}
            </tbody>
          </table>
          <div style="text-align:right;margin-top:18px;">
            <button id="closeCourseSelectBtn" style="background:#1da1ff;color:#fff;border:none;padding:8px 24px;border-radius:8px;cursor:pointer;">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Search functionality
      const searchInput = modal.querySelector('#courseSearchInput');
      searchInput.oninput = function() {
        const q = this.value.trim().toLowerCase();
        filteredCourses = allCourses.filter(c =>
          c.course_code.toLowerCase().includes(q) ||
          c.course_name.toLowerCase().includes(q)
        );
        modal.querySelector('#courseListBody').innerHTML = renderCourseList();
        setRowEvents();
      };

      // Row click event
      function setRowEvents() {
        modal.querySelectorAll('.course-select-row').forEach(row => {
          row.onclick = function() {
            const code = this.getAttribute('data-code');
            const id = this.getAttribute('course-id');
            const course = allCourses.find(c => c.course_code === code);
            if (course) {
              modal.remove();
              onSelect(course);
            }
          };
        });
      }
      setRowEvents();

      // Cancel button
      modal.querySelector('#closeCourseSelectBtn').onclick = () => modal.remove();
    }

    // Faculty selection modal
    function showFacultySelectionModal(onSelect) {
      const oldModal = document.getElementById('facultySelectionModal');
      if (oldModal) oldModal.remove();
      // Use window.ALL_FACULTIES if available, else mock
      const faculties = window.ALL_FACULTIES;
      let filtered = faculties;
      const modal = document.createElement('div');
      modal.id = 'facultySelectionModal';
      modal.style.position = 'fixed';
      modal.style.top = 0;
      modal.style.left = 0;
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.25)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = 5002;
      function renderList() {
        return filtered.map(f => `
          <div class="faculty-select-row" data-id="${f.id}" style="display:flex;align-items:center;gap:16px;padding:12px 18px;cursor:pointer;border-radius:10px;margin-bottom:8px;background:#f9fbfd;border:1px solid #e3f2fd;transition:background 0.2s;">
            <img src="${f.photo}" alt="Faculty Photo" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
            <span style="font-size:1.1rem;font-weight:500;">${f.name}</span>
          </div>
        `).join('');
      }
      modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:28px 24px;min-width:340px;max-width:98vw;width:400px;max-height:90vh;overflow:auto;box-shadow:0 8px 32px rgba(44,44,44,0.13),0 2px 8px rgba(0,0,0,0.08);font-family:'Poppins',Arial,sans-serif;">
          <h2 style="margin-top:0;font-size:1.2rem;color:#1da1ff;">Select a Faculty</h2>
          <input id="facultySearchInput" type="text" placeholder="Search faculty..." style="width:100%;padding:8px 12px;margin-bottom:14px;border-radius:8px;border:1px solid #ccc;font-size:1rem;">
          <div id="facultyListBody">${renderList()}</div>
          <div style="text-align:right;margin-top:18px;">
            <button id="closeFacultySelectBtn" style="background:#1da1ff;color:#fff;border:none;padding:8px 24px;border-radius:8px;cursor:pointer;">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      // Search
      modal.querySelector('#facultySearchInput').oninput = function() {
        const q = this.value.trim().toLowerCase();
        filtered = faculties.filter(f => f.name.toLowerCase().includes(q));
        modal.querySelector('#facultyListBody').innerHTML = renderList();
        setRowEvents();
      };
      function setRowEvents() {
        modal.querySelectorAll('.faculty-select-row').forEach(row => {
          row.onclick = function() {
            const id = this.getAttribute('data-id');
            const faculty = faculties.find(f => String(f.id) === String(id));
            if (faculty) {
              modal.remove();
              onSelect(faculty);
            }
          };
        });
      }
      setRowEvents();
      modal.querySelector('#closeFacultySelectBtn').onclick = () => modal.remove();
    }

    // Remove semester
    modal.querySelectorAll('.remove-semester-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const semIdx = +this.dataset.sem;
        showDeleteSemesterConfirm(() => {
          // Save scroll position
          const scrollable = modal.querySelector('.syllabus-scrollable');
          const scrollTop = scrollable ? scrollable.scrollTop : 0;

          // Sync degree fields before changing syllabus
          syncDegreeFieldsFromInputs();

          tempDegree.syllabus.splice(semIdx, 1);

          renderModalContent();
          setModalEvents();
          setEditEvents();

          // Restore scroll position
          const newScrollable = modal.querySelector('.syllabus-scrollable');
          if (newScrollable) newScrollable.scrollTop = scrollTop;
        });
      });
    });

    // Add semester
    const addSemesterBtn = modal.querySelector('.add-semester-btn');
    if (addSemesterBtn) {
      addSemesterBtn.addEventListener('click', function (e) {
        e.preventDefault();
        // Save scroll position
        const scrollable = modal.querySelector('.syllabus-scrollable');
        const scrollTop = scrollable ? scrollable.scrollTop : 0;

        // --- Sync degree fields before changing syllabus ---
        syncDegreeFieldsFromInputs();

        // Ensure syllabus is always an array
        if (!Array.isArray(tempDegree.syllabus)) {
          tempDegree.syllabus = [];
        }

        let nextSem = 1;
        if (tempDegree.syllabus.length > 0) {
          nextSem = Math.max(...tempDegree.syllabus.map(s => s.semester)) + 1;
        }
        tempDegree.syllabus.push({
          semester: nextSem,
          courses: []
        });

        renderModalContent();
        setModalEvents();
        setEditEvents();

        // Restore scroll position
        const newScrollable = modal.querySelector('.syllabus-scrollable');
        if (newScrollable) newScrollable.scrollTop = scrollTop;
      });
    }
  }

  setModalEvents();
  if (editing) setEditEvents();
}

// Custom confirm modal (unchanged)
function showDeleteConfirm(onConfirm) {
  const oldModal = document.getElementById('deleteConfirmModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'deleteConfirmModal';
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.25)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 3000;

  modal.innerHTML = `
    <div style="
      background: #fff;
      border-radius: 16px;
      padding: 32px 28px 24px 28px;
      box-shadow: 0 8px 32px rgba(44,44,44,0.13), 0 2px 8px rgba(0,0,0,0.08);
      font-family: 'Poppins', Arial, sans-serif;
      text-align: center;
      min-width: 320px;
      max-width: 90vw;
    ">
      <h2 style="color:#1da1ff; font-family:'Poppins', Arial, sans-serif; margin-bottom:18px;">Confirm Delete</h2>
      <p style="color:#444; font-size:1.1rem; margin-bottom:28px; font-family:'Poppins', Arial, sans-serif;">
        Are you sure you want to delete this degree?
      </p>
      <button id="confirmDeleteBtn" style="
        background: linear-gradient(90deg,#ff3b3b 60%,#ffb2b2 100%);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 12px 32px;
        font-size: 1.1rem;
        font-weight: bold;
        font-family: 'Poppins', Arial, sans-serif;
        cursor: pointer;
        margin-right: 18px;
        transition: background 0.2s, box-shadow 0.2s;
        box-shadow: 0 2px 8px rgba(29,161,255,0.10);
      ">Delete</button>
      <button id="cancelDeleteBtn" style="
        background: linear-gradient(90deg,#1da1ff 60%,#00bcd4 100%);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 12px 32px;
        font-size: 1.1rem;
        font-weight: bold;
        font-family: 'Poppins', Arial, sans-serif;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;
        box-shadow: 0 2px 8px rgba(29,161,255,0.10);
      ">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('confirmDeleteBtn').onclick = () => {
    modal.remove();
    onConfirm();
  };
  document.getElementById('cancelDeleteBtn').onclick = () => {
    modal.remove();
  };
}

// Warning box function
function showWarningBox(message, reload=false) {
  // Remove any existing warning
  const oldWarn = document.getElementById('customWarningBox');
  if (oldWarn) oldWarn.remove();

  const warn = document.createElement('div');
  warn.id = 'customWarningBox';
  warn.style.position = 'fixed';
  warn.style.top = '0';
  warn.style.left = '0';
  warn.style.width = '100vw';
  warn.style.height = '100vh';
  warn.style.background = 'rgba(0,0,0,0.15)';
  warn.style.display = 'flex';
  warn.style.alignItems = 'center';
  warn.style.justifyContent = 'center';
  warn.style.zIndex = 5000;

  warn.innerHTML = `
    <div style="
      background: #fff;
      border-radius: 16px;
      padding: 32px 28px 24px 28px;
      box-shadow: 0 8px 32px rgba(44,44,44,0.13), 0 2px 8px rgba(0,0,0,0.08);
      font-family: 'Poppins', Arial, sans-serif;
      text-align: center;
      min-width: 320px;
      max-width: 90vw;
      border: 2px solid #1da1ff;
    ">
      <div style="font-size:2.2rem;color:#1da1ff;margin-bottom:10px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div style="color:#1da1ff;font-size:1.2rem;font-weight:600;margin-bottom:12px;">
        Warning
      </div>
      <div style="color:#444;font-size:1.08rem;margin-bottom:22px;">
        ${message}
      </div>
      <button id="closeWarningBoxBtn" style="
        background: linear-gradient(90deg,#1da1ff 60%,#00bcd4 100%);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 10px 32px;
        font-size: 1.08rem;
        font-family: 'Poppins', Arial, sans-serif;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(29,161,255,0.10);
        transition: background 0.2s;
      ">OK</button>
    </div>
  `;
  document.body.appendChild(warn);
  document.getElementById('closeWarningBoxBtn').onclick = () => {
    warn.remove();
    if (reload) window.location.reload();
  }
}

// Render on page load
const degrees = getDegrees();
renderDegrees(degrees);

// sidebar toggle code 

const sidebar = document.getElementById('sidebarMenu');
const toggleBtn = document.getElementById('sidebarToggle');

function handleSidebarToggle() {
  if (window.innerWidth > 900) {
    document.body.classList.toggle('sidebar-closed');
  } else {
    document.body.classList.toggle('sidebar-open');
  }
  // Always close sidebar on mobile when resizing up
  if (window.innerWidth > 900) {
    document.body.classList.remove('sidebar-open');
  }
}

toggleBtn.onclick = handleSidebarToggle;

// Optional: Reset sidebar state on resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    document.body.classList.remove('sidebar-open');
    // Show sidebar by default on desktop
    document.body.classList.remove('sidebar-closed');
  } else {
    // Hide sidebar by default on mobile
    document.body.classList.remove('sidebar-closed');
  }
});

function showDeleteSemesterConfirm(onConfirm) {
  const oldModal = document.getElementById('deleteSemesterConfirmModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'deleteSemesterConfirmModal';
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.25)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 5000; // <-- Make sure this is higher than the main modal

  modal.innerHTML = `
    <div style="
      background: #fff;
      border-radius: 16px;
      padding: 32px 28px 24px 28px;
      box-shadow: 0 8px 32px rgba(44,44,44,0.13), 0 2px 8px rgba(0,0,0,0.08);
      font-family: 'Poppins', Arial, sans-serif;
      text-align: center;
      min-width: 320px;
      max-width: 90vw;
      border: 2px solid #1da1ff;
    ">
      <div style="font-size:2.2rem;color:#1da1ff;margin-bottom:10px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div style="color:#1da1ff;font-size:1.2rem;font-weight:600;margin-bottom:12px;">
        Delete Semester
      </div>
      <div style="color:#444;font-size:1.08rem;margin-bottom:22px;">
        Are you sure you want to delete this entire semester?<br>
        <span style="color:#ff3b3b;">All courses in this semester will be removed.</span>
      </div>
      <button id="confirmDeleteSemesterBtn" style="
        background: linear-gradient(90deg,#ff3b3b 60%,#ffb2b2 100%);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 10px 32px;
        font-size: 1.08rem;
        font-family: 'Poppins', Arial, sans-serif;
        cursor: pointer;
        font-weight: 600;
        margin-right: 18px;
        box-shadow: 0 2px 8px rgba(29,161,255,0.10);
        transition: background 0.2s;
      ">Delete</button>
      <button id="cancelDeleteSemesterBtn" style="
        background: linear-gradient(90deg,#eee 60%,#ccc 100%);
        color: #444;
        border: none;
        border-radius: 10px;
        padding: 10px 32px;
        font-size: 1.08rem;
        font-family: 'Poppins', Arial, sans-serif;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(29,161,255,0.10);
        transition: background 0.2s;
      ">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('confirmDeleteSemesterBtn').onclick = () => {
    modal.remove();
    onConfirm();
  };
  document.getElementById('cancelDeleteSemesterBtn').onclick = () => {
    modal.remove();
  };
}

// Add Degree Modal
document.getElementById('showAddModalBtn').onclick = function () {
  // Create a blank degree object
  const newDegree = {
    title: "",
    code: "",
    duration: "",
    credit: 0,
    courses: 0,
    image: "./img/bachelor.png",
    syllabus: []
  };
  // Show the modal in editing mode
  showDegreeDetailsModal(newDegree, null, true);
};

function filterDegrees(query) {
  const degrees = getDegrees();
  const q = query.trim().toLowerCase();
  if (!q) {
    renderDegrees(degrees);
    return;
  }
  const filtered = degrees.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.code.toLowerCase().includes(q)
  );
  renderDegrees(filtered);
}

const searchInput = document.getElementById('degreeSearchInput');
const searchBtn = document.getElementById('degreeSearchBtn');

if (searchInput && searchBtn) {
  searchBtn.onclick = () => filterDegrees(searchInput.value);
  searchInput.oninput = () => filterDegrees(searchInput.value);
}