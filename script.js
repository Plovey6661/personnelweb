const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- scroll reveal, staggered per section ---------- */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll("section, .hero").forEach((section) => {
  section.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
    revealObserver.observe(element);
  });
});

/* ---------- navigation ---------- */

const navToggle = document.querySelector(".nav-toggle");

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

const navLinks = [...document.querySelectorAll(".topbar nav a")];

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section);
});

/* ---------- scroll progress + chrome state ---------- */

const progressBar = document.querySelector(".progress i");

const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progressBar.style.width = `${ratio * 100}%`;
  document.body.classList.toggle("scrolled", window.scrollY > 260);
};

let scrollTicking = false;

window.addEventListener(
  "scroll",
  () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      onScroll();
      scrollTicking = false;
    });
  },
  { passive: true }
);

onScroll();

document.querySelector(".to-top").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});

/* ---------- pointer spotlight + magnetic buttons + card tilt ---------- */

if (window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
  const spotlight = document.querySelector(".spotlight");
  const cursor = document.querySelector(".cursor");

  document.body.classList.add("has-pointer", "cursor-on");

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
    spotlight.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
  });

  window.addEventListener("pointerdown", () => document.body.classList.add("cursor-down"));
  window.addEventListener("pointerup", () => document.body.classList.remove("cursor-down"));
  document.addEventListener("pointerleave", () => document.body.classList.remove("cursor-on"));
  document.addEventListener("pointerenter", () => document.body.classList.add("cursor-on"));

  const hoverTargets = "a, button, .filter, .work-item, .work-scene, .panel, .pub, .hero-stats a, .film-frame, .hero-copy";

  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest?.(hoverTargets);
    document.body.classList.toggle("cursor-hover", Boolean(target));
  });

  document.querySelectorAll(".magnet").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const box = element.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.18;
      const y = (event.clientY - box.top - box.height / 2) * 0.28;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });

  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

/* ---------- counters ---------- */

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const element = entry.target;
      const target = Number(element.dataset.count);
      const decimals = element.dataset.count.includes(".") ? 1 : 0;
      countObserver.unobserve(element);

      if (reducedMotion) {
        element.textContent = target.toFixed(decimals);
        return;
      }

      const duration = 1100;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = (target * eased).toFixed(decimals);
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll("[data-count]").forEach((element) => {
  countObserver.observe(element);
});

/* ---------- publication filters ---------- */

const filters = [...document.querySelectorAll(".filter")];
const publications = [...document.querySelectorAll(".pub")];
const emptyNote = document.querySelector(".pub-empty");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((other) => other.classList.toggle("is-on", other === button));

    const filter = button.dataset.filter;
    let shown = 0;

    publications.forEach((item) => {
      const match = filter === "all" || item.dataset.tags.split(" ").includes(filter);
      item.hidden = !match;
      if (match) shown += 1;
    });

    emptyNote.hidden = shown > 0;
  });
});

/* ---------- hero terminal typing ---------- */

const typed = document.getElementById("typed");

const lines = [
  "predicting surface roughness with vision transformers",
  "building VR training systems in Unity",
  "calibrating five-axis machines",
  "writing up the next paper",
];

let terminalStarted = false;

const startHeroTerminal = () => {
  if (terminalStarted || !typed) return;
  terminalStarted = true;

  if (reducedMotion) {
    typed.textContent = lines[0];
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const line = lines[lineIndex];
    charIndex += deleting ? -1 : 1;
    typed.textContent = line.slice(0, charIndex);

    let delay = deleting ? 26 : 52;

    if (!deleting && charIndex === line.length) {
      deleting = true;
      delay = 2200;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      lineIndex = (lineIndex + 1) % lines.length;
      delay = 420;
    }

    setTimeout(tick, delay);
  };

  setTimeout(tick, 280);
};

/* ---------- hero profile reveal ---------- */

const hero = document.querySelector(".hero");
const heroCopy = document.querySelector(".hero-copy");

if (hero && heroCopy) {
  const toggleProfile = () => {
    const open = !hero.classList.contains("is-profile");
    hero.classList.toggle("is-profile", open);
    heroCopy.setAttribute("aria-expanded", String(open));
  };

  heroCopy.addEventListener("click", toggleProfile);
}

startHeroTerminal();

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- photo share: silver-grain film roll ---------- */

const heroImg = document.getElementById("photo-hero-img");
const photoCap = document.getElementById("photo-cap");
const photoIndex = document.getElementById("photo-index");
const filmTrack = document.getElementById("film-track");

if (heroImg && filmTrack) {
  const pad = (n) => String(n + 1).padStart(2, "0");

  const roll = [
    {
      src: "photos/carousel-plateau.jpg",
      alt: "A white carousel standing alone on an empty plateau under a deep blue sky",
      cap: "Carousel left running on an empty plateau",
    },
    {
      src: "photos/fantastic-boat.jpg",
      alt: "A yellow speedboat anchored over turquoise water beside a rocky island",
      cap: "Speedboat parked over glass-clear water",
    },
    {
      src: "photos/tide-sign.jpg",
      alt: "A handwritten sign board on a cliff facing the open sea at golden hour",
      cap: "A sign facing nothing but the tide",
    },
    {
      src: "photos/lake-ice.jpg",
      alt: "A band of sunlit ice on a dark lake below a shadowed mountain",
      cap: "Ice holding the last of the light",
    },
    {
      src: "photos/sea-swing.jpg",
      alt: "A rope swing hanging from a tree on a wooden deck above rocks and clear sea",
      cap: "Swing tied above the rocks",
    },
    {
      src: "photos/sunset-boat.jpg",
      alt: "A speedboat moored offshore silhouetted against an orange sunset",
      cap: "The boat waits out the sunset",
    },
    {
      src: "photos/cliff-house.jpg",
      alt: "A small white house with a red tiled roof on a cliff above the sea",
      cap: "A white house at the end of the cliff",
    },
    {
      src: "photos/pink-buoy.jpg",
      alt: "A pink buoy tied to a rope floating on bright blue water",
      cap: "Buoy marking where the shallows end",
    },
    {
      src: "photos/bare-tree.jpg",
      alt: "Bare winter branches spreading across a clear blue sky",
      cap: "Bare branches against a hard blue",
    },
    {
      src: "photos/my-fortune-boat.jpg",
      alt: "A boat named My Fortune pulled up on a white sand beach under tall clouds",
      cap: "My Fortune, pulled up on the sand",
    },
    {
      src: "photos/starfish.jpg",
      alt: "Two hands holding an orange starfish above shallow green water",
      cap: "Starfish, borrowed for a moment",
    },
    {
      src: "photos/beach-umbrellas.jpg",
      alt: "Three white beach umbrellas and striped bean bags on empty sand",
      cap: "Umbrellas open for no one",
    },
    {
      src: "photos/larch-peak.jpg",
      alt: "Bare larch trees in front of a sunlit snow covered peak",
      cap: "Larches standing in front of the snow line",
    },
    {
      src: "photos/float-ring.jpg",
      alt: "A transparent float ring drifting on clear water above coral",
      cap: "A float drifting over coral",
    },
    {
      src: "photos/snow-cabin.jpg",
      alt: "A cabin in a snow covered valley at dusk with peaks behind it",
      cap: "Dusk coming down on the valley",
    },
  ];

  let focus = 0;
  const frames = [];
  const copies = 2;

  const show = (index, scrollFrame = false) => {
    focus = (index + roll.length) % roll.length;
    const frame = roll[focus];
    heroImg.src = frame.src;
    heroImg.alt = frame.alt;
    photoCap.textContent = frame.cap;
    photoIndex.textContent = `${pad(focus)} / ${pad(roll.length - 1)}`;
    frames.forEach((el, i) => el.classList.toggle("is-on", i % roll.length === focus));
    if (scrollFrame) {
      const cell = frames[focus];
      const left = cell.offsetLeft - (filmTrack.clientWidth - cell.offsetWidth) / 2;
      filmTrack.scrollTo({
        left,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  };

  const addFrame = (frame, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "film-frame";
    cell.innerHTML = `<img src="${frame.src}" alt="${frame.alt}">`;
    cell.addEventListener("click", () => {
      if (filmTrack.dataset.dragged === "1") return;
      pause(2400);
      show(index);
    });
    filmTrack.appendChild(cell);
    frames.push(cell);
  };

  for (let copy = 0; copy < copies; copy += 1) {
    roll.forEach(addFrame);
  }

  let drag = null;
  let paused = false;
  let resumeAt = 0;

  const pause = (ms = 1600) => {
    paused = true;
    resumeAt = performance.now() + ms;
  };

  const loopWidth = () => filmTrack.scrollWidth / copies;

  const wrapScroll = () => {
    const half = loopWidth();
    if (half <= 0) return;
    if (filmTrack.scrollLeft >= half) filmTrack.scrollLeft -= half;
    if (filmTrack.scrollLeft < 0) filmTrack.scrollLeft += half;
  };

  filmTrack.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") event.preventDefault();
    pause(Number.POSITIVE_INFINITY);
    drag = { x: event.clientX, scroll: filmTrack.scrollLeft, moved: false };
    filmTrack.dataset.dragged = "0";
    filmTrack.classList.add("is-drag");
    filmTrack.setPointerCapture(event.pointerId);
  });

  filmTrack.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    filmTrack.scrollLeft = drag.scroll - dx;
    wrapScroll();
  });

  const endDrag = () => {
    if (drag?.moved) filmTrack.dataset.dragged = "1";
    drag = null;
    filmTrack.classList.remove("is-drag");
    pause(1800);
  };

  filmTrack.addEventListener("pointerup", endDrag);
  filmTrack.addEventListener("pointercancel", endDrag);

  filmTrack.addEventListener("pointerenter", () => pause(Number.POSITIVE_INFINITY));
  filmTrack.addEventListener("pointerleave", () => pause(600));

  filmTrack.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < 1 && Math.abs(event.deltaX) < 1) return;
      event.preventDefault();
      pause(1200);
      filmTrack.scrollLeft += event.deltaY + event.deltaX;
      wrapScroll();
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    const photos = document.getElementById("photos");
    if (!photos) return;
    const box = photos.getBoundingClientRect();
    const onPhotos = box.top < window.innerHeight && box.bottom > 80;
    if (!onPhotos) return;
    if (event.key === "ArrowRight") {
      pause(1800);
      show(focus + 1);
    }
    if (event.key === "ArrowLeft") {
      pause(1800);
      show(focus - 1);
    }
  });

  if (!reducedMotion) {
    const tick = (now) => {
      if (paused && now >= resumeAt && !drag) paused = false;
      if (!paused && !drag) {
        filmTrack.scrollLeft += 0.55;
        wrapScroll();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  show(0, false);
}
