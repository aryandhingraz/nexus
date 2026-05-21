/* ================================================================
     LOAD DRAFT FROM LOCALSTORAGE

     preview.html is a separate page from builder.html, but both pages
     can share data through localStorage. localStorage is a built-in
     browser storage API: it saves small pieces of text in the visitor's
     browser, so this static project can pass portfolio details between
     pages without a backend, database, login, or server route.

     Flow:
     1. builder.js collects the user's form data.
     2. builder.js saves it as JSON under the key "spb_draft".
     3. preview.js reads that same key and renders the full portfolio.
  ================================================================ */
  const DEFAULT = {
    fullName:    'Alex Sterling',
    jobTitle:    'Senior Full-Stack Developer',
    bio:         'Specializing in high-performance cloud applications and polished aesthetic design systems. I build things that are fast, beautiful, and scale.',
    tagline:     'Crafting Digital Architectures & Fluid User Experiences.',
    location:    'New Delhi, India',
    email:       'hello@alexsterling.dev',
    github:      'github.com/alexsterling',
    linkedin:    'linkedin.com/in/alexsterling',
    website:     'alexsterling.dev',
    twitter:     'twitter.com/alexsterling',
    expRole:     'Senior Frontend Engineer',
    expCompany:  'Quantum Labs',
    expPeriod:   '2022 – Present',
    expDesc:     'Led redesign of core product dashboard serving 50k+ users. Built design system from scratch using React + Tailwind. Reduced load time by 60%.',
    availability:'open',
    theme:       'teal',
    skills:      ['Next.js','React','TypeScript','Node.js','PostgreSQL','AWS','Tailwind CSS','Figma'],
    projects: [
      { name:'Quantum Dashboard', desc:'Enterprise data visualization platform serving 50k users with real-time WebGL charts.', tech:'React,D3.js,AWS', url:'#' },
      { name:'Aura OS', desc:'Open-source design system with 120+ components, used by 2k developers.', tech:'TypeScript,Storybook', url:'#' },
      { name:'FluxAPI', desc:'REST + GraphQL API gateway with automatic caching and rate limiting.', tech:'Node.js,Redis,PostgreSQL', url:'#' },
    ],
    avatar: null,
  };

  // Start with a complete demo portfolio so preview.html still looks polished
  // when somebody opens it directly before creating a builder draft.
  let data = { ...DEFAULT };
  try {
    // localStorage stores only strings, so JSON.parse turns the saved string
    // back into the JavaScript object shape used by this page.
    const raw = localStorage.getItem('spb_draft');
    if (raw) {
      const saved = JSON.parse(raw);
      // saved.data contains text fields such as name, title, bio, links,
      // experience, and contact details. Object.assign keeps the DEFAULT
      // object structure but replaces fields the user actually filled.
      if (saved.data) Object.assign(data, saved.data);
      // Support both draft shapes:
      // - saved.skills / saved.projects from the main builder state
      // - saved.data.skills / saved.data.projects from collected form data
      const savedSkills = saved.skills || saved.data?.skills;
      const savedProjects = saved.projects || saved.data?.projects;
      const savedTheme = saved.theme || saved.data?.theme;
      // Array checks protect the preview from broken or old localStorage data.
      if (Array.isArray(savedSkills)) data.skills = savedSkills;
      if (Array.isArray(savedProjects)) data.projects = savedProjects.filter(p => p.name);
      if (savedTheme) data.theme = savedTheme;
      // The avatar is saved by the builder as a data URL, which is the image
      // encoded as text. That lets the browser show the uploaded image without
      // sending it to any external image hosting API.
      data.avatar = saved.avatar || saved.data?.avatar || null;
    }
  } catch(e) {}

  /* ================================================================
     POPULATE PORTFOLIO SECTIONS

     This function maps JavaScript data onto the HTML placeholders in
     preview.html. It uses the DOM API: document.getElementById() finds
     a specific element, then textContent, innerHTML, src, or href changes
     what appears on the page.
  ================================================================ */
  function populate() {
    // This builds a fake portfolio address for the browser-style top bar.
    // It is visual only; it does not publish the site or call any API.
    const slug = (data.fullName||'portfolio').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    document.getElementById('portfolioUrl').textContent = slug + '.nexus.dev';

    // textContent is used for plain user text because it safely inserts text
    // without treating it as HTML.
    document.getElementById('portName').textContent      = data.fullName    || DEFAULT.fullName;
    document.getElementById('portTitle').textContent     = data.jobTitle    || DEFAULT.jobTitle;
    document.getElementById('portFooterName').textContent= data.fullName    || DEFAULT.fullName;
    const tagline = data.tagline || data.bio || DEFAULT.tagline;
    document.getElementById('portTagline').textContent   = '"' + tagline + '"';
    document.getElementById('portBio').textContent       = data.bio         || DEFAULT.bio;

    // Convert the builder's short availability value into a readable label.
    const availMap = { open:'✅ Available for Opportunities', freelance:'💼 Open to Freelance', busy:'🔴 Not Available', looking:'👀 Actively Looking' };
    document.getElementById('portAvailLabel').textContent = availMap[data.availability] || availMap.open;

    // These chips are optional. They only render when the user filled them.
    if (data.location) document.getElementById('portLocation').innerHTML = `<span class="material-symbols-outlined icon-13">location_on</span>${data.location}`;
    if (data.email) document.getElementById('portEmail').innerHTML = `<span class="material-symbols-outlined icon-13">mail</span>${data.email}`;

    // The HTML contains both an image and a placeholder. When an avatar exists,
    // the image is shown and the placeholder icon is hidden.
    if (data.avatar) {
      const img = document.getElementById('portAvatarImg');
      img.src = data.avatar; img.style.display = 'block';
      document.getElementById('portAvatarPlaceholder').style.display = 'none';
    }

    // Social links are real <a> tags. If the user typed "github.com/name",
    // this code adds "https://" so the browser knows it is an external link.
    const socials = [];
    if (data.github)   socials.push({ label:'GitHub',   icon:'code',     url: data.github.startsWith('http') ? data.github : 'https://' + data.github });
    if (data.linkedin) socials.push({ label:'LinkedIn',  icon:'work',     url: data.linkedin.startsWith('http') ? data.linkedin : 'https://' + data.linkedin });
    if (data.twitter)  socials.push({ label:'Twitter',   icon:'tag',      url: data.twitter.startsWith('http') ? data.twitter : 'https://' + data.twitter });
    if (data.website)  socials.push({ label:'Website',   icon:'language', url: data.website.startsWith('http') ? data.website : 'https://' + data.website });
    if (socials.length) {
      document.getElementById('portSocials').innerHTML = socials.map(s =>
        `<a class="port-social" href="${s.url}" target="_blank">
          <span class="material-symbols-outlined" class="icon-15">${s.icon}</span>${s.label}</a>`
      ).join('');
    }

    // Experience uses template HTML because the section has several nested
    // pieces: role, company, period, description, and skill chips.
    const expHtml = `
      <div class="exp-item">
        <div class="exp-dot"></div>
        <div class="exp-card">
          <div class="exp-role">${data.expRole || DEFAULT.expRole}</div>
          <div class="exp-company-row">
            <span class="exp-company">${data.expCompany || DEFAULT.expCompany}</span>
            <span class="exp-period">${data.expPeriod || DEFAULT.expPeriod}</span>
          </div>
          <div class="exp-desc">${data.expDesc || DEFAULT.expDesc}</div>
          <div class="exp-techs">
            ${(data.skills||DEFAULT.skills).slice(0,5).map(s=>`<span class="exp-tech">${s}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="exp-item">
        <div class="exp-dot"></div>
        <div class="exp-card exp-card-muted">
          <div class="exp-role">Frontend Developer</div>
          <div class="exp-company-row">
            <span class="exp-company">Stellar Agency</span>
            <span class="exp-period">2019 – 2022</span>
          </div>
          <div class="exp-desc">Built responsive marketing sites and SPAs for 20+ enterprise clients. Introduced component-driven development to the team.</div>
          <div class="exp-techs">
            <span class="exp-tech">React</span><span class="exp-tech">SASS</span><span class="exp-tech">GraphQL</span>
          </div>
        </div>
      </div>
    `;
    document.getElementById('expTimeline').innerHTML = expHtml;

    // Project cards use the user's projects when available. DEFAULT projects
    // keep the preview visually complete if the page is opened with no draft.
    const projects = (data.projects && data.projects.length) ? data.projects : DEFAULT.projects;
    const projectImgs = [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=75',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=75',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=75',
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=75',
    ];
    const projIcons = ['terminal','cloud','database','psychology','palette','bolt'];
    let bentoHtml = '';

    projects.forEach((p, i) => {
      const techArr = (p.tech||'').split(',').map(t=>t.trim()).filter(Boolean);
      const cls = i===0 ? 'proj-card-1' : i===1 ? 'proj-card-2' : `proj-card-${i+1}`;
      const showImg = i < 2;
      bentoHtml += `
        <div class="proj-card ${cls} proj-delay-${Math.min(i, 5)}">
          <div class="proj-card-glow"></div>
          ${showImg ? `
          <div class="proj-thumb">
            <img src="${projectImgs[i]||projectImgs[0]}" alt="${p.name}" loading="lazy" />
            <div class="proj-thumb-overlay"></div>
          </div>` : ''}
          <div class="${showImg ? 'proj-body' : 'proj-compact'}">
            ${!showImg ? `<div class="proj-compact-icon"><span class="material-symbols-outlined">${projIcons[i]||'code'}</span></div>` : ''}
            <div>
              <div class="proj-name">${p.name}</div>
              <div class="proj-desc">${p.desc||'A powerful project built with modern technologies.'}</div>
              ${techArr.length ? `<div class="proj-tags">${techArr.map(t=>`<span class="proj-tag">${t}</span>`).join('')}</div>` : ''}
            </div>
            <div class="proj-links">
              ${p.url && p.url !== '#' ? `<a class="proj-link proj-link-primary" href="${p.url}" target="_blank"><span class="material-symbols-outlined" class="icon-12">open_in_new</span>Live</a>` : ''}
              <a class="proj-link proj-link-secondary" href="#"><span class="material-symbols-outlined" class="icon-12">code</span>Code</a>
            </div>
          </div>
        </div>`;
    });
    document.getElementById('projectsBento').innerHTML = bentoHtml;

    // Contact rows are generated from filled fields only. filter(Boolean)
    // removes null entries so blank contact fields do not create empty rows.
    const contactItems = [
      data.email    ? { icon:'mail',     label:'Email',    val: data.email }    : null,
      data.github   ? { icon:'code',     label:'GitHub',   val: data.github }   : null,
      data.linkedin ? { icon:'work',     label:'LinkedIn', val: data.linkedin } : null,
      data.location ? { icon:'location_on', label:'Location', val: data.location }: null,
    ].filter(Boolean);
    document.getElementById('contactInfo').innerHTML = contactItems.map(c =>
      `<div class="contact-item">
        <div class="contact-item-icon"><span class="material-symbols-outlined">${c.icon}</span></div>
        <div><div class="contact-item-label">${c.label}</div><div class="contact-item-val">${c.val}</div></div>
      </div>`
    ).join('') || `<div class="contact-item">
        <div class="contact-item-icon"><span class="material-symbols-outlined">mail</span></div>
        <div><div class="contact-item-label">Email</div><div class="contact-item-val">hello@yourname.dev</div></div>
      </div>`;

    // The meta bar gives a quick summary of the generated portfolio.
    document.getElementById('metaSkills').textContent = (data.skills||DEFAULT.skills).length;
    document.getElementById('metaProjects').textContent = projects.length;
    const themeMap = { teal:'Teal Dark', blue:'Ocean Blue', violet:'Violet', rose:'Rose', amber:'Amber', emerald:'Emerald' };
    document.getElementById('metaTheme').textContent = themeMap[data.theme] || 'Teal Dark';

    // Apply the selected theme last so all sections can use the same accent
    // values through CSS custom properties.
    applyTheme(data.theme);
  }
  populate();

  // applyTheme writes CSS variables on the root <html> element. CSS variables
  // are used so one theme choice can recolor buttons, glows, borders, chips,
  // and highlights without adding many separate theme classes.
  function applyTheme(t) {
    const map = { teal:'#2DD4BF', blue:'#3b82f6', violet:'#8b5cf6', rose:'#f43f5e', amber:'#f59e0b', emerald:'#10b981' };
    const c = map[t] || map.teal;
    document.documentElement.style.setProperty('--teal', c);
    document.documentElement.style.setProperty('--teal-dim', c + '1a');
    document.documentElement.style.setProperty('--teal-mid', c + '30');
    document.documentElement.style.setProperty('--border-glow', c + '55');
  }

  /* ================================================================
     PARTICLES

     This background uses the Canvas 2D API. A canvas is a programmable
     drawing surface: JavaScript clears it, moves tiny dots, and redraws
     them every frame. The effect feels alive but stays lightweight because
     it uses math and simple circles instead of video or large images.
  ================================================================ */
  (function() {
    const c = document.getElementById('particles-canvas');
    const ctx = c.getContext('2d');
    let pts = [];
    // The canvas size must match the viewport, otherwise particles would draw
    // into the wrong coordinate space after a browser resize.
    function resize() { c.width=window.innerWidth; c.height=window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    for (let i=0;i<60;i++) pts.push({
      x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.2+0.3, sx:(Math.random()-.5)*.3, sy:-(Math.random()*.35+.1),
      op:Math.random(), od:Math.random()>.5?.005:-.005
    });
    (function a() {
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p=>{
        p.x+=p.sx; p.y+=p.sy; p.op+=p.od;
        if(p.op>=1){p.op=1;p.od=-.005;} if(p.op<=0){p.op=0;p.od=.005;}
        if(p.y<-10){p.x=Math.random()*c.width;p.y=c.height+10;}
        ctx.save(); ctx.globalAlpha=p.op*.4;
        ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--teal').trim()||'#2DD4BF';
        ctx.shadowBlur=3; ctx.shadowColor=ctx.fillStyle;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });
      // requestAnimationFrame asks the browser for the next smooth visual
      // frame. It is better for animation than setInterval because the browser
      // can optimize it when the tab is hidden or the device is busy.
      requestAnimationFrame(a);
    })();
  })();

  /* ================================================================
     RADIAL SCROLL GALLERY — Vanilla JS + GSAP port of 21st.dev component
     Items arranged on a circle, wheel rotates as you scroll.

     Desktop animation idea:
     - Skills are placed around an invisible circle.
     - The whole circle rotates as the user scrolls.
     - Each card is counter-rotated so the text remains readable.

     Mobile animation idea:
     - The radial wheel is replaced with a normal grid.
     - Small screens do not have enough room for large cards around a circle.
     - The grid still animates through staggered reveal timing, but avoids
       the clustering problem that happens in responsive mode.

     API / library note:
     GSAP and ScrollTrigger are external animation libraries loaded in
     preview.html. They are not built-in browser APIs. ScrollTrigger connects
     the page's scroll position to animation progress.
  ================================================================ */
  (function() {
    // If the GSAP CDN script fails to load, skip this enhancement gracefully
    // so the rest of the portfolio can still render.
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const skills = (data.skills && data.skills.length) ? data.skills : DEFAULT.skills;
    const skillMeta = {
      'Next.js':      { icon:'web',      level:'Expert' },
      'React':        { icon:'hub',      level:'Expert' },
      'TypeScript':   { icon:'code',     level:'Expert' },
      'Node.js':      { icon:'dns',      level:'Advanced' },
      'PostgreSQL':   { icon:'database', level:'Advanced' },
      'AWS':          { icon:'cloud',    level:'Intermediate' },
      'Tailwind CSS': { icon:'palette',  level:'Expert' },
      'Figma':        { icon:'brush',    level:'Advanced' },
      'Python':       { icon:'terminal', level:'Intermediate' },
      'Docker':       { icon:'deployed_code', level:'Intermediate' },
      'GraphQL':      { icon:'share',    level:'Advanced' },
      'MongoDB':      { icon:'storage',  level:'Intermediate' },
    };

    const wheel   = document.getElementById('radialWheel');
    const clip    = document.getElementById('radialClip');
    const pinEl   = document.getElementById('radialPin');
    const section = document.getElementById('skillsSection');
    const tooltip = document.getElementById('skillTooltip');
    const centerLbl = document.getElementById('wheelCenterLabel');

    // This breakpoint decides which animation is appropriate. The circular
    // wheel is dramatic on desktop, but a readable grid is better on phones.
    const isMobile    = window.innerWidth < 768;
    const viewportW   = Math.max(320, window.innerWidth);
    const count       = skills.length;
    const CARD_H      = isMobile ? 104 : 190;
    const CARD_W      = isMobile ? Math.min(128, viewportW * 0.34) : 210;
    const minArc      = CARD_W + (isMobile ? 30 : 70);
    // spacingRadius estimates how large the invisible circle must be for
    // cards to fit around it. Arc length = circumference / number of cards.
    const spacingRadius = (minArc * Math.max(count, 4)) / (2 * Math.PI);
    const visibleRadius = isMobile
      ? Math.min(viewportW * 0.52, Math.max(145, spacingRadius))
      : 485;
    const RADIUS      = Math.round(visibleRadius);
    const DIAMETER    = RADIUS * 2;
    const CARD_OVERHANG = Math.max(CARD_H, CARD_W) / 2;
    const clipH       = DIAMETER + CARD_OVERHANG * 2 + (isMobile ? 88 : 56);

    if (isMobile) {
      // Mobile fix: use normal document flow instead of absolute circular
      // positioning. This prevents skill cards from stacking on top of each
      // other in responsive DevTools and real phone widths.
      section.classList.add('mobile-skills-mode');
      clip.style.height = 'auto';
      wheel.style.opacity = '1';
      wheel.style.width = '';
      wheel.style.height = '';
      wheel.style.top = '';
      wheel.style.bottom = '';
      wheel.style.transform = '';

      skills.forEach((skill, idx) => {
        const meta = skillMeta[skill] || { icon:'star', level:'Skilled' };
        const li = document.createElement('li');
        li.className = 'skill-node mobile-skill-node';
        // --delay is read by CSS. Each card waits a little longer than the
        // previous card, creating a soft cascade when the section appears.
        li.style.setProperty('--delay', `${idx * 55}ms`);
        li.innerHTML = `
          <div class="skill-card mobile-skill-card">
            <div class="skill-icon">
              <span class="material-symbols-outlined skill-icon-symbol">${meta.icon}</span>
            </div>
            <div>
              <div class="skill-name">${skill}</div>
              <div class="skill-level">${meta.level}</div>
            </div>
          </div>`;
        li.addEventListener('click', () => {
          // Phones do not have hover, so tapping a skill highlights it and
          // updates the center label with that skill's level.
          wheel.querySelectorAll('.mobile-skill-node').forEach(n => n.classList.remove('active'));
          li.classList.add('active');
          centerLbl.innerHTML = `<h3>${skill}</h3><p>${meta.level}</p>`;
        });
        wheel.appendChild(li);
      });

      // IntersectionObserver is a browser API that tells us when an element
      // enters the viewport. We use it to start the reveal only when the user
      // actually scrolls to the skills section.
      const mobileObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            wheel.querySelectorAll('.mobile-skill-node').forEach(node => node.classList.add('show'));
            mobileObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      mobileObs.observe(wheel);
      return;
    }

    // Desktop wheel sizing: the UL becomes an invisible circular stage.
    // Skill cards are placed around this stage using x/y coordinates.
    wheel.style.width  = DIAMETER + 'px';
    wheel.style.height = DIAMETER + 'px';
    wheel.style.top = '50%';
    wheel.style.bottom = 'auto';
    wheel.style.transform = 'translate(-50%,-50%)';
    wheel.style.opacity = '0';
    clip.style.height  = clipH + 'px';

    // The center label sits in the middle and changes while hovering cards.
    centerLbl.style.cssText = `
      position:absolute;left:50%;top:50%;
      transform:translate(-50%,-50%);
      width:${isMobile?70:100}px;text-align:center;pointer-events:none;z-index:10;
    `;

    // Create skill items around the circular path.
    skills.forEach((skill, idx) => {
      const meta = skillMeta[skill] || { icon:'star', level:'Skilled' };
      const angle = (idx / count) * 2 * Math.PI;
      // cos() and sin() convert an angle into x/y coordinates. That is the
      // math that turns a simple list of skills into points on a circle.
      const x = RADIUS * Math.cos(angle);
      const y = RADIUS * Math.sin(angle);
      const rotDeg = (angle * 180 / Math.PI) + 90;

      const li = document.createElement('li');
      li.className = 'skill-node';
      li.style.cssText = `
        transform: translate(-50%,-50%) translate3d(${x}px,${y}px,0) rotate(${rotDeg}deg);
        z-index: 10;
        opacity: 0;
        scale: 0.5;
      `;

      li.innerHTML = `
          <div class="skill-card" style="width:${CARD_W}px;min-width:${CARD_W}px;min-height:${CARD_H}px">
          <div class="skill-icon">
            <span class="material-symbols-outlined skill-icon-symbol">${meta.icon}</span>
          </div>
          <div class="skill-name">${skill}</div>
          <div class="skill-level">${meta.level}</div>
        </div>`;
      // The list item rotates to sit on the circle. The card rotates backward
      // by the same amount so the text stays upright instead of spinning.
      li.querySelector('.skill-card').style.transform = `rotate(${-rotDeg}deg)`;

      // Hover gives extra context without navigating away from the preview.
      li.addEventListener('mouseenter', (e) => {
        tooltip.innerHTML = `<strong>${skill}</strong><br><span class="tooltip-accent">${meta.level}</span>`;
        tooltip.style.opacity = '1';
        centerLbl.innerHTML = `<h3>${skill}</h3><p>${meta.level}</p>`;
        // Dimming the other cards guides attention to the skill being explored.
        wheel.querySelectorAll('.skill-node').forEach(n => {
          if (n !== li) { n.querySelector('.skill-card').style.opacity = '0.3'; n.querySelector('.skill-card').style.filter = 'blur(1px) grayscale(1)'; }
        });
      });
      li.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top  = (e.clientY - 8)  + 'px';
      });
      li.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        centerLbl.innerHTML = '<h3>Skills</h3><p>Hover to explore</p>';
        wheel.querySelectorAll('.skill-node').forEach(n => {
          n.querySelector('.skill-card').style.opacity = '1';
          n.querySelector('.skill-card').style.filter  = '';
        });
      });

      wheel.appendChild(li);
    });

    // Entrance animation: cards pop in when the wheel first enters the viewport.
    const items = wheel.querySelectorAll('.skill-node');
    ScrollTrigger.create({
      trigger: pinEl,
      start: 'top 80%',
      onEnter: () => {
        wheel.style.opacity = '1';
        gsap.to(items, {
          opacity: 1, scale: 1,
          duration: 1.0,
          ease: 'back.out(1.3)',
          stagger: 0.06,
        });
      },
      onLeaveBack: () => {
        gsap.to(items, { opacity: 0, scale: 0.5, duration: 0.4 });
        wheel.style.opacity = '0';
      },
    });

    // Scroll-driven rotation: the wheel makes one full turn while this section
    // is pinned. Pinning keeps the animation visible long enough to feel
    // intentional instead of rushing past the user.
    const SCROLL_DIST = 2500;
    gsap.to(wheel, {
      rotation: 360,
      ease: 'none',
      scrollTrigger: {
        trigger: pinEl,
        pin: true,
        start: 'center center',
        end: '+=' + SCROLL_DIST,
        scrub: 1.2,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  })();

  /* ================================================================
     SCROLL REVEAL (sections outside radial)

     These observers add a class when sections enter the viewport.
     CSS handles the actual fade/slide animation. Keeping the trigger in JS
     and the visual style in CSS makes the animation easier to adjust.
  ================================================================ */
  const srObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); srObs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.sr').forEach(el => srObs.observe(el));

  // Experience items reveal with a small delay so the timeline feels like it
  // is being drawn in sequence rather than appearing all at once.
  const expObs = new IntersectionObserver(entries => {
    entries.forEach((e,i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 150);
        expObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  setTimeout(() => document.querySelectorAll('.exp-item').forEach(el => expObs.observe(el)), 400);

  // Project cards use a quicker stagger because cards are more visual and
  // should feel energetic without slowing down the page.
  const projObs = new IntersectionObserver(entries => {
    entries.forEach((e,i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        projObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  setTimeout(() => document.querySelectorAll('.proj-card').forEach(el => projObs.observe(el)), 400);

  /* ================================================================
     GO LIVE + DOWNLOAD
  ================================================================ */
  function goLive(btn = document.getElementById('goLiveBtn')) {
    // This is a front-end only "success" interaction. It changes the button
    // text and color temporarily, then launches confetti. No deployment API
    // is called here; it is a visual confirmation for the demo flow.
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined icon-16">check_circle</span> You\'re Live!';
    btn.style.background = 'linear-gradient(135deg,#34d399,#10b981)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 3000);
    // launch confetti
    launchMiniConfetti();
  }

  document.getElementById('downloadPortfolioBtn')?.addEventListener('click', downloadPortfolio);
  document.getElementById('goLiveBtn')?.addEventListener('click', event => goLive(event.currentTarget));

  function downloadPortfolio() {
    // This creates a downloadable standalone HTML file entirely in the browser.
    // Blob is a Web API for file-like data, URL.createObjectURL() creates a
    // temporary link to that data, and clicking the generated anchor starts
    // the download without needing a server endpoint.
    const name = data.fullName || 'Portfolio';
    const skills = (data.skills||DEFAULT.skills).join(', ');
    const projects = (data.projects && data.projects.length) ? data.projects : DEFAULT.projects;
    const accent = { teal:'#2DD4BF', blue:'#3b82f6', violet:'#8b5cf6', rose:'#f43f5e', amber:'#f59e0b', emerald:'#10b981' }[data.theme] || '#2DD4BF';

    const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#020817;color:#e2e8f0;font-family:'DM Sans',sans-serif}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 24px;background:radial-gradient(ellipse at 50% 0%,${accent}11,transparent 60%)}
h1{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,72px);font-weight:800;letter-spacing:0;color:#f1f5f9;margin-bottom:8px}
.sub{color:${accent};font-size:18px;font-weight:600;margin-bottom:20px}.bio{color:#7a8fa8;font-size:16px;max-width:600px;margin:0 auto 28px;line-height:1.7;font-weight:300}
.badge{display:inline-block;padding:7px 18px;border-radius:999px;border:1px solid ${accent}33;background:${accent}11;color:${accent};font-size:13px;font-weight:600;margin-bottom:24px}
.socials{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.social{padding:8px 18px;border-radius:999px;border:1px solid #ffffff15;background:#ffffff06;color:#7a8fa8;text-decoration:none;font-size:13px}
section{padding:80px 24px;max-width:900px;margin:0 auto}
.sec-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${accent};margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid #ffffff08}
.skills{display:flex;flex-wrap:wrap;gap:10px}.skill{padding:7px 16px;background:${accent}10;border:1px solid ${accent}20;border-radius:999px;font-size:13px;font-weight:600;color:${accent}}
.projects{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.project{background:#0c1628;border:1px solid #ffffff08;border-radius:16px;padding:24px}.project-name{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px}
.project-desc{font-size:13px;color:#5a7a9a;line-height:1.6;font-weight:300;margin-bottom:12px}.project-tags{display:flex;gap:6px;flex-wrap:wrap}
.project-tag{font-size:10px;padding:3px 9px;border-radius:999px;background:#6366f113;border:1px solid #6366f120;color:#a5b4fc}
footer{text-align:center;padding:40px;border-top:1px solid #ffffff08;color:#344a63;font-size:12px}</style></head>
<body>
<div class="hero"><div>
<div class="badge">✅ Available for opportunities</div>
<h1>${name}</h1>
<div class="sub">${data.jobTitle||DEFAULT.jobTitle}</div>
<div class="bio">${data.bio||DEFAULT.bio}</div>
<div class="socials">
${data.github?`<a class="social" href="${data.github.startsWith('http')?data.github:'https://'+data.github}" target="_blank">GitHub</a>`:''}
${data.linkedin?`<a class="social" href="${data.linkedin.startsWith('http')?data.linkedin:'https://'+data.linkedin}" target="_blank">LinkedIn</a>`:''}
</div></div></div>
${skills?`<section><div class="sec-title">Skills</div><div class="skills">${(data.skills||DEFAULT.skills).map(s=>`<span class="skill">${s}</span>`).join('')}</div></section>`:''}
${projects.length?`<section><div class="sec-title">Projects</div><div class="projects">${projects.map(p=>`<div class="project"><div class="project-name">${p.name}</div><div class="project-desc">${p.desc||''}</div><div class="project-tags">${(p.tech||'').split(',').map(t=>`<span class="project-tag">${t.trim()}</span>`).join('')}</div></div>`).join('')}</div></section>`:''}
<footer>Built with NEXUS — ${name}</footer>
</body></html>`;

    const blob = new Blob([html], {type:'text/html'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (name.toLowerCase().replace(/\s+/g,'-')||'portfolio') + '.html';
    a.click();
  }

  /* ================================================================
     MINI CONFETTI on Go Live
  ================================================================ */
  function launchMiniConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#2DD4BF','#6366f1','#f59e0b','#34d399','#fff','#f43f5e'];
    const pieces = Array.from({length:100},()=>({
      x:Math.random()*canvas.width, y:-10-Math.random()*100,
      w:Math.random()*10+4, h:Math.random()*5+2,
      color:colors[Math.floor(Math.random()*colors.length)],
      r:Math.random()*Math.PI*2, rd:(Math.random()-.5)*.2,
      speed:Math.random()*3+1.5, drift:(Math.random()-.5)*1.5, op:1
    }));
    let rafId;
    (function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      let alive=false;
      pieces.forEach(p=>{
        p.y+=p.speed; p.x+=p.drift; p.r+=p.rd;
        if(p.y>canvas.height*.7) p.op=Math.max(0,p.op-.025);
        if(p.y<canvas.height+20) alive=true;
        ctx.save(); ctx.globalAlpha=p.op;
        ctx.translate(p.x,p.y); ctx.rotate(p.r);
        ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        ctx.restore();
      });
      if(alive) rafId=requestAnimationFrame(draw);
      else { cancelAnimationFrame(rafId); canvas.remove(); }
    })();
    setTimeout(()=>{ cancelAnimationFrame(rafId); canvas.remove(); },4000);
  }
