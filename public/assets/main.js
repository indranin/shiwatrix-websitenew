gsap.registerPlugin(ScrollTrigger);

/* ---------- Cursor glow ---------- */
const glow = document.getElementById('cursorGlow');
if (glow) {
  window.addEventListener('mousemove', (e) => {
    gsap.to(glow, { x: e.clientX, y: e.clientY, duration: 0.6, ease: 'power3.out' });
  });
}

/* ---------- Navbar shrink + blur on scroll ---------- */
const navbar = document.getElementById('navbar');
if (navbar) {
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    onUpdate: () => {
      if (window.scrollY > 80) {
        navbar.classList.add('bg-ink/80', 'backdrop-blur-lg', 'border-b', 'border-white/10', 'h-16');
      } else {
        navbar.classList.remove('bg-ink/80', 'backdrop-blur-lg', 'border-b', 'border-white/10', 'h-16');
      }
    }
  });
}

/* ---------- Global background: soft undulating light ribbons + slow glow dots ---------- */
(function initSceneBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rgb = ['79,110,247', '34,211,238', '52,211,153'];

  let width, height, ribbons, dots;

  function buildRibbons() {
    ribbons = rgb.map((color, i) => ({
      color,
      baseY: height * (0.3 + i * 0.24),
      amplitude: 50 + i * 16,
      wavelength: Math.max(width, 900) * (0.85 + i * 0.2),
      speed: 0.00016 + i * 0.00005,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function buildDots() {
    const count = Math.min(24, Math.floor((width * height) / 55000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 1.2,
      vy: -(Math.random() * 0.045 + 0.015),
      vx: (Math.random() - 0.5) * 0.03,
      baseAlpha: Math.random() * 0.22 + 0.06,
      color: rgb[Math.floor(Math.random() * 3)],
      twinklePhase: Math.random() * Math.PI * 2,
    }));
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    buildRibbons();
  }

  resize();
  buildDots();
  window.addEventListener('resize', () => { resize(); buildDots(); });

  function tick(now) {
    ctx.clearRect(0, 0, width, height);

    /* soft undulating gradient ribbons, like calm signal waves */
    ribbons.forEach((w) => {
      const step = 24;
      ctx.beginPath();
      for (let x = -step; x <= width + step; x += step) {
        const y = w.baseY + Math.sin((x / w.wavelength) * Math.PI * 2 + now * w.speed + w.phase) * w.amplitude;
        if (x === -step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, `rgba(${w.color},0)`);
      grad.addColorStop(0.5, `rgba(${w.color},0.14)`);
      grad.addColorStop(1, `rgba(${w.color},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = `rgba(${w.color},0.3)`;
      ctx.shadowBlur = 26;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    /* slow, softly twinkling glow dots drifting upward */
    dots.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y < -10) d.y = height + 10;
      if (d.x < -10) d.x = width + 10; else if (d.x > width + 10) d.x = -10;
      const twinkle = Math.sin(now / 1600 + d.twinklePhase) * 0.25 + 0.75;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${d.color},${d.baseAlpha * twinkle})`;
      ctx.shadowColor = `rgba(${d.color},0.5)`;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ---------- Hero entrance timeline (runs if hero elements exist) ---------- */
if (document.querySelector('.hero-line')) {
  gsap.set('.hero-tag', { y: 20 });
  gsap.set('.hero-sub', { y: 20 });
  gsap.set('.hero-cta', { y: 20 });

  const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  heroTl
    .to('.hero-tag', { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .from('.hero-line .inline-block', { yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.15 }, 0.2)
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.9 }, '-=0.6')
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7');

  gsap.to('#scrollHint', {
    opacity: 0,
    scrollTrigger: { trigger: '#top', start: 'top top', end: '200 top', scrub: true }
  });
}

/* ---------- Marquee infinite scroll ---------- */
document.querySelectorAll('.marquee-track').forEach((marquee) => {
  marquee.innerHTML += marquee.innerHTML;
  gsap.to(marquee, { xPercent: -50, duration: 22, repeat: -1, ease: 'none' });
});

/* ---------- Stat counters ---------- */
document.querySelectorAll('.stat-item').forEach((item) => {
  const numEl = item.querySelector('.num');
  if (!numEl) return;
  const target = +numEl.dataset.target;
  ScrollTrigger.create({
    trigger: item,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.fromTo(item, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.to(numEl, {
        innerText: target,
        duration: 1.8,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate: function () { numEl.innerText = Math.floor(numEl.innerText); }
      });
    }
  });
});

/* ---------- Generic single-element fade-up reveal ---------- */
document.querySelectorAll('.reveal-up').forEach((el) => {
  gsap.fromTo(el,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    }
  );
});

/* ---------- Staggered group reveal (cards, grids, lists) ---------- */
document.querySelectorAll('.stagger-parent').forEach((parent) => {
  const items = parent.querySelectorAll('.stagger-item');
  if (!items.length) return;
  gsap.from(items, {
    opacity: 0,
    y: 50,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: parent, start: 'top 78%' }
  });
});

/* ---------- Timeline / process steps ---------- */
document.querySelectorAll('.steps-group').forEach((group) => {
  const steps = group.querySelectorAll('.step-item');
  if (!steps.length) return;
  gsap.from(steps, {
    opacity: 0,
    x: -30,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: { trigger: group, start: 'top 80%' }
  });
});

/* ---------- Reveal-mask cards: curtain wipe + scale-in + tilt ---------- */
document.querySelectorAll('.reveal-mask').forEach((card) => {
  const curtain = card.querySelector('.curtain');
  const isAboveFold = card.classList.contains('hero-banner');

  if (isAboveFold) {
    /* Hero banners are visible immediately on load, not scrolled into view,
       so the curtain wipe plays right away instead of waiting on a scroll trigger
       that may never fire (which would otherwise leave the curtain stuck in place). */
    gsap.set(card, { scale: 1, opacity: 1 });
    if (curtain) {
      gsap.to(curtain, { xPercent: 100, duration: 1, ease: 'power4.inOut', delay: 0.2 });
    }
  } else {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' }
    });
    tl.fromTo(card, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' });
    if (curtain) {
      tl.to(curtain, { xPercent: 100, duration: 0.7, ease: 'power4.inOut' }, '-=0.4');
    }
  }

  if (card.classList.contains('tilt')) {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateX: py * -8, rotateY: px * 8, transformPerspective: 600, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
    });
  }
});

/* ---------- Rotating conic visual (About page) ---------- */
if (document.getElementById('conicSpin')) {
  gsap.to('#conicSpin', { rotate: 360, duration: 20, repeat: -1, ease: 'none' });
}

/* ---------- Slow continuous "Ken Burns" zoom for banner photography ---------- */
document.querySelectorAll('.img-zoom').forEach((img, i) => {
  gsap.fromTo(img,
    { scale: 1.1 },
    { scale: 1, duration: 6 + (i % 3), ease: 'power1.out',
      scrollTrigger: { trigger: img, start: 'top 90%', toggleActions: 'play none none none' }
    }
  );
});

/* ---------- Illustration: draw-on-scroll strokes (DNA helix, molecule diagrams) ---------- */
document.querySelectorAll('.draw-svg').forEach((svg) => {
  const shapes = svg.querySelectorAll('path, line, polyline');
  shapes.forEach((shape, i) => {
    if (typeof shape.getTotalLength !== 'function') return;
    const length = shape.getTotalLength();
    shape.style.strokeDasharray = length;
    shape.style.strokeDashoffset = length;
    gsap.to(shape, {
      strokeDashoffset: 0,
      duration: 1.4,
      delay: i * 0.06,
      ease: 'power2.out',
      scrollTrigger: { trigger: svg, start: 'top 85%', toggleActions: 'play none none reverse' }
    });
  });
});

/* ---------- Illustration: gently pulsing nodes (molecule/DNA dots) ---------- */
document.querySelectorAll('.pulse-node').forEach((node, i) => {
  gsap.to(node, {
    scale: 1.5,
    transformOrigin: 'center',
    opacity: 0.5,
    duration: 1.4 + (i % 3) * 0.3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: i * 0.15
  });
});

/* ---------- Illustration: slow continuous rotation (helix / orbit graphics) ---------- */
document.querySelectorAll('.spin-slow').forEach((el) => {
  gsap.to(el, { rotate: 360, transformOrigin: 'center', duration: 24, repeat: -1, ease: 'none' });
});

/* ---------- Illustration: gentle float (whole illustration drifting) ---------- */
document.querySelectorAll('.float-illustration').forEach((el, i) => {
  gsap.to(el, {
    y: 14,
    duration: 3 + (i % 2),
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
});

/* ---------- Services slider (home page) ---------- */
document.querySelectorAll('[data-slider]').forEach((slider) => {
  const track = slider.querySelector('.service-slider-track');
  const slides = slider.querySelectorAll('.service-slide');
  const dotsWrap = slider.querySelector('[data-slider-dots]');
  const prevBtn = slider.querySelector('[data-slider-prev]');
  const nextBtn = slider.querySelector('[data-slider-next]');
  if (!track || !slides.length) return;

  let index = 0;
  let autoplay;

  const dots = Array.from(slides).map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.className = 'w-2.5 h-2.5 rounded-full bg-white/25 transition-colors duration-300';
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function render() {
    gsap.to(track, { xPercent: -100 * index, duration: 0.7, ease: 'power3.inOut' });
    dots.forEach((dot, i) => dot.classList.toggle('bg-white', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('bg-white/25', i !== index));
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    render();
  }

  function startAutoplay() {
    autoplay = setInterval(() => goTo(index + 1), 5500);
  }
  function stopAutoplay() {
    clearInterval(autoplay);
  }

  prevBtn.addEventListener('click', () => { goTo(index - 1); stopAutoplay(); startAutoplay(); });
  nextBtn.addEventListener('click', () => { goTo(index + 1); stopAutoplay(); startAutoplay(); });
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  render();
  startAutoplay();
});

/* ---------- Theme toggle (dark / light) ---------- */
(function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const moonIcon = document.getElementById('themeIconMoon');
  const sunIcon = document.getElementById('themeIconSun');

  function sync() {
    const isLight = root.classList.contains('light');
    moonIcon.classList.toggle('hidden', isLight);
    sunIcon.classList.toggle('hidden', !isLight);
  }
  sync();

  toggle.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    sync();
  });
})();

/* ---------- Mobile menu toggle ---------- */
const menuBtn = document.getElementById('menuBtn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const nav = document.querySelector('header nav');
    nav.classList.toggle('hidden');
    nav.classList.toggle('flex');
    nav.classList.toggle('flex-col');
    nav.classList.toggle('absolute');
    nav.classList.toggle('top-20');
    nav.classList.toggle('inset-x-6');
    nav.classList.toggle('bg-ink/95');
    nav.classList.toggle('backdrop-blur-lg');
    nav.classList.toggle('rounded-2xl');
    nav.classList.toggle('p-6');
    nav.classList.toggle('border');
    nav.classList.toggle('border-white/10');
    nav.classList.toggle('gap-6');
  });
}

/* Refresh ScrollTrigger after all layout/fonts settle */
window.addEventListener('load', () => ScrollTrigger.refresh());
