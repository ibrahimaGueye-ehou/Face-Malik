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

  /* ---------- Hero : plateau en 3D (parallaxe par carte de profondeur) ---------- */
  initStudio3D();

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


/* ==========================================================================
   Plateau 3D : la photo est déformée en WebGL selon une carte de profondeur
   (fauteuils et table au premier plan, mur et logo au fond). Le point de vue
   suit la souris, l'inclinaison du téléphone, ou oscille doucement tout seul.
   ========================================================================== */
function initStudio3D() {
  const fig = document.querySelector(".hero-studio");
  const canvas = fig && fig.querySelector("canvas");
  const img = fig && fig.querySelector("img");
  if (!canvas || !img) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return;

  const vs = `
    attribute vec2 p;
    varying vec2 uv;
    void main() { uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `
    precision mediump float;
    uniform sampler2D tex, depth;
    uniform vec2 offset;   // direction du regard (-1..1)
    uniform float zoom;
    varying vec2 uv;
    void main() {
      vec2 c = (uv - 0.5) / zoom + 0.5;
      float d = texture2D(depth, c).r;
      // le plan focal est entre le mur et les fauteuils : le fond part
      // dans un sens, le premier plan dans l'autre -> relief
      vec2 st = c + offset * (d - 0.45) * vec2(0.038, 0.026);
      // deuxième passe : affine l'échantillonnage sur la profondeur déplacée
      d = texture2D(depth, st).r;
      st = c + offset * (d - 0.45) * vec2(0.038, 0.026);
      vec4 col = texture2D(tex, st);
      // reflet lumineux qui glisse sur les objets du premier plan
      float sheen = smoothstep(0.55, 0.85, d) * 0.07 * (0.5 + 0.5 * offset.x * (st.x - 0.5) * 2.0);
      gl_FragColor = vec4(col.rgb + sheen, col.a);
    }`;
  const sh = (type, src) => {
    const o = gl.createShader(type);
    gl.shaderSource(o, src); gl.compileShader(o);
    return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
  };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uOffset = gl.getUniformLocation(prog, "offset");
  const uZoom = gl.getUniformLocation(prog, "zoom");
  gl.uniform1i(gl.getUniformLocation(prog, "tex"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "depth"), 1);
  gl.uniform1f(uZoom, 1.04);

  const loadImage = (src) => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
  const upload = (unit, image) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  };

  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let lastInput = -1e9, visible = true, raf = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = img.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const frame = (t) => {
    raf = 0;
    if (!visible) return;
    // sans interaction depuis 2,5 s : léger mouvement de caméra automatique
    if (t - lastInput > 2500) {
      target.x = Math.sin(t / 2600) * 0.7;
      target.y = Math.sin(t / 3700) * 0.35;
    }
    cur.x += (target.x - cur.x) * 0.06;
    cur.y += (target.y - cur.y) * 0.06;
    gl.uniform2f(uOffset, cur.x, cur.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const hero = fig.closest(".hero") || document;
  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
    lastInput = performance.now();
  }, { passive: true });
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    target.x = Math.max(-1, Math.min(1, e.gamma / 25));
    target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    lastInput = performance.now();
  }, { passive: true });

  Promise.all([
    img.complete && img.naturalWidth ? Promise.resolve(img) : loadImage(img.currentSrc || img.src),
    loadImage("assets/img/studio-the-boss-depth.webp"),
  ]).then(([photo, depthMap]) => {
    upload(0, photo);
    upload(1, depthMap);
    resize();
    window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); })
        .observe(fig);
    }
    fig.classList.add("is-3d");
    start();
  }).catch(() => { /* on garde simplement la photo */ });
}
