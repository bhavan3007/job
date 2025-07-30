const { ipcRenderer } = require('electron');

window.addEventListener("DOMContentLoaded", async () => {
  const roleSelect = document.getElementById("role");
  const loginBtn = document.getElementById("loginBtn");
  const statusEl = document.getElementById("status");

  // Load roles (optional)
  try {
    const response = await axios.get("http://localhost/job_api/get_roles.php");
    const data = response.data;

    if (data.success && Array.isArray(data.roles)) {
      const uniqueRoles = new Set();
      data.roles.forEach(role => {
        const lowerRole = role.trim().toLowerCase();
        if (!uniqueRoles.has(lowerRole)) {
          uniqueRoles.add(lowerRole);
          const option = document.createElement("option");
          option.value = lowerRole;
          option.textContent = lowerRole.charAt(0).toUpperCase() + lowerRole.slice(1);
          roleSelect.appendChild(option);
        }
      });
    }
  } catch (err) {
    console.error("Role load failed:", err);
  }

  loginBtn.addEventListener("click", async () => {
    const role = roleSelect.value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!role || !username || !password) {
      statusEl.textContent = "Please fill in all fields.";
      statusEl.style.color = "red";
      return;
    }

    try {
      const response = await axios.post("http://localhost/job_api/login.php", {
        role,
        username,
        password
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const data = response.data;

     if (data.success) {
  const user = data.user;

  // Optional: still store separately if you need
  localStorage.setItem("username", user.name);
  localStorage.setItem("email", user.email);
  localStorage.setItem("role", user.role);
  localStorage.setItem("recipient_name", user.recipient_name);

  // ✅ Store whole user object for profile, dashboard, etc.
  localStorage.setItem("user", JSON.stringify(user));

  statusEl.style.color = "green";
  statusEl.textContent = `Welcome, ${user.name}`;

  setTimeout(() => {
    ipcRenderer.send("navigate-to", user.role);
  }, 1000);
}

       else {
        statusEl.style.color = "red";
        statusEl.textContent = data.message;
      }
    } catch (err) {
      console.error("Login failed:", err);
      statusEl.style.color = "red";
      statusEl.textContent = "Login failed. Check server.";
    }
  });
});

document.getElementById("forgotPasswordLink").addEventListener("click", () => {
  document.getElementById("forgotModal").style.display = "flex";
});

async function sendOtp() {
  const email = document.getElementById("forgotEmail").value.trim();
  const statusEl = document.getElementById("otpStatus");

  if (!email) {
    statusEl.textContent = "Please enter your email.";
    statusEl.style.color = "red";
    return;
  }

  try {
    const res = await axios.post("http://localhost/job_api/forgot_password/send_otp.php", { email });
    const data = res.data;

    if (data.success) {
      statusEl.textContent = "OTP sent! Check your email.";
      statusEl.style.color = "green";

      // Optionally redirect or open OTP verify modal
      localStorage.setItem("otpEmail", email);
      setTimeout(() => {
        window.location.href = "verify_otp.html";
      }, 1000);
    } else {
      statusEl.textContent = data.message;
      statusEl.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error sending OTP.";
    statusEl.style.color = "red";
  }
}

function closeForgotModal() {
  document.getElementById("forgotModal").style.display = "none";
}


