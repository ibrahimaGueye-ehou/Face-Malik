/* ==========================================================================
   THE BOSS — par Malik Eudy
   --------------------------------------------------------------------------
   CONFIGURATION : renseignez ici le lien de la chaîne YouTube et l'adresse
   e-mail qui recevra les propositions d'invités.
   ========================================================================== */
const CONFIG = {
  youtubeUrl: "https://www.youtube.com/", // ex. "https://www.youtube.com/@TheBossParMalikEudy"
  contactEmail: "contact@example.com",     // ex. "contact@theboss.fr"
};

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- YouTube links ---------- */
  document.querySelectorAll(".js-youtube").forEach((a) => {
    a.href = CONFIG.youtubeUrl;
  });

  /* ---------- Year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header on scroll ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("main-nav");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- Active nav link ---------- */
  const links = [...document.querySelectorAll(".main-nav a[href^='#']:not(.btn)")];
  const sections = links
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  // stagger siblings
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.08, 0.4) + "s");
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Contact form (opens the visitor's mail client) ---------- */
  const form = document.getElementById("contact-form");
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll("input, select, textarea")];
    let firstInvalid = null;
    fields.forEach((f) => {
      const ok = f.checkValidity() && f.value.trim() !== "";
      f.classList.toggle("is-invalid", !ok);
      f.setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstInvalid) firstInvalid = f;
    });
    if (firstInvalid) {
      status.textContent = "Merci de compléter correctement tous les champs.";
      status.className = "form-status is-error";
      firstInvalid.focus();
      return;
    }

    const data = new FormData(form);
    const subject = `THE BOSS — Proposition d'invité : ${data.get("name")}`;
    const body =
      `Nom : ${data.get("name")}\n` +
      `E-mail : ${data.get("email")}\n` +
      `Profil : ${data.get("profile")}\n\n` +
      `Mon histoire :\n${data.get("story")}\n`;
    window.location.href =
      `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent = "Merci ! Votre messagerie va s’ouvrir pour finaliser l’envoi de votre proposition.";
    status.className = "form-status is-success";
  });
  form.querySelectorAll("input, select, textarea").forEach((f) =>
    f.addEventListener("input", () => {
      f.classList.remove("is-invalid");
      f.removeAttribute("aria-invalid");
    })
  );
});
