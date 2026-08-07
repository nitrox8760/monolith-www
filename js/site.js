document.getElementById('y').textContent = String(new Date().getFullYear());

const reveals = document.querySelectorAll('.reveal');
if (reveals.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

const topbar = document.querySelector('.topbar');
const navToggle = document.getElementById('nav-toggle');
const topNav = document.getElementById('top-nav');
if (topbar && navToggle && topNav) {
  const closeNav = () => {
    topbar.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle.addEventListener('click', () => {
    const open = topbar.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  topNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });
}
