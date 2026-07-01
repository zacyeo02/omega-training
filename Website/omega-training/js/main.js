// Omega Training — shared site behaviour

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 300px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  const form = document.querySelector("#enquiry-form");
  if (form) {
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type='submit']");

    const setStatus = (message, type) => {
      if (!status) return;
      status.textContent = message;
      status.className = "form-status is-active is-" + type;
      status.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const original = button.textContent;
      button.textContent = "Sending...";
      button.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { "Accept": "application/json" },
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
          form.reset();
          setStatus(data.message || "Thanks, your enquiry is on its way. We'll be in touch shortly.", "success");
          button.textContent = "Enquiry sent";
        } else {
          setStatus(data.message || "Sorry, something went wrong. Please email c.dyson@omegalife.uk or call 0151 487 0055.", "error");
          button.textContent = original;
          button.disabled = false;
        }
      } catch (err) {
        setStatus("We couldn't send that just now. Please email c.dyson@omegalife.uk or call 0151 487 0055.", "error");
        button.textContent = original;
        button.disabled = false;
      }
    });
  }
});
