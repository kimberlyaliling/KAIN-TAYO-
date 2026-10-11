(function () {
	const loginKey = "pinoyTastyLoggedIn";
	const accountsKey = "pinoyTastyAccounts";
	const passwordIterations = 210000;
	const scriptUrl = document.currentScript.src;
	const loginUrl = new URL("Log In.html", scriptUrl);
	const homeUrl = new URL("index.html", scriptUrl);
	const currentPath = decodeURIComponent(window.location.pathname).toLowerCase();
	const isLoginPage = /\/log in(\.html)?\/?$/.test(currentPath);
	const isFoodiePage = currentPath.includes("/foodies/");
	const readAccounts = function () {
		try {
			const accounts = JSON.parse(localStorage.getItem(accountsKey) || "[]");
			return Array.isArray(accounts) ? accounts : [];
		} catch (error) {
			return [];
		}
	};

	const createFeedbackElement = function (tagName, className, text) {
		const element = document.createElement(tagName);
		if (className) {
			element.className = className;
		}
		if (text) {
			element.textContent = text;
		}
		return element;
	};

	const setupRecipeNavigation = function () {
		const navLinks = document.querySelector(".navbar .nav-links");
		const currentDirectory = window.location.pathname.split("/").slice(-2, -1)[0].toLowerCase();
		const regionByDirectory = {
			luzndish: "Luzon",
			visdish: "Visayas",
			midish: "Mindanao"
		};
		const currentRegion = regionByDirectory[currentDirectory];
		if (!navLinks || !currentRegion || navLinks.children.length > 0) {
			return;
		}

		[
			{ label: "Home", href: "../index.html" },
			{ label: "About", href: "../About.html" },
			{ label: "Luzon", href: "../Luzon.html" },
			{ label: "Visayas", href: "../Visayas.html" },
			{ label: "Mindanao", href: "../Mindanao.html" }
		].forEach(function (item) {
			const link = createFeedbackElement("a", "", item.label);
			link.href = item.href;
			if (item.label === currentRegion) {
				link.classList.add("active");
				link.setAttribute("aria-current", "page");
			}
			navLinks.append(link);
		});
	};

	const setupDishRatings = function () {
		const recipe = document.querySelector(".luzon-recipe, .visayas-recipe, .mindanao-recipe");
		if (!recipe) {
			return;
		}

		const existingPanel = recipe.querySelector(".dish-user-rating");
		if (existingPanel) {
			return;
		}

		const heading = document.querySelector(".recipe-heading-copy h1") || recipe.querySelector(".recipe-heading-copy h1");
		const dishName = heading ? heading.textContent.trim() : document.title.replace(/^Pinoy Tasty \|\s*/i, "").trim();
		const dishSlug = decodeURIComponent(window.location.pathname.split("/").pop()).replace(/\.html$/i, "").toLowerCase();
		const storageKey = "pinoyTastyDishRatings";
		const getRatings = function () {
			try {
				const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
				return parsed && typeof parsed === "object" ? parsed : {};
			} catch (error) {
				return {};
			}
		};
		const setRatings = function (ratings) {
			localStorage.setItem(storageKey, JSON.stringify(ratings));
		};
		const form = createFeedbackElement("section", "dish-user-rating");
		const title = createFeedbackElement("h2", "dish-user-rating-title", "Rate this dish");
		const summary = createFeedbackElement("p", "dish-user-rating-summary");
		const starRow = createFeedbackElement("div", "dish-user-stars");
		const hint = createFeedbackElement("p", "dish-user-rating-hint", "Choose a rating from 1 to 5 stars.");
		const status = createFeedbackElement("p", "dish-user-rating-status");
		status.setAttribute("role", "status");
		status.setAttribute("aria-live", "polite");
		const submitButton = createFeedbackElement("button", "dish-user-rating-submit", "Submit rating");
		submitButton.type = "submit";

		let selectedRating = 0;
		const buttonList = [];
		for (let rating = 1; rating <= 5; rating += 1) {
			const button = createFeedbackElement("button", "dish-user-star", "★");
			button.type = "button";
			button.setAttribute("aria-label", "Rate this dish " + rating + " out of 5");
			button.addEventListener("click", function () {
				selectedRating = rating;
				buttonList.forEach(function (star, index) {
					const isActive = index < rating;
					star.classList.toggle("is-active", isActive);
					star.setAttribute("aria-pressed", String(isActive));
				});
				hint.textContent = "Your rating: " + rating + "/5";
				status.textContent = "";
			});
			buttonList.push(button);
			starRow.append(button);
		}

		const renderSummary = function () {
			const ratings = getRatings();
			const dishRatings = Array.isArray(ratings[dishSlug]) ? ratings[dishSlug] : [];
			if (dishRatings.length === 0) {
				summary.textContent = "No ratings yet. Be the first to rate " + dishName + ".";
				return;
			}
			const total = dishRatings.reduce(function (sum, value) {
				return sum + Number(value);
			}, 0);
			const average = total / dishRatings.length;
			summary.textContent = "Average rating: " + average.toFixed(1) + "/5 from " + dishRatings.length + (dishRatings.length === 1 ? " rating" : " ratings") + ".";
		};

		const formElement = createFeedbackElement("form", "dish-rating-form");
		formElement.append(starRow, hint, submitButton, status);
		form.append(title, summary, formElement);
		const recipeLink = recipe.querySelector(".recipe-link");
		if (recipeLink) {
			recipeLink.insertAdjacentElement("afterend", form);
		} else {
			recipe.append(form);
		}

		formElement.addEventListener("submit", function (event) {
			event.preventDefault();
			if (!selectedRating) {
				status.textContent = "Please select a rating before submitting.";
				status.classList.add("is-error");
				return;
			}

			const ratings = getRatings();
			const dishRatings = Array.isArray(ratings[dishSlug]) ? ratings[dishSlug] : [];
			dishRatings.push(selectedRating);
			ratings[dishSlug] = dishRatings;
			setRatings(ratings);
			selectedRating = 0;
			buttonList.forEach(function (star) {
				star.classList.remove("is-active");
				star.setAttribute("aria-pressed", "false");
			});
			hint.textContent = "Thanks for rating this dish!";
			status.textContent = "";
			renderSummary();
		});

		renderSummary();
	};

	const loggedInEmail = localStorage.getItem(loginKey);
	const isAccountLoggedIn = typeof loggedInEmail === "string" &&
		readAccounts().some(function (account) {
			return account.email === loggedInEmail;
		});

	if (!isLoginPage && !isFoodiePage && !isAccountLoggedIn) {
		window.location.replace(loginUrl.href);
		return;
	}

	document.addEventListener("DOMContentLoaded", function () {
		setupRecipeNavigation();
		setupDishRatings();
		const logoutButton = document.querySelector("#logout-button");
		if (logoutButton) {
			logoutButton.addEventListener("click", function () {
				localStorage.removeItem(loginKey);
				window.location.replace(loginUrl.href);
			});
		}
	});

	if (isLoginPage) {
		document.addEventListener("DOMContentLoaded", function () {
			const createForm = document.querySelector("#create-account-form");
			const loginForm = document.querySelector("#login-form");
			const modeButtons = document.querySelectorAll("[data-auth-mode]");
			const message = document.querySelector(".auth-message");

			if (!createForm || !loginForm || !message) {
				return;
			}

			const showMessage = function (text, isError) {
				message.textContent = text;
				message.classList.toggle("is-error", isError);
			};

			const setMode = function (mode) {
				const isCreateMode = mode === "create";
				createForm.hidden = !isCreateMode;
				loginForm.hidden = isCreateMode;
				modeButtons.forEach(function (button) {
					const isActive = button.dataset.authMode === mode;
					button.classList.toggle("is-active", isActive);
					button.setAttribute("aria-pressed", String(isActive));
				});
				showMessage("", false);
			};

			modeButtons.forEach(function (button) {
				button.addEventListener("click", function () {
					setMode(button.dataset.authMode);
				});
			});

			const hashPassword = async function (password, salt) {
				const encoder = new TextEncoder();
				const keyMaterial = await crypto.subtle.importKey(
					"raw",
					encoder.encode(password),
					"PBKDF2",
					false,
					["deriveBits"]
				);
				const bits = await crypto.subtle.deriveBits(
					{ name: "PBKDF2", salt: encoder.encode(salt), iterations: passwordIterations, hash: "SHA-256" },
					keyMaterial,
					256
				);
				return Array.from(new Uint8Array(bits), function (byte) {
					return byte.toString(16).padStart(2, "0");
				}).join("");
			};

			createForm.addEventListener("submit", async function (event) {
				event.preventDefault();

				if (!createForm.checkValidity()) {
					createForm.reportValidity();
					return;
				}

				const formData = new FormData(createForm);
				const email = String(formData.get("email")).trim().toLowerCase();
				const password = String(formData.get("password"));
				const confirmation = String(formData.get("confirm-password"));

				if (password !== confirmation) {
					showMessage("Those passwords do not match.", true);
					return;
				}

				const accounts = readAccounts();
				if (accounts.some(function (account) { return account.email === email; })) {
					showMessage("An account with that email already exists. Sign in instead.", true);
					return;
				}

				try {
					if (!crypto.subtle) {
						throw new Error("Secure password hashing is unavailable.");
					}
					const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), function (byte) {
						return byte.toString(16).padStart(2, "0");
					}).join("");
					const passwordHash = await hashPassword(password, salt);
					accounts.push({ email: email, salt: salt, passwordHash: passwordHash });
					localStorage.setItem(accountsKey, JSON.stringify(accounts));
					localStorage.removeItem(loginKey);
					loginForm.elements.email.value = email;
					createForm.reset();
					setMode("login");
					showMessage("Your account was created. Sign in with your email and password to continue.", false);
				} catch (error) {
					showMessage("We could not create your account in this browser. Please try again.", true);
				}
			});

			loginForm.addEventListener("submit", async function (event) {
				event.preventDefault();

				if (!loginForm.checkValidity()) {
					loginForm.reportValidity();
					return;
				}

				const formData = new FormData(loginForm);
				const email = String(formData.get("email")).trim().toLowerCase();
				const password = String(formData.get("password"));
				const account = readAccounts().find(function (savedAccount) {
					return savedAccount.email === email;
				});

				if (!account) {
					showMessage("No account found for that email. Create an account first.", true);
					return;
				}

				try {
					const passwordHash = await hashPassword(password, account.salt);
					if (passwordHash !== account.passwordHash) {
						showMessage("That email and password do not match.", true);
						return;
					}
					localStorage.setItem(loginKey, email);
					window.location.replace(homeUrl.href);
				} catch (error) {
					showMessage("We could not sign you in. Please try again.", true);
				}
			});
		});
	}
})();
