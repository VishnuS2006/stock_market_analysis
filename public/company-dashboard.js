const TOKEN_KEY = "token";

const API = {
  profile: "/api/company/profile",
  stats: "/api/company/stats",
  analytics: "/api/company/analytics",
  funding: "/api/company/funding",
  investors: "/api/company/investors",
  connect: (investorId) => `/api/company/connect/${investorId}`,
};

const FUNDING_STATUS_STYLES = {
  Open: "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
  Funded: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  Closed: "border-slate-500/40 bg-slate-500/20 text-slate-200",
};

const CONNECTION_STATUS_STYLES = {
  "Not Connected": "border-slate-500/40 bg-slate-500/20 text-slate-200",
  Pending: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  Connected: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  Rejected: "border-rose-400/30 bg-rose-500/15 text-rose-200",
};

const state = {
  token: null,
  profile: null,
  fundingRequests: [],
  investors: [],
  analytics: null,
  stats: null,
};

const dom = {};
let revenueChart = null;

document.addEventListener("DOMContentLoaded", initializeDashboard);

function initializeDashboard() {
  cacheDom();
  bindInteractions();
  fadeInPage();

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    redirectToLogin();
    return;
  }

  state.token = token;
  loadDashboard();
}

function cacheDom() {
  dom.pageRoot = byId("pageRoot");
  dom.sidebar = byId("sidebar");
  dom.sidebarToggle = byId("sidebarToggle");
  dom.sidebarOverlay = byId("sidebarOverlay");
  dom.logoutBtn = byId("logoutBtn");
  dom.sidebarLogout = byId("sidebarLogout");
  dom.loader = byId("globalLoader");
  dom.toastContainer = byId("toastContainer");

  dom.welcomeCompany = byId("welcomeCompany");
  dom.avatarBadge = byId("avatarBadge");

  dom.statFunding = byId("statFunding");
  dom.statInvestors = byId("statInvestors");
  dom.statGrowth = byId("statGrowth");
  dom.statActiveFunding = byId("statActiveFunding");

  dom.chartCanvas = byId("revenueChart");
  dom.chartEmpty = byId("chartEmpty");

  dom.profileSkeleton = byId("profileSkeleton");
  dom.profileContent = byId("profileContent");
  dom.profileCompany = byId("profileCompany");
  dom.profileIndustry = byId("profileIndustry");
  dom.profileFoundedYear = byId("profileFoundedYear");
  dom.profileFundingNeeded = byId("profileFundingNeeded");
  dom.profileEquityOffered = byId("profileEquityOffered");
  dom.toggleProfileEditBtn = byId("toggleProfileEditBtn");
  dom.profileEditForm = byId("profileEditForm");
  dom.cancelProfileEditBtn = byId("cancelProfileEditBtn");
  dom.profileCompanyInput = byId("profileCompanyInput");
  dom.profileIndustryInput = byId("profileIndustryInput");
  dom.profileFoundedYearInput = byId("profileFoundedYearInput");
  dom.profileFundingNeededInput = byId("profileFundingNeededInput");
  dom.profileEquityInput = byId("profileEquityInput");

  dom.fundingForm = byId("fundingForm");
  dom.fundingId = byId("fundingId");
  dom.fundingAmount = byId("fundingAmount");
  dom.fundingEquity = byId("fundingEquity");
  dom.fundingPurpose = byId("fundingPurpose");
  dom.fundingStatus = byId("fundingStatus");
  dom.fundingSubmitBtn = byId("fundingSubmitBtn");
  dom.fundingCancelBtn = byId("fundingCancelBtn");
  dom.fundingModeBadge = byId("fundingModeBadge");
  dom.fundingSkeleton = byId("fundingSkeleton");
  dom.fundingContent = byId("fundingContent");
  dom.fundingTableBody = byId("fundingTableBody");
  dom.fundingMobileList = byId("fundingMobileList");
  dom.fundingEmpty = byId("fundingEmpty");

  dom.investorSkeleton = byId("investorSkeleton");
  dom.investorContent = byId("investorContent");
  dom.investorGrid = byId("investorGrid");
  dom.investorEmpty = byId("investorEmpty");
}

function bindInteractions() {
  if (dom.sidebarToggle) {
    dom.sidebarToggle.addEventListener("click", toggleSidebar);
  }
  if (dom.sidebarOverlay) {
    dom.sidebarOverlay.addEventListener("click", closeSidebar);
  }
  if (dom.logoutBtn) {
    dom.logoutBtn.addEventListener("click", handleLogout);
  }
  if (dom.sidebarLogout) {
    dom.sidebarLogout.addEventListener("click", handleLogout);
  }

  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      closeSidebar();
    }
  });

  if (dom.toggleProfileEditBtn) {
    dom.toggleProfileEditBtn.addEventListener("click", openProfileEditor);
  }
  if (dom.cancelProfileEditBtn) {
    dom.cancelProfileEditBtn.addEventListener("click", closeProfileEditor);
  }
  if (dom.profileEditForm) {
    dom.profileEditForm.addEventListener("submit", submitProfileUpdate);
  }

  if (dom.fundingForm) {
    dom.fundingForm.addEventListener("submit", submitFundingRequest);
  }
  if (dom.fundingCancelBtn) {
    dom.fundingCancelBtn.addEventListener("click", resetFundingForm);
  }

  if (dom.fundingTableBody) {
    dom.fundingTableBody.addEventListener("click", handleFundingActionClick);
  }
  if (dom.fundingMobileList) {
    dom.fundingMobileList.addEventListener("click", handleFundingActionClick);
  }
  if (dom.investorGrid) {
    dom.investorGrid.addEventListener("click", handleInvestorActionClick);
  }
}

function fadeInPage() {
  if (!dom.pageRoot) {
    return;
  }
  requestAnimationFrame(() => {
    dom.pageRoot.classList.remove("opacity-0");
    dom.pageRoot.classList.add("opacity-100");
  });
}

async function loadDashboard() {
  showLoader(true);
  try {
    const [profileResponse, statsResponse, analyticsResponse, fundingResponse, investorsResponse] =
      await Promise.all([
        request(API.profile),
        request(API.stats),
        request(API.analytics),
        request(API.funding),
        request(API.investors),
      ]);

    state.profile = profileResponse.profile || null;
    state.stats = statsResponse.stats || null;
    state.analytics = analyticsResponse.analytics || null;
    state.fundingRequests = Array.isArray(fundingResponse.fundingRequests)
      ? fundingResponse.fundingRequests
      : [];
    state.investors = Array.isArray(investorsResponse.investors)
      ? investorsResponse.investors
      : [];

    renderAll();
    showToast("Dashboard loaded successfully", "success");
  } catch (error) {
    console.error("loadDashboard error:", error);
    renderFailureState();
    showToast(error.message || "Failed to load dashboard", "error");
  } finally {
    showLoader(false);
  }
}

async function reloadFundingAndStats() {
  try {
    const [fundingResponse, statsResponse, analyticsResponse] = await Promise.all([
      request(API.funding),
      request(API.stats),
      request(API.analytics),
    ]);
    state.fundingRequests = Array.isArray(fundingResponse.fundingRequests)
      ? fundingResponse.fundingRequests
      : [];
    state.stats = statsResponse.stats || {};
    state.analytics = analyticsResponse.analytics || {};

    renderStats(state.stats);
    renderAnalytics(state.analytics);
    renderFunding(state.fundingRequests);
  } catch (error) {
    console.error("reloadFundingAndStats error:", error);
    showToast(error.message || "Failed to refresh funding data", "error");
  }
}

async function reloadInvestorsAndStats() {
  try {
    const [investorsResponse, statsResponse] = await Promise.all([
      request(API.investors),
      request(API.stats),
    ]);
    state.investors = Array.isArray(investorsResponse.investors)
      ? investorsResponse.investors
      : [];
    state.stats = statsResponse.stats || {};

    renderInvestors(state.investors);
    renderStats(state.stats);
  } catch (error) {
    console.error("reloadInvestorsAndStats error:", error);
    showToast(error.message || "Failed to refresh investors", "error");
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.token}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    handleSessionInvalid();
    throw new Error("Session expired. Please login again.");
  }

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

function renderAll() {
  renderHeader(state.profile || {});
  renderStats(state.stats || {});
  renderAnalytics(state.analytics || {});
  renderProfile(state.profile || {});
  renderFunding(state.fundingRequests || []);
  renderInvestors(state.investors || []);
}

function renderHeader(profile) {
  const companyName = (profile.companyName || "Company").trim();
  if (dom.welcomeCompany) {
    dom.welcomeCompany.textContent = companyName;
  }
  if (dom.avatarBadge) {
    dom.avatarBadge.textContent = getInitials(companyName);
  }
}

function renderStats(stats) {
  const totalFundingRaised = Number(stats.totalFundingRaised) || 0;
  const investorsConnected = Number(stats.investorsConnected) || 0;
  const growthRate = Number(stats.growthRate) || 0;
  const activeFundingRequests = Number(stats.activeFundingRequests) || 0;

  animateCounter(dom.statFunding, totalFundingRaised, {
    formatter: (value) => formatCurrency(value, 0),
  });
  animateCounter(dom.statInvestors, investorsConnected, {
    formatter: (value) => Math.round(value).toLocaleString("en-US"),
  });
  animateCounter(dom.statGrowth, growthRate, {
    formatter: (value) => `${value.toFixed(2)}%`,
  });
  animateCounter(dom.statActiveFunding, activeFundingRequests, {
    formatter: (value) => Math.round(value).toLocaleString("en-US"),
  });
}

function renderAnalytics(analytics) {
  if (!dom.chartCanvas) {
    return;
  }

  const labels = Array.isArray(analytics.labels) ? analytics.labels : [];
  const values = Array.isArray(analytics.values)
    ? analytics.values.map((value) => Number(value) || 0)
    : [];
  const hasData = labels.length > 0 && values.length > 0;

  if (dom.chartEmpty) {
    dom.chartEmpty.classList.toggle("hidden", hasData);
  }

  if (!hasData) {
    if (revenueChart) {
      revenueChart.destroy();
      revenueChart = null;
    }
    return;
  }

  if (revenueChart) {
    revenueChart.destroy();
  }

  const context = dom.chartCanvas.getContext("2d");
  const areaGradient = context.createLinearGradient(0, 0, 0, 280);
  areaGradient.addColorStop(0, "rgba(59, 130, 246, 0.45)");
  areaGradient.addColorStop(0.6, "rgba(99, 102, 241, 0.2)");
  areaGradient.addColorStop(1, "rgba(15, 23, 42, 0.02)");

  const maxValue = Math.max(...values, 0);
  const stepSize = maxValue > 0 ? Math.ceil(maxValue / 4) : 1;

  revenueChart = new Chart(context, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Funding",
          data: values,
          borderColor: "#60a5fa",
          backgroundColor: areaGradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2.4,
          pointRadius: 3.8,
          pointHoverRadius: 5.8,
          pointBackgroundColor: "#a78bfa",
          pointBorderColor: "#e2e8f0",
          pointBorderWidth: 1.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          borderColor: "rgba(96, 165, 250, 0.35)",
          borderWidth: 1,
          titleColor: "#f8fafc",
          bodyColor: "#e2e8f0",
          callbacks: {
            label(context) {
              return ` Amount: ${formatCurrency(context.parsed.y, 0)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "rgba(203, 213, 225, 0.8)" },
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValue + stepSize,
          ticks: {
            color: "rgba(203, 213, 225, 0.75)",
            stepSize,
            callback(value) {
              return formatCurrency(value, 0);
            },
          },
          grid: { color: "rgba(148, 163, 184, 0.13)" },
        },
      },
      animation: {
        duration: 1200,
        easing: "easeOutCubic",
      },
    },
  });
}

function renderProfile(profile) {
  if (dom.profileSkeleton) {
    dom.profileSkeleton.classList.add("hidden");
  }
  if (dom.profileContent) {
    dom.profileContent.classList.remove("hidden");
  }

  setText(dom.profileCompany, profile.companyName || "N/A");
  setText(dom.profileIndustry, profile.industry || "N/A");
  setText(dom.profileFoundedYear, profile.foundedYear || "N/A");
  setText(dom.profileFundingNeeded, profile.fundingNeeded || "N/A");
  setText(dom.profileEquityOffered, formatPercent(profile.equityOffered));
}

function openProfileEditor() {
  if (!state.profile || !dom.profileEditForm) {
    return;
  }

  dom.profileCompanyInput.value = state.profile.companyName || "";
  dom.profileIndustryInput.value = state.profile.industry || "";
  dom.profileFoundedYearInput.value = state.profile.foundedYear || "";
  dom.profileFundingNeededInput.value = state.profile.fundingNeeded || "";
  dom.profileEquityInput.value = Number(state.profile.equityOffered || 0);

  dom.profileEditForm.classList.remove("hidden");
  if (dom.toggleProfileEditBtn) {
    dom.toggleProfileEditBtn.classList.add("hidden");
  }
}

function closeProfileEditor() {
  if (dom.profileEditForm) {
    dom.profileEditForm.classList.add("hidden");
  }
  if (dom.toggleProfileEditBtn) {
    dom.toggleProfileEditBtn.classList.remove("hidden");
  }
}

async function submitProfileUpdate(event) {
  event.preventDefault();
  try {
    const payload = {
      companyName: dom.profileCompanyInput.value.trim(),
      industry: dom.profileIndustryInput.value.trim(),
      foundedYear: Number(dom.profileFoundedYearInput.value),
      fundingNeeded: dom.profileFundingNeededInput.value.trim(),
      equityOffered: Number(dom.profileEquityInput.value),
    };

    const response = await request(API.profile, { method: "PUT", body: payload });
    state.profile = response.profile || payload;
    renderHeader(state.profile);
    renderProfile(state.profile);
    closeProfileEditor();
    showToast("Company profile updated", "success");
  } catch (error) {
    console.error("submitProfileUpdate error:", error);
    showToast(error.message || "Failed to update profile", "error");
  }
}

function renderFunding(fundingRequests) {
  if (dom.fundingSkeleton) {
    dom.fundingSkeleton.classList.add("hidden");
  }
  if (dom.fundingContent) {
    dom.fundingContent.classList.remove("hidden");
  }

  if (!dom.fundingTableBody || !dom.fundingMobileList || !dom.fundingEmpty) {
    return;
  }

  dom.fundingTableBody.innerHTML = "";
  dom.fundingMobileList.innerHTML = "";

  if (!fundingRequests.length) {
    dom.fundingEmpty.classList.remove("hidden");
    return;
  }
  dom.fundingEmpty.classList.add("hidden");

  dom.fundingTableBody.innerHTML = fundingRequests
    .map((request) => {
      const statusClass = FUNDING_STATUS_STYLES[request.status] || FUNDING_STATUS_STYLES.Open;
      return `
        <tr class="text-slate-200/95">
          <td class="px-4 py-3 font-medium">${formatCurrency(request.amount, 0)}</td>
          <td class="px-4 py-3">${formatPercent(request.equity)}</td>
          <td class="px-4 py-3">${escapeHtml(request.purpose || "N/A")}</td>
          <td class="px-4 py-3">
            <span class="inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass}">
              ${escapeHtml(request.status || "Open")}
            </span>
          </td>
          <td class="px-4 py-3 text-slate-300/90">${formatDate(request.createdAt)}</td>
          <td class="px-4 py-3 text-right">
            <div class="inline-flex gap-2">
              <button data-funding-action="edit" data-funding-id="${request.id}" class="btn-secondary rounded-lg px-3 py-1.5 text-xs">Edit</button>
              <button data-funding-action="delete" data-funding-id="${request.id}" class="rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/25">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  dom.fundingMobileList.innerHTML = fundingRequests
    .map((request) => {
      const statusClass = FUNDING_STATUS_STYLES[request.status] || FUNDING_STATUS_STYLES.Open;
      return `
        <article class="rounded-2xl border border-slate-600/30 bg-slate-900/50 p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="font-display text-base">${formatCurrency(request.amount, 0)}</p>
            <span class="inline-flex rounded-full border px-2.5 py-1 text-[11px] ${statusClass}">
              ${escapeHtml(request.status || "Open")}
            </span>
          </div>
          <p class="text-xs text-slate-400">Equity</p>
          <p class="mb-2 text-sm">${formatPercent(request.equity)}</p>
          <p class="text-xs text-slate-400">Purpose</p>
          <p class="mb-2 text-sm">${escapeHtml(request.purpose || "N/A")}</p>
          <p class="text-xs text-slate-400">Created</p>
          <p class="text-sm">${formatDate(request.createdAt)}</p>
          <div class="mt-3 flex gap-2">
            <button data-funding-action="edit" data-funding-id="${request.id}" class="btn-secondary flex-1 rounded-lg px-3 py-1.5 text-xs">Edit</button>
            <button data-funding-action="delete" data-funding-id="${request.id}" class="flex-1 rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/25">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function submitFundingRequest(event) {
  event.preventDefault();

  try {
    const id = dom.fundingId.value.trim();
    const payload = {
      amount: Number(dom.fundingAmount.value),
      equity: Number(dom.fundingEquity.value),
      purpose: dom.fundingPurpose.value.trim(),
      status: dom.fundingStatus.value,
    };

    if (!payload.purpose) {
      showToast("Purpose is required", "error");
      return;
    }

    if (id) {
      await request(`${API.funding}/${id}`, { method: "PUT", body: payload });
      showToast("Funding request updated", "success");
    } else {
      await request(API.funding, { method: "POST", body: payload });
      showToast("Funding request created", "success");
    }

    resetFundingForm();
    await reloadFundingAndStats();
  } catch (error) {
    console.error("submitFundingRequest error:", error);
    showToast(error.message || "Failed to save funding request", "error");
  }
}

function resetFundingForm() {
  dom.fundingId.value = "";
  dom.fundingAmount.value = "";
  dom.fundingEquity.value = "";
  dom.fundingPurpose.value = "";
  dom.fundingStatus.value = "Open";
  dom.fundingSubmitBtn.textContent = "Create";
  dom.fundingModeBadge.textContent = "Create";
  dom.fundingCancelBtn.classList.add("hidden");
}

function startFundingEdit(request) {
  dom.fundingId.value = request.id;
  dom.fundingAmount.value = request.amount;
  dom.fundingEquity.value = request.equity;
  dom.fundingPurpose.value = request.purpose || "";
  dom.fundingStatus.value = request.status || "Open";
  dom.fundingSubmitBtn.textContent = "Update";
  dom.fundingModeBadge.textContent = "Edit";
  dom.fundingCancelBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleFundingActionClick(event) {
  const button = event.target.closest("[data-funding-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.fundingAction;
  const fundingId = button.dataset.fundingId;
  const requestItem = state.fundingRequests.find((item) => item.id === fundingId);
  if (!requestItem) {
    return;
  }

  if (action === "edit") {
    startFundingEdit(requestItem);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("Delete this funding request?");
    if (!confirmed) {
      return;
    }

    try {
      await request(`${API.funding}/${fundingId}`, { method: "DELETE" });
      if (dom.fundingId.value === fundingId) {
        resetFundingForm();
      }
      await reloadFundingAndStats();
      showToast("Funding request deleted", "success");
    } catch (error) {
      console.error("delete funding error:", error);
      showToast(error.message || "Failed to delete funding request", "error");
    }
  }
}

function renderInvestors(investors) {
  if (dom.investorSkeleton) {
    dom.investorSkeleton.classList.add("hidden");
  }
  if (dom.investorContent) {
    dom.investorContent.classList.remove("hidden");
  }
  if (!dom.investorGrid || !dom.investorEmpty) {
    return;
  }

  dom.investorGrid.innerHTML = "";

  if (!investors.length) {
    dom.investorEmpty.classList.remove("hidden");
    return;
  }
  dom.investorEmpty.classList.add("hidden");

  dom.investorGrid.innerHTML = investors
    .map((investor) => {
      const connectionStatus = investor.connectionStatus || "Not Connected";
      const statusClass =
        CONNECTION_STATUS_STYLES[connectionStatus] || CONNECTION_STATUS_STYLES["Not Connected"];

      return `
        <article class="rounded-2xl border border-slate-600/30 bg-slate-900/50 p-4 transition hover:-translate-y-1 hover:border-blue-400/45">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-display text-base font-semibold">${escapeHtml(investor.fullName || "Unnamed Investor")}</h3>
            <span class="rounded-full border border-slate-500/35 px-2 py-0.5 text-[11px] text-slate-300">
              ${escapeHtml(investor.investorType || "Investor")}
            </span>
          </div>
          <p class="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">Investment Range</p>
          <p class="text-sm text-slate-200">${escapeHtml(investor.investmentRange || "N/A")}</p>
          <p class="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">Preferred Industry</p>
          <p class="text-sm text-slate-200">${escapeHtml(investor.preferredIndustry || "N/A")}</p>
          <p class="mt-2">
            <span class="inline-flex rounded-full border px-2.5 py-1 text-[11px] ${statusClass}">
              ${escapeHtml(connectionStatus)}
            </span>
          </p>
          <div class="mt-4 grid grid-cols-3 gap-2">
            <button data-investor-action="connect" data-investor-id="${investor.id}" class="btn-glow rounded-xl px-2 py-2 text-xs">Connect</button>
            <button data-investor-action="accept" data-investor-id="${investor.id}" class="btn-secondary rounded-xl px-2 py-2 text-xs">Accept</button>
            <button data-investor-action="reject" data-investor-id="${investor.id}" class="rounded-xl border border-rose-400/35 bg-rose-500/15 px-2 py-2 text-xs text-rose-200 transition hover:bg-rose-500/25">Reject</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function handleInvestorActionClick(event) {
  const button = event.target.closest("[data-investor-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.investorAction;
  const investorId = button.dataset.investorId;
  if (!investorId) {
    return;
  }

  try {
    await request(API.connect(investorId), {
      method: "POST",
      body: { action },
    });
    await reloadInvestorsAndStats();
    showToast(`Investor ${action} action completed`, "success");
  } catch (error) {
    console.error("handleInvestorActionClick error:", error);
    showToast(error.message || "Failed to update investor connection", "error");
  }
}

function renderFailureState() {
  if (dom.profileSkeleton) {
    dom.profileSkeleton.classList.add("hidden");
  }
  if (dom.profileContent) {
    dom.profileContent.classList.remove("hidden");
  }

  if (dom.fundingSkeleton) {
    dom.fundingSkeleton.classList.add("hidden");
  }
  if (dom.fundingContent) {
    dom.fundingContent.classList.remove("hidden");
  }
  if (dom.fundingEmpty) {
    dom.fundingEmpty.classList.remove("hidden");
    dom.fundingEmpty.textContent = "Could not load funding requests.";
  }

  if (dom.investorSkeleton) {
    dom.investorSkeleton.classList.add("hidden");
  }
  if (dom.investorContent) {
    dom.investorContent.classList.remove("hidden");
  }
  if (dom.investorEmpty) {
    dom.investorEmpty.classList.remove("hidden");
    dom.investorEmpty.textContent = "Could not load investor connections.";
  }
}

function animateCounter(element, targetValue, options = {}) {
  if (!element) {
    return;
  }

  const duration = 1000;
  const start = performance.now();
  const formatter =
    typeof options.formatter === "function"
      ? options.formatter
      : (value) => Math.round(value).toLocaleString("en-US");

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const current = targetValue * progress;
    element.textContent = formatter(current);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = formatter(targetValue);
    }
  }

  requestAnimationFrame(tick);
}

function toggleSidebar() {
  if (!dom.sidebar || !dom.sidebarOverlay) {
    return;
  }
  if (dom.sidebar.classList.contains("-translate-x-full")) {
    dom.sidebar.classList.remove("-translate-x-full");
    dom.sidebarOverlay.classList.remove("hidden");
  } else {
    closeSidebar();
  }
}

function closeSidebar() {
  if (!dom.sidebar || !dom.sidebarOverlay) {
    return;
  }
  dom.sidebar.classList.add("-translate-x-full");
  dom.sidebarOverlay.classList.add("hidden");
}

function handleLogout() {
  showToast("Signing out...", "info");
  if (dom.pageRoot) {
    dom.pageRoot.classList.add("opacity-0");
  }
  setTimeout(() => {
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin();
  }, 350);
}

function handleSessionInvalid() {
  localStorage.removeItem(TOKEN_KEY);
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = "/login";
}

function showLoader(show) {
  if (!dom.loader) {
    return;
  }
  if (show) {
    dom.loader.classList.remove("hidden");
    dom.loader.classList.add("flex");
  } else {
    dom.loader.classList.add("hidden");
    dom.loader.classList.remove("flex");
  }
}

function showToast(message, type = "info") {
  if (!dom.toastContainer) {
    return;
  }

  const variant = {
    success: "toast-success",
    error: "toast-error",
    info: "toast-info",
  }[type] || "toast-info";

  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

function formatCurrency(value, maximumFractionDigits = 0) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(amount);
}

function formatPercent(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "N/A";
  }
  return `${numeric.toFixed(2)}%`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name) {
  const parts = String(name || "Company")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return "CO";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function byId(id) {
  return document.getElementById(id);
}
