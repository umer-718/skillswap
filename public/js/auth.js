
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

async function submitAuth(url, form) {
    const message = document.getElementById("message");
    const button = form.querySelector("button");

    try {
        button.disabled = true;
        button.textContent = "Please wait...";

        message.style.display = "none";

        const formData = Object.fromEntries(
            new FormData(form)
        );

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        if (form.id === "registerForm") {
            alert("Account created successfully! Please login.");

            window.location.href = "/login";
            return;
        }

        if (form.id === "loginForm") {
            window.location.href = "/dashboard";
            return;
        }

    } catch (error) {
        message.textContent = error.message;
        message.style.display = "block";

    } finally {
        button.disabled = false;

        button.textContent =
            form.id === "loginForm"
                ? "Login"
                : "Create Account";
    }
}


if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();

        submitAuth("/api/auth/login", loginForm);
    });
}


if (registerForm) {
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault();

        submitAuth("/api/auth/register", registerForm);
    });
}
