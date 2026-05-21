(() => {
  // IIFE (Immediately Invoked Function Expression):
  // Runs this shared script immediately while keeping helper functions and
  // variables private, so they do not pollute the global window object.
  function ready(fn) {
    // If the document is still loading, wait until all HTML has been parsed.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);

    // If DOM is already ready, run the function immediately.
    else fn();
  }

  ready(() => {
    // Shared fixed navbar. Some pages may not have it, so all code checks first.
    const navbar = document.getElementById('navbar');
    if (navbar) {
      // onScroll toggles a CSS class once the user scrolls beyond 40px.
      // The class changes background/shadow so the nav is more readable.
      const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);

      // passive:true tells the browser this listener will not call preventDefault(),
      // allowing smoother scrolling performance.
      window.addEventListener('scroll', onScroll, { passive: true });

      // Run once at page load so refreshed scrolled pages get the right state.
      onScroll();
    }

    // Hamburger and mobileMenu control the responsive navigation drawer.
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        // toggle('open') adds the class if missing and removes it if present.
        // It returns true when the menu is now open.
        const open = mobileMenu.classList.toggle('open');

        // aria-expanded keeps screen readers informed about the menu state.
        hamburger.setAttribute('aria-expanded', String(open));
      });

      // forEach loop:
      // Runs once for every link inside the mobile menu so clicking any link
      // closes the drawer.
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Theme toggle button and icon. Some pages may not include these elements.
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        // documentElement is the <html> element. The theme is stored there
        // so CSS can use selectors like [data-theme="light"].
        const html = document.documentElement;

        // Supports both data-theme="dark" and class="dark" because different
        // pages in the project use slightly different theme patterns.
        const isDark = html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark');
        if (isDark) {
          // Switch from dark to light.
          html.setAttribute('data-theme', 'light');
          html.classList.remove('dark');
          html.classList.add('light');
        } else {
          // Switch from light to dark.
          html.setAttribute('data-theme', 'dark');
          html.classList.add('dark');
          html.classList.remove('light');
        }

        // Update the Material Symbols icon to match the next available mode.
        if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
      });
    }
  });
})();
