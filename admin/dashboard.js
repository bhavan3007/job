const staffAPI = "http://localhost/job_api/adminapi/staff_management.php";
const departmentAPI = "http://localhost/job_api/adminapi/fetch_departments.php";
const addDepartmentAPI = "http://localhost/job_api/adminapi/add_department.php";
const addUserAPI = "http://localhost/job_api/adminapi/add_user.php";
const editUserAPI = "http://localhost/job_api/adminapi/edit_user.php";
const deleteUserAPI = "http://localhost/job_api/adminapi/delete_user.php";
const toggleUserStatusAPI = "http://localhost/job_api/adminapi/toggle_user_status.php";
const countUsersAPI = "http://localhost/job_api/adminapi/count_users.php";
const userStatusAPI = "http://localhost/job_api/adminapi/get_user_status_counts.php";
const fetchGroupsAPI = "http://localhost/job_api/adminapi/get_groups.php";
const deleteGroupAPI = "http://localhost/job_api/adminapi/delete_group.php";


let fullUserList = [];

document.addEventListener('DOMContentLoaded', () => {
  loadStaff();
  loadDepartmentsCount();
  loadUserCount();
  loadUserStatusCounts();
  loadTaskStatsForAdmin();
});

// -------------------- COUNTS --------------------

async function loadUserCount() {
  try {
    const res = await fetch(countUsersAPI);
    const data = await res.json();
    document.getElementById("totalStaff").textContent = data.total;
  } catch (e) {
    console.error("User count error", e);
  }
}

async function loadUserStatusCounts() {
  try {
    const res = await fetch(userStatusAPI);
    const data = await res.json();
    document.getElementById("activeUsers").textContent = data.active;
    document.getElementById("inactiveUsers").textContent = data.inactive;
  } catch (e) {
    console.error("Status count error", e);
  }
}

async function loadDepartmentsCount() {
  const res = await fetch(departmentAPI);
  const data = await res.json();
  document.getElementById('totalDepartments').textContent = data.length;
}

// -------------------- LOad task counts --------------------

async function loadTaskStatsForAdmin() {
  try {
    const res = await fetch("http://localhost/job_api/adminapi/get_task_stats.php");
    const data = await res.json();

    document.getElementById("adminTotalTasks").textContent = data.total || 0;
    document.getElementById("adminCompleted").textContent = data.completed || 0;
    document.getElementById("adminPending").textContent = data.pending || 0;
    document.getElementById("adminOverdue").textContent = data.overdue || 0;
  } catch (err) {
    console.error("Failed to load admin task stats:", err);
  }
}


// -------------------- STAFF TABLE --------------------

async function loadStaff() {
  const res = await fetch(staffAPI);
  const data = await res.json();
  fullUserList = data;
  renderStaffTable(data);
  populateDepartmentFilter(data);
  populateUserSelect(); 
}

function renderStaffTable(data) {
  const tbody = document.getElementById('staffTable');
  tbody.innerHTML = '';

  let active = 0, inactive = 0;

  data.forEach(user => {
    if (user.status === 'Active') active++;
    else inactive++;

    const statusBadge = user.status === 'Active'
      ? `<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">Active</span>`
      : `<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">Inactive</span>`;

    tbody.innerHTML += `
      <tr>
        <td class="px-4 py-2">${user.username}</td>
        <td class="px-4 py-2">${user.role}</td>
        <td class="px-4 py-2">${user.department || "---"}</td>
        <td class="px-4 py-2">${user.email}</td>
        <td class="px-4 py-2">${statusBadge}</td>
        <td class="px-4 py-2 space-x-2">
  
  <button class="text-yellow-500 toggle-status" data-user="${user.username}">
    <i class="fas fa-power-off"></i>
  </button>
  <button class="text-blue-600 edit-user-btn" data-user='${JSON.stringify(user)}'>
    <i class="fas fa-edit"></i>
  </button>
  <button class="text-red-600 delete-user-btn" data-user="${user.username}">
    <i class="fas fa-trash"></i>
  </button>
</td>

      </tr>
    `;
  });

  document.getElementById("totalStaff").textContent = data.length;
  document.getElementById("activeUsers").textContent = active;
  document.getElementById("inactiveUsers").textContent = inactive;

  bindToggleStatusEvents();
  bindEditUserEvents();
  bindDeleteUserEvents();
}

// -------------------- FILTERING --------------------

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("departmentFilter").addEventListener("change", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);

function applyFilters() {
  const name = document.getElementById("searchInput").value.toLowerCase();
  const dept = document.getElementById("departmentFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = fullUserList.filter(u => 
    u.username.toLowerCase().includes(name) &&
    (dept === "" || u.department === dept) &&
    (status === "" || u.status === status)
  );

  renderStaffTable(filtered);
}

function populateDepartmentFilter(data) {
  const deptSet = new Set();
  data.forEach(user => {
    if (user.department && user.department !== "---") {
      deptSet.add(user.department);
    }
  });

  const select = document.getElementById("departmentFilter");
  select.innerHTML = `<option value="">All Departments</option>`;
  [...deptSet].sort().forEach(dep => {
    select.innerHTML += `<option value="${dep}">${dep}</option>`;
  });
}

// ================== OPEN ADD DEPARTMENT MODAL ==================

document.getElementById("openAddDepartmentModal").addEventListener("click", () => {
  document.getElementById("addDepartmentModal").classList.remove("hidden");
});

function closeDepartmentModal() {
  document.getElementById("addDepartmentModal").classList.add("hidden");
  document.getElementById("addDepartmentForm").reset();
}

document.getElementById("addDepartmentForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("newDepartmentName").value;

  try {
    const res = await fetch(addDepartmentAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const result = await res.json();
    if (result.status === "success") {
      alert("Department added successfully.");
      closeDepartmentModal();
      loadDepartmentsCount();
      loadStaff(); // to update filter dropdowns too
    } else {
      alert("Add failed: " + result.message);
    }
  } catch (err) {
    alert("Request failed");
    console.error(err);
  }
});


// -------------------- ADD STAFF --------------------

document.getElementById("openAddStaffModal").addEventListener("click", () => {
  document.getElementById("addStaffModal").classList.remove("hidden");
  document.getElementById("addStaffForm").reset();
  loadDepartmentsIntoSelect();
});

document.getElementById("role").addEventListener("change", toggleDepartmentVisibility);

function toggleDepartmentVisibility() {
  const role = document.getElementById("role").value;
  const wrapper = document.getElementById("departmentWrapper");
  wrapper.classList.toggle("hidden", role === "principal" || role === "dean");
}

async function loadDepartmentsIntoSelect() {
  const res = await fetch(departmentAPI);
  const departments = await res.json();
  const select = document.getElementById("department");
  select.innerHTML = `<option value="">Select Department</option>`;
  departments.forEach(dep => {
    select.innerHTML += `<option value="${dep}">${dep}</option>`;
  });
}

document.getElementById("addStaffForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role").value,
    department: document.getElementById("department").value
  };

  try {
    const res = await fetch(addUserAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.status === "success") {
      alert("User added");
      closeStaffModal();
      loadStaff();
    } else {
      alert("Add failed: " + result.message);
    }
  } catch (err) {
    alert("Request failed");
    console.error(err);
  }
});

function closeStaffModal() {
  document.getElementById("addStaffModal").classList.add("hidden");
}

// -------------------- EDIT STAFF --------------------

function bindEditUserEvents() {
  document.querySelectorAll(".edit-user-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const user = JSON.parse(btn.getAttribute("data-user"));
      document.getElementById("editStaffModal").classList.remove("hidden");

      document.getElementById("edit_username").value = user.username;
      document.getElementById("edit_email").value = user.email;
      document.getElementById("edit_password").value = "";
      document.getElementById("edit_role").value = user.role;

      toggleEditDepartmentVisibility();
      loadDepartmentsIntoEditSelect().then(() => {
        document.getElementById("edit_department").value = user.department || "";
      });
    });
  });
}

function toggleEditDepartmentVisibility() {
  const role = document.getElementById("edit_role").value;
  const wrapper = document.getElementById("editDepartmentWrapper");
  wrapper.classList.toggle("hidden", role === "principal" || role === "dean");
}
document.getElementById("edit_role").addEventListener("change", toggleEditDepartmentVisibility);

async function loadDepartmentsIntoEditSelect() {
  const res = await fetch(departmentAPI);
  const departments = await res.json();
  const select = document.getElementById("edit_department");
  select.innerHTML = `<option value="">Select Department</option>`;
  departments.forEach(dep => {
    select.innerHTML += `<option value="${dep}">${dep}</option>`;
  });
}

document.getElementById("editStaffForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    username: document.getElementById("edit_username").value,
    email: document.getElementById("edit_email").value,
    password: document.getElementById("edit_password").value,
    role: document.getElementById("edit_role").value,
    department: document.getElementById("edit_department").value
  };

  try {
    const res = await fetch(editUserAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.status === "success") {
      alert("User updated");
      closeEditStaffModal();
      loadStaff();
    } else {
      alert("Update failed: " + result.message);
    }
  } catch (err) {
    alert("Request failed");
    console.error(err);
  }
});

function closeEditStaffModal() {
  document.getElementById("editStaffModal").classList.add("hidden");
  document.getElementById("editStaffForm").reset();
}

// -------------------- DELETE USER --------------------

function bindDeleteUserEvents() {
  document.querySelectorAll(".delete-user-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const username = btn.getAttribute("data-user");
      if (!confirm(`Delete user ${username}?`)) return;

      try {
        const res = await fetch(deleteUserAPI, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });

        const result = await res.json();
        if (result.status === "success") {
          alert("User deleted");
          loadStaff();
        } else {
          alert("Delete failed: " + result.message);
        }
      } catch (err) {
        alert("Delete request failed");
        console.error(err);
      }
    });
  });
}


// -------------------- TOGGLE STATUS --------------------

function bindToggleStatusEvents() {
  document.querySelectorAll(".toggle-status").forEach(btn => {
    btn.addEventListener("click", async () => {
      const username = btn.getAttribute("data-user");

      try {
        const res = await fetch(toggleUserStatusAPI, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });

        const result = await res.json();
        if (result.status === "success") {
          loadStaff();
        } else {
          alert("Toggle failed: " + result.message);
        }
      } catch (err) {
        alert("Toggle error");
        console.error(err);
      }
    });
  });
}

const addGroupAPI = "http://localhost/job_api/adminapi/add_group.php";

// OPEN GROUP MODAL
document.getElementById("openAddGroupModal").addEventListener("click", () => {
  document.getElementById("addGroupModal").classList.remove("hidden");
  populateUserSelect();
});

function closeGroupModal() {
  document.getElementById("addGroupModal").classList.add("hidden");
  document.getElementById("addGroupForm").reset();
}

let groupSelectInstance;

function populateUserSelect() {
  const select = document.getElementById("groupRecipients");
  select.innerHTML = ""; // clear old options

  fullUserList.forEach(user => {
    const option = document.createElement("option");
    option.value = user.username;
    option.textContent = `${user.username} (${user.department || "N/A"})`; // ✅ CHANGED HERE
    select.appendChild(option);
  });

  // Destroy previous TomSelect instance if exists
  if (groupSelectInstance) {
    groupSelectInstance.destroy();
  }

  // Re-initialize Tom Select
  groupSelectInstance = new TomSelect("#groupRecipients", {
    plugins: ['remove_button'],
    placeholder: "Search and select users...",
    maxItems: null,
    valueField: "value",
    labelField: "text",
    searchField: ["text"]
  });
}



// SUBMIT GROUP FORM
document.getElementById("addGroupForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("groupName").value.trim();
  const selectedOptions = [...document.getElementById("groupRecipients").selectedOptions];
const userNames = selectedOptions.map(o => o.value);
  if (!name || userNames.length === 0) {
  alert("Enter group name and select at least one user.");
  return;
}

  try {
    const res = await fetch(addGroupAPI, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, users: userNames }),    // ✅
});

    const result = await res.json();
    if (result.status === "success") {
      alert("Group created successfully");
      closeGroupModal();
    } else {
      alert("Create failed: " + result.message);
    }
  } catch (err) {
    alert("Group creation failed");
    console.error(err);
  }
});

document.getElementById("openViewGroupsModal").addEventListener("click", () => {
  document.getElementById("viewGroupsModal").classList.remove("hidden");
  fetchGroupsAndRender();
});

function closeGroupsModal() {
  document.getElementById("viewGroupsModal").classList.add("hidden");
}

async function fetchGroupsAndRender() {
  const container = document.getElementById("groupsListContainer");
  container.innerHTML = "<p>Loading groups...</p>";

  try {
    const res = await fetch(fetchGroupsAPI);
    const groups = await res.json();

    if (!groups.length) {
      container.innerHTML = "<p>No groups found.</p>";
      return;
    }

    container.innerHTML = "";

    groups.forEach(group => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "border rounded p-4 mb-4";

      const members = group.members.length > 0
        ? `<ul class="list-disc ml-5">${group.members.map(m => `<li>${m}</li>`).join("")}</ul>`
        : "<p class='text-gray-500'>No members</p>";

      groupDiv.innerHTML = `
        <div class="flex justify-between items-center">
          <h3 class="font-semibold">${group.name}</h3>
          <button class="text-red-600 text-sm" onclick="deleteGroup(${group.id})">
            Delete
          </button>
        </div>
        <div class="mt-2">${members}</div>
      `;

      container.appendChild(groupDiv);
    });

  } catch (err) {
    container.innerHTML = "<p class='text-red-500'>Failed to load groups.</p>";
    console.error("Fetch groups error:", err);
  }
}

async function deleteGroup(groupId) {
  if (!confirm("Are you sure you want to delete this group?")) return;

  try {
    const res = await fetch(deleteGroupAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId })
    });

    const result = await res.json();
    if (result.status === "success") {
      alert("Group deleted.");
      fetchGroupsAndRender();
    } else {
      alert("Delete failed: " + result.message);
    }
  } catch (err) {
    alert("Delete request failed");
    console.error(err);
  }
}
