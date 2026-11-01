(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. Particle network canvas background
     ========================================================= */
  function initParticleField() {
    const canvas = document.getElementById('particle-field');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, particles;
    const COLORS = ['rgba(0, 242, 254,', 'rgba(16, 185, 129,'];
    const LINK_DIST = 140;
    const PARTICLE_COUNT_BASE = 70;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function makeParticles() {
      const count = Math.min(PARTICLE_COUNT_BASE, Math.floor((width * height) / 18000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.6,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + '0.55)';
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.16;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) requestAnimationFrame(step);
    }

    resize();
    makeParticles();
    step();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        makeParticles();
        if (prefersReducedMotion) step();
      }, 150);
    });
  }

  /* =========================================================
     2. Scroll-triggered entrance animations
     ========================================================= */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal-up');
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((t) => observer.observe(t));
  }

  /* =========================================================
     3. 3D tilt on skill / project cards
     ========================================================= */
  function initCardTilt() {
    if (prefersReducedMotion) return;
    const cards = document.querySelectorAll('.skill-card, .project-card');

    cards.forEach((card) => {
      let frame = null;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateX = (0.5 - py) * 8;
        const rotateY = (px - 0.5) * 8;

        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (frame) cancelAnimationFrame(frame);
        card.style.transform = '';
      });
    });
  }

  /* =========================================================
     4. Mini terminal — looping command typing simulation
     ========================================================= */
  function initTerminalTyping() {
    const el = document.getElementById('terminalText');
    if (!el) return;

    const commands = [
      'docker build -t njc/service:latest .',
      'docker compose up -d --build',
      'systemctl status containerd',
      'docker ps --format "table {{.Names}}\\t{{.Status}}"'
    ];

    if (prefersReducedMotion) {
      el.textContent = commands[0];
      return;
    }

    let cmdIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = commands[cmdIndex];

      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = false;
          setTimeout(() => { deleting = true; tick(); }, 1400);
          return;
        }
        setTimeout(tick, 35 + Math.random() * 35);
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          cmdIndex = (cmdIndex + 1) % commands.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 16);
      }
    }

    tick();
  }

  /* =========================================================
     5. Smart device-aware phone handler
     ========================================================= */
  function isMobileDevice() {
    const uaMatch = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return uaMatch || coarsePointer;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback for older / non-secure-context environments.
    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-1000px';
      textarea.style.left = '-1000px';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      try {
        const succeeded = document.execCommand('copy');
        document.body.removeChild(textarea);
        succeeded ? resolve() : reject(new Error('execCommand copy failed'));
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    // Force a reflow so the enter transition reliably fires.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-visible'));
    });

    setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Safety net in case transitionend doesn't fire.
      setTimeout(() => toast.remove(), 600);
    }, 3000);
  }

  function initPhoneHandler() {
    const callBtn = document.getElementById('callBtn');
    if (!callBtn) return;

    callBtn.addEventListener('click', (e) => {
      if (isMobileDevice()) {
        // Let the native tel: link open the dialer as normal.
        return;
      }

      e.preventDefault();

      const phone = callBtn.dataset.phone || '+2349133982877';
      const display = callBtn.dataset.phoneDisplay || phone;

      copyToClipboard(phone)
        .then(() => showToast(`Phone number copied to clipboard: ${display}`))
        .catch(() => showToast(`Couldn't copy automatically — call me at ${display}`));
    });
  }

  /* =========================================================
     6. Status bar clock
     ========================================================= */
  function initStatusClock() {
    const el = document.getElementById('statusClock');
    if (!el) return;

    function update() {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      el.textContent = `${hh}:${mm}:${ss} UTC`;
    }

    update();
    setInterval(update, 1000);
  }

  /* =========================================================
     7. Footer year
     ========================================================= */
  function initFooterYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getUTCFullYear();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initParticleField();
    initScrollReveal();
    initCardTilt();
    initTerminalTyping();
    initPhoneHandler();
    initStatusClock();
    initFooterYear();
  });
})();
