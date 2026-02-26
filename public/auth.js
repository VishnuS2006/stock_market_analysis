const API_BASE = "/api";
const ENDPOINTS = {
    signupCompany: `${API_BASE}/auth/signup/company`,
    signupInvestor: `${API_BASE}/auth/signup/investor`,
    login: `${API_BASE}/auth/login`,
};

function showToast(message, type = "error") {
    const toast = document.createElement("div");
    toast.className = `toast ${type} animate__animated animate__fadeInUp`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("animate__fadeOutDown"), 2400);
    setTimeout(() => toast.remove(), 3000);
}

function showError(message) {
    const errorDiv = document.getElementById("error");
    if (!errorDiv) {
        return;
    }
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
    errorDiv.classList.add("animate__shakeX");
    setTimeout(() => {
        errorDiv.classList.remove("animate__shakeX");
    }, 700);
}

function hideError() {
    const errorDiv = document.getElementById("error");
    if (!errorDiv) {
        return;
    }
    errorDiv.classList.add("hidden");
}

function showLoading(show = true) {
    let loader = document.getElementById("globalLoader");
    if (show) {
        if (!loader) {
            loader = document.createElement("div");
            loader.id = "globalLoader";
            loader.innerHTML = `
                <div style="position:fixed;inset:0;background:rgba(0,0,0,0.58);display:flex;align-items:center;justify-content:center;z-index:9998;">
                    <div class="loader"></div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = "flex";
    } else if (loader) {
        loader.style.display = "none";
    }
}

async function parseJsonSafe(response) {
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

async function requestJson(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(response);
    return { response, data };
}

function validatePassword(password, confirmPassword) {
    if (!password || password.length < 6) {
        return "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
        return "Passwords do not match";
    }
    return "";
}

const companyForm = document.getElementById("companyForm");
if (companyForm) {
    companyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError();
        showLoading(true);

        const body = {
            companyName: document.getElementById("companyName").value.trim(),
            email: document.getElementById("companyEmail").value.trim(),
            password: document.getElementById("companyPassword").value,
            confirmPassword: document.getElementById("companyConfirm").value,
            registrationNumber: document.getElementById("registrationNumber").value.trim(),
            industry: document.getElementById("industry").value.trim(),
            foundedYear: Number(document.getElementById("foundedYear").value),
            fundingNeeded: document.getElementById("fundingNeeded").value.trim(),
            equityOffered: Number(document.getElementById("equityOffered").value),
        };

        const passwordValidation = validatePassword(body.password, body.confirmPassword);
        if (passwordValidation) {
            showLoading(false);
            showError(passwordValidation);
            return;
        }

        try {
            console.log("Submitting company signup:", body.email);
            const { response, data } = await requestJson(ENDPOINTS.signupCompany, body);
            if (!response.ok) {
                showLoading(false);
                showError(data.message || "Company signup failed");
                return;
            }

            showLoading(false);
            showToast("Company registered successfully. Redirecting to login...", "success");
            setTimeout(() => {
                window.location.href = "/login";
            }, 1200);
        } catch (error) {
            console.error("Company signup error:", error);
            showLoading(false);
            showError("Unable to register company right now");
        }
    });
}

const investorForm = document.getElementById("investorForm");
if (investorForm) {
    investorForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError();
        showLoading(true);

        const body = {
            fullName: document.getElementById("fullName").value.trim(),
            email: document.getElementById("investorEmail").value.trim(),
            password: document.getElementById("investorPassword").value,
            confirmPassword: document.getElementById("investorConfirm").value,
            phone: document.getElementById("phone").value.trim(),
            investorType: document.getElementById("investorType").value,
            preferredIndustry: document.getElementById("preferredIndustry").value.trim(),
            experienceLevel: document.getElementById("experienceLevel").value,
        };

        const missingRequired =
            !body.fullName ||
            !body.email ||
            !body.password ||
            !body.confirmPassword ||
            !body.phone ||
            !body.investorType ||
            !body.preferredIndustry ||
            !body.experienceLevel;

        if (missingRequired) {
            showLoading(false);
            showError("Please fill all investor fields");
            return;
        }

        const passwordValidation = validatePassword(body.password, body.confirmPassword);
        if (passwordValidation) {
            showLoading(false);
            showError(passwordValidation);
            return;
        }

        try {
            console.log("Submitting investor signup:", body.email);
            const { response, data } = await requestJson(ENDPOINTS.signupInvestor, body);
            if (!response.ok) {
                showLoading(false);
                showError(data.message || "Investor signup failed");
                return;
            }

            showLoading(false);
            showToast("Investor registered successfully. Redirecting to login...", "success");
            setTimeout(() => {
                window.location.href = "/login";
            }, 1200);
        } catch (error) {
            console.error("Investor signup error:", error);
            showLoading(false);
            showError("Unable to register investor right now");
        }
    });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError();
        showLoading(true);

        const body = {
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value,
        };

        if (!body.email || !body.password) {
            showLoading(false);
            showError("Email and password are required");
            return;
        }

        try {
            console.log("Login attempt:", body.email);
            const { response, data } = await requestJson(ENDPOINTS.login, body);
            if (!response.ok) {
                showLoading(false);
                showError(data.message || "Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            showLoading(false);
            showToast("Login successful. Redirecting...", "success");

            setTimeout(() => {
                if (data.role === "company") {
                    window.location.href = "/company-dashboard";
                } else if (data.role === "investor") {
                    window.location.href = "/investor-dashboard";
                } else {
                    window.location.href = "/";
                }
            }, 900);
        } catch (error) {
            console.error("Login error:", error);
            showLoading(false);
            showError("Unable to login right now");
        }
    });
}
