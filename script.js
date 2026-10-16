(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const hasLenis = typeof Lenis !== "undefined";

  const loader = document.querySelector(".loader");
  const countEl = document.querySelector(".loader__count");
  const progressBar = document.querySelector(".progress i");
  const cursor = document.querySelector(".cursor");
  const nav = document.querySelector(".nav");
  let lenis = null;

  function ready() {
    document.documentElement.classList.add("is-ready");
  }

  function playHero() {
    if (!hasGsap) return;
    gsap.fromTo(
      ".hero__title .word",
      { yPercent: 120 },
      { yPercent: 0, duration: 1.3, ease: "power4.out", stagger: 0.09, overwrite: true }
    );
    gsap.fromTo(
      ".hero__sub, .hero__scroll, .hero__meta",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "power3.out", overwrite: true }
    );
    gsap.fromTo(
      ".hero__film img",
      { scale: 1.18 },
      { scale: 1, duration: 2.2, ease: "power2.out", overwrite: true }
    );
    gsap.fromTo(
      ".hero__reveal",
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 0.3, overwrite: true }
    );
  }

  function runLoader() {
    if (!loader) {
      ready();
      playHero();
      return;
    }

    if (reduce || !hasGsap) {
      loader.style.display = "none";
      ready();
      return;
    }

    const obj = { n: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        ready();
        playHero();
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      },
    });

    tl.to(obj, {
      n: 100,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate() {
        const v = Math.round(obj.n).toString().padStart(2, "0");
        if (countEl) countEl.textContent = v;
      },
    })
      .to(".loader__name span", { y: -20, opacity: 0, duration: 0.5, ease: "power3.in" }, "-=0.2")
      .to(".loader__eyebrow, .loader__count", { opacity: 0, duration: 0.35 }, "-=0.4")
      .to(".loader__bar--top", { yPercent: -110, duration: 1.05, ease: "power4.inOut" }, "-=0.1")
      .to(".loader__bar--bottom", { yPercent: 110, duration: 1.05, ease: "power4.inOut" }, "<")
      .to(loader, { opacity: 0, duration: 0.4, pointerEvents: "none" }, "-=0.3");
  }

  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="word">${w}</span>`)
      .join(" ");
    return el.querySelectorAll(".word");
  }

  function splitLines(el) {
    const html = el.innerHTML;
    el.innerHTML = `<span class="line">${html}</span>`;
    return el.querySelector(".line");
  }

  function initCursor() {
    if (!cursor || reduce || window.matchMedia("(hover: none)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;

    window.addEventListener("mousemove", (e) => {
      x = e.clientX;
      y = e.clientY;
      cursor.style.opacity = "1";
    });

    function loop() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    }
    loop();

    document.querySelectorAll("a, button, .magnetic").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });

    document.querySelectorAll("[data-cursor='ver']").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-view"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
    });
  }

  function initMagnetic() {
    if (reduce || window.matchMedia("(hover: none)").matches) return;

    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.3}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  function initTimecode() {
    const el = document.querySelector(".timecode");
    if (!el) return;
    const start = performance.now();
    function tick() {
      const t = Math.floor((performance.now() - start) / 10);
      const frames = (t % 100).toString().padStart(2, "0");
      const sec = Math.floor(t / 100) % 60;
      const min = Math.floor(t / 6000) % 60;
      const hrs = Math.floor(t / 360000);
      el.textContent = `${hrs.toString().padStart(2, "0")}:${min
        .toString()
        .padStart(2, "0")}:${sec.toString().padStart(2, "0")}:${frames}`;
      requestAnimationFrame(tick);
    }
    tick();
  }

  function initSmooth() {
    if (!hasLenis || reduce) return null;
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.92,
    });

    if (hasGsap && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
    return lenis;
  }

  function initScroll(lenis) {
    if (!hasGsap || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    if (progressBar) {
      gsap.to(progressBar, {
        width: "100%",
        ease: "none",
        scrollTrigger: { scrub: 0.3 },
      });
    }

    let last = 0;
    ScrollTrigger.create({
      onUpdate(self) {
        const y = self.scroll();
        if (!nav) return;
        if (y > last && y > 80) nav.classList.add("is-hidden");
        else nav.classList.remove("is-hidden");
        last = y;
      },
    });

    gsap.to(".hero__film", {
      y: 80,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".hero__letterbox", {
      height: "0vh",
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "40% top",
        scrub: true,
      },
    });

    document.querySelectorAll(".split-words").forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.035,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 78%" },
      });
    });

    document.querySelectorAll(".reveal-lines").forEach((el) => {
      const line = splitLines(el);
      gsap.set(el, { overflow: "hidden", opacity: 1 });
      gsap.fromTo(
        line,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
        }
      );
    });

    document.querySelectorAll(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );
    });

    gsap.from(".about__frame img", {
      scale: 1.18,
      duration: 1.6,
      ease: "power3.out",
      scrollTrigger: { trigger: ".about", start: "top 70%" },
    });

    const care = document.querySelector(".care");
    const track = document.querySelector(".care__track");
    if (care && track && window.innerWidth > 980) {
      const getScroll = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          trigger: care,
          pin: true,
          scrub: 1,
          end: () => "+=" + getScroll(),
          invalidateOnRefresh: true,
        },
      });
    }

    gsap.to(".process__line i", {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: ".process__body",
        start: "top 70%",
        end: "bottom 40%",
        scrub: true,
      },
    });

    gsap.from(".process__item", {
      opacity: 0,
      x: 24,
      stagger: 0.12,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: ".process__list", start: "top 75%" },
    });

    document.querySelectorAll(".reel__col").forEach((col) => {
      const speed = parseFloat(col.dataset.speed || "0");
      gsap.to(col, {
        y: () => speed * 280,
        ease: "none",
        scrollTrigger: {
          trigger: ".reel",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    gsap.to(".media__bg img", {
      yPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: ".media",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.from(".cta__title", {
      y: 50,
      opacity: 0,
      duration: 1.1,
      ease: "power4.out",
      scrollTrigger: { trigger: ".cta", start: "top 70%" },
    });

    gsap.from(".footer__big", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".footer", start: "top 90%" },
    });

    if (lenis) {
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (!id || id === "#") return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.2 });
        });
      });
    }
  }

  if (hasGsap) {
    gsap.set(".hero__title .word", { yPercent: 120 });
    gsap.set(".hero__reveal, .hero__sub, .hero__scroll, .hero__meta", { opacity: 0 });
  }

  initCursor();
  initMagnetic();
  initTimecode();
  runLoader();

  window.addEventListener("load", () => {
    lenis = initSmooth();
    if (!reduce) initScroll(lenis);
  });
})();
