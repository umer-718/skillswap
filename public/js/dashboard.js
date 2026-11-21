const $ = selector => document.querySelector(selector);

let currentUser = null;
let mySkills = [];
let allSkills = [];

// API HELPER
async function api(url, options = {}) {

    const response = await fetch(url, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}


// HTML SECURITY
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


// SHOW MESSAGE
function showMessage(selector, message) {

    const element = $(selector);

    element.textContent = message;
    element.style.display = "block";
}


// MODAL
function openModal(id) {
    $("#" + id).style.display = "grid";
}

function closeModal(id) {
    $("#" + id).style.display = "none";
}


// LOAD USER
async function loadUser() {

    const data = await api("/api/auth/me");

    currentUser = data.user;

    $("#userName").textContent = currentUser.name;

    $("#welcomeText").textContent =
        "Welcome, " + currentUser.name;
}


// LOAD ALL SKILLS
async function loadSkills() {

    const search = $("#searchInput").value;

    const type = $("#typeFilter").value;

    const params = new URLSearchParams({
        search,
        type
    });

    const data = await api("/api/skills?" + params);

    allSkills = data.skills;

    displaySkills();
}


// DISPLAY SKILLS
function displaySkills() {

    const container = $("#skillsContainer");

    if (!allSkills.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No Skills Found</h3>
                <p>Try searching for another skill.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = allSkills.map(skill => {

        const isOwner =
            Number(skill.user_id) === Number(currentUser.id);

        const typeClass =
            skill.skill_type === "OFFER" ? "" : "learn";

        const typeText =
            skill.skill_type === "OFFER"
                ? "CAN TEACH"
                : "WANTS TO LEARN";

        let action = "";

        if (!isOwner && skill.skill_type === "OFFER") {

            action = `
                <button
                    class="btn"
                    data-exchange="${skill.id}"
                >
                    Propose Exchange
                </button>
            `;

        } else if (isOwner) {

            action = `<span class="small">Your listing</span>`;

        }

        return `

            <div class="skill-card">

                <span class="skill-type ${typeClass}">
                    ${typeText}
                </span>

                <h3>${escapeHTML(skill.title)}</h3>

                <div class="skill-category">
                    ${escapeHTML(skill.category)}
                </div>

                <p>
                    ${escapeHTML(skill.description)}
                </p>

                <div class="small">
                    Posted by ${escapeHTML(skill.user_name)}
                </div>

                ${action}

            </div>

        `;

    }).join("");
}


// LOAD MY SKILLS
async function loadMySkills() {

    const data = await api("/api/skills/mine");

    mySkills = data.skills;

    displayMySkills();
}


// DISPLAY MY SKILLS
function displayMySkills() {

    const container = $("#mySkillsContainer");

    if (!mySkills.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No Skills Added</h3>
                <p>Start by adding your first skill.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = mySkills.map(skill => `

        <div class="skill-card">

            <span class="skill-type ${
                skill.skill_type === "LEARN" ? "learn" : ""
            }">

                ${skill.skill_type === "OFFER"
                    ? "CAN TEACH"
                    : "WANTS TO LEARN"}

            </span>

            <h3>${escapeHTML(skill.title)}</h3>

            <div class="skill-category">
                ${escapeHTML(skill.category)}
            </div>

            <p>${escapeHTML(skill.description)}</p>

            <button
                class="delete-btn"
                data-delete="${skill.id}"
            >
                Delete Skill
            </button>

        </div>

    `).join("");
}


// ADD SKILL
$("#openSkillModal").addEventListener("click", () => {

    openModal("skillModal");

});


$("#skillForm").addEventListener("submit", async event => {

    event.preventDefault();

    try {

        const formData = Object.fromEntries(
            new FormData(event.target)
        );

        await api("/api/skills", {

            method: "POST",

            body: JSON.stringify(formData)

        });

        event.target.reset();

        closeModal("skillModal");

        await loadMySkills();

        await loadSkills();

        alert("Skill added successfully!");

    } catch (error) {

        showMessage("#skillMessage", error.message);

    }

});


// DELETE SKILL
async function deleteSkill(id) {

    if (!confirm("Are you sure you want to delete this skill?")) {
        return;
    }

    try {

        await api("/api/skills/" + id, {
            method: "DELETE"
        });

        await loadMySkills();

        await loadSkills();

        alert("Skill deleted successfully.");

    } catch (error) {

        alert(error.message);

    }
}


// OPEN EXCHANGE MODAL
function openExchange(skillId) {

    const wantedSkill = allSkills.find(
        skill => Number(skill.id) === Number(skillId)
    );

    if (!wantedSkill) return;

    const offeredSkills = mySkills.filter(
        skill => skill.skill_type === "OFFER"
    );

    if (!offeredSkills.length) {

        alert(
            "First add a skill that you can teach."
        );

        switchTab("mySkills");

        openModal("skillModal");

        return;
    }

    $("#wantedSkillId").value = wantedSkill.id;

    $("#wantedSkillText").textContent =
        "You want to learn " +
        wantedSkill.title +
        " from " +
        wantedSkill.user_name;

    $("#offeredSkillSelect").innerHTML =
        offeredSkills.map(skill => `

            <option value="${skill.id}">
                ${escapeHTML(skill.title)}
            </option>

        `).join("");

    openModal("exchangeModal");
}


// SEND EXCHANGE REQUEST
$("#exchangeForm").addEventListener("submit", async event => {

    event.preventDefault();

    try {

        const formData = Object.fromEntries(
            new FormData(event.target)
        );

        await api("/api/requests", {

            method: "POST",

            body: JSON.stringify(formData)

        });

        event.target.reset();

        closeModal("exchangeModal");

        await loadRequests();

        switchTab("requests");

        alert("Exchange request sent!");

    } catch (error) {

        showMessage("#exchangeMessage", error.message);

    }

});


// LOAD EXCHANGE REQUESTS
async function loadRequests() {

    const data = await api("/api/requests");

    displayRequests(data.requests);
}


// DISPLAY REQUESTS
function displayRequests(requests) {

    const container = $("#requestsContainer");

    if (!requests.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No Exchange Requests</h3>
                <p>Your exchange requests will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = requests.map(request => {

        const incoming =
            Number(request.receiver_id) === Number(currentUser.id);

        const otherPerson = incoming
            ? request.requester_name
            : request.receiver_name;

        let actions = "";

        if (incoming && request.status === "PENDING") {

            actions = `

                <button
                    class="btn accept-btn"
                    data-status="${request.id}"
                    data-value="ACCEPTED"
                >
                    Accept
                </button>

                <button
                    class="btn reject-btn"
                    data-status="${request.id}"
                    data-value="REJECTED"
                >
                    Reject
                </button>

            `;

        }

        if (!incoming && request.status === "PENDING") {

            actions = `

                <button
                    class="btn reject-btn"
                    data-status="${request.id}"
                    data-value="CANCELLED"
                >
                    Cancel Request
                </button>

            `;

        }

        if (request.status === "ACCEPTED") {

            actions = `

                <button
                    class="btn accept-btn"
                    data-status="${request.id}"
                    data-value="COMPLETED"
                >
                    Mark Completed
                </button>

            `;

        }

        return `

            <div class="request-card">

                <h3>
                    ${incoming ? "From" : "To"}
                    ${escapeHTML(otherPerson)}
                </h3>

                <span class="status">
                    ${escapeHTML(request.status)}
                </span>

                <p>
                    <strong>Offering:</strong>
                    ${escapeHTML(request.offered_title)}
                </p>

                <p>
                    <strong>Wants:</strong>
                    ${escapeHTML(request.wanted_title)}
                </p>

                <p>
                    ${escapeHTML(request.message || "No message")}
                </p>

                <div class="request-actions">
                    ${actions}
                </div>

            </div>

        `;

    }).join("");
}


// UPDATE REQUEST
async function updateRequest(id, status) {

    try {

        await api("/api/requests/" + id, {

            method: "PATCH",

            body: JSON.stringify({ status })

        });

        await loadRequests();

        alert("Request updated successfully.");

    } catch (error) {

        alert(error.message);

    }
}


// TAB SWITCHING
function switchTab(tabName) {

    document.querySelectorAll(".tab").forEach(tab => {

        tab.classList.toggle(
            "active",
            tab.dataset.tab === tabName
        );

    });

    document.querySelectorAll(".tab-content").forEach(section => {

        section.hidden = section.id !== tabName;

    });

    if (tabName === "discover") loadSkills();

    if (tabName === "mySkills") loadMySkills();

    if (tabName === "requests") loadRequests();

}


document.querySelectorAll(".tab").forEach(tab => {

    tab.addEventListener("click", () => {

        switchTab(tab.dataset.tab);

    });

});


// SEARCH
$("#searchInput").addEventListener("input", loadSkills);

$("#typeFilter").addEventListener("change", loadSkills);


// BUTTON EVENTS
document.addEventListener("click", event => {

    const exchange = event.target.closest("[data-exchange]");

    const remove = event.target.closest("[data-delete]");

    const status = event.target.closest("[data-status]");

    const close = event.target.closest("[data-close]");


    if (exchange) {

        openExchange(exchange.dataset.exchange);

    }

    if (remove) {

        deleteSkill(remove.dataset.delete);

    }

    if (status) {

        updateRequest(
            status.dataset.status,
            status.dataset.value
        );

    }

    if (close) {

        closeModal(
            close.closest(".modal").id
        );

    }

});


// LOGOUT
$("#logoutBtn").addEventListener("click", async () => {

    try {

        await api("/api/auth/logout", {
            method: "POST"
        });

        window.location.href = "/login";

    } catch (error) {

        alert(error.message);

    }

});


// INITIALIZE DASHBOARD
async function initializeDashboard() {

    try {

        await loadUser();

        await Promise.all([
            loadSkills(),
            loadMySkills(),
            loadRequests()
        ]);

    } catch (error) {

        window.location.href = "/login";

    }

}

initializeDashboard();