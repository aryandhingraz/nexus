/* ================================================================
     STATE

     This object is the builder's single source of truth. Instead of reading
     every input again for every action, the page keeps important choices here:
     current step, theme, uploaded avatar, project cards, skill chips, and
     collected form values.

     preview.html reads this same shape from localStorage, so keeping the state
     organized here makes the builder-to-preview flow predictable.
  ================================================================ */
  const state = {
    step: 1,
    totalSteps: 4,
    theme: 'teal',
    avatar: null,
    projects: [],
    skills: [],
    data: {}
  };

  /* ================================================================
     PARTICLES (reused from index.html)

     This uses the Canvas 2D API. Canvas gives JavaScript a drawing surface;
     every animation frame clears the surface, moves tiny dots, and draws them
     again. It creates a subtle background effect without requiring a video,
     GIF, or image asset.
  ================================================================ */
  (function() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COUNT = 70;
    // Canvas drawing coordinates depend on its width and height. Resizing it
    // with the viewport prevents stretched or clipped particles.
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    class P {
      constructor(init) {
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + 10;
        this.size = Math.random() * 1.5 + 0.3;
        this.sx = (Math.random() - 0.5) * 0.4;
        this.sy = -(Math.random() * 0.5 + 0.15);
        this.op = Math.random(); this.od = Math.random() > 0.5 ? 0.008 : -0.008;
      }
      update() {
        this.x += this.sx; this.y += this.sy;
        this.op += this.od;
        if (this.op >= 1) { this.op = 1; this.od = -0.008; }
        if (this.op <= 0) { this.op = 0; this.od = 0.008; }
        if (this.y < -10) { this.x = Math.random() * canvas.width; this.y = canvas.height + 10; }
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.op * 0.5;
        ctx.fillStyle = '#2DD4BF'; ctx.shadowBlur = 3; ctx.shadowColor = '#2DD4BF';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    for (let i = 0; i < COUNT; i++) particles.push(new P(true));
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      // requestAnimationFrame syncs animation to the browser's paint cycle,
      // which makes movement smoother and more efficient than setInterval.
      requestAnimationFrame(animate);
    }
    animate();
  })();

  /* ================================================================
     STEP NAVIGATION

     The builder is split into panels. Only one panel has the "active" class
     at a time. JavaScript changes classes to animate panels in/out, then
     updates the sidebar and progress bar so the user always knows where they
     are in the flow.
  ================================================================ */
  function setStep(n) {
    // Add an exit class first so CSS can animate the current panel away before
    // the next panel becomes active.
    const cur = document.getElementById('step-' + state.step);
    cur.classList.add('panel-out');
    setTimeout(() => {
      cur.classList.remove('active', 'panel-out');
      state.step = n;
      const next = document.getElementById('step-' + state.step);
      next.classList.add('active');
      updateNavUI();
      updateProgress();
      updatePreview();
      // The form panel has its own scrollbar on desktop, so scroll that panel
      // as well as the page shell when a new step opens.
      const formPanel = document.querySelector('.form-panel');
      if (formPanel) formPanel.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  }

  function nextStep() {
    if (!validateStep()) return;
    if (state.step < 4) setStep(state.step + 1);
  }

  function prevStep() {
    if (state.step > 1) setStep(state.step - 1);
  }

  function goFinish() {
    if (!validateStep()) return;
    collectData();
    saveDraftState();
    buildSummary();
    // Step 5 is the finish/summary screen. It is not counted in totalSteps
    // because it is reached only after the required form flow is complete.
    const cur = document.getElementById('step-' + state.step);
    cur.classList.add('panel-out');
    setTimeout(() => {
      cur.classList.remove('active', 'panel-out');
      state.step = 5;
      document.getElementById('step-5').classList.add('active');
      updateNavUI();
      updateProgress();
      launchConfetti();
    }, 200);
  }

  function updateNavUI() {
    [1,2,3,4,5].forEach(i => {
      const el = document.getElementById('nav-step-' + i);
      el.classList.remove('active', 'done');
      if (i === state.step) el.classList.add('active');
      else if (i < state.step) el.classList.add('done');
      // Completed steps show a check icon instead of a number, which gives an
      // instant visual confirmation that the step is done.
      const bubble = el.querySelector('.step-bubble');
      if (i < state.step) bubble.innerHTML = '<span class="material-symbols-outlined icon-16">check</span>';
      else bubble.textContent = '0' + i;
    });
  }

  function updateProgress() {
    // Progress uses the current step divided by 5 because the UI includes the
    // final review screen as part of the user's journey.
    const pct = Math.round((state.step / 5) * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';
  }

  /* Sidebar step clicks are intentionally limited. Users can go backward or
     to the immediate next step, but cannot jump far ahead and bypass required
     validation. */
  document.querySelectorAll('.step-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const n = parseInt(item.getAttribute('data-step'));
      if (n < state.step) setStep(n);
      if (n === state.step + 1) nextStep();
    });
  });

  /* ================================================================
     VALIDATION

     Validation protects the preview from being built with missing essentials.
     Step 1 requires name, title, and bio because those are the first things a
     portfolio visitor sees. Later sections are allowed to be optional so the
     user can build a simple portfolio quickly.
  ================================================================ */
  function validateStep() {
    let valid = true;
    if (state.step === 1) {
      const name = document.getElementById('fullName');
      const title = document.getElementById('jobTitle');
      const bio = document.getElementById('bio');
      if (!name.value.trim()) { showErr(name, 'fullNameErr'); valid = false; }
      else hideErr(name, 'fullNameErr');
      if (!title.value.trim()) { showErr(title, 'jobTitleErr'); valid = false; }
      else hideErr(title, 'jobTitleErr');
      if (!bio.value.trim()) { showErr(bio, 'bioErr'); valid = false; }
      else hideErr(bio, 'bioErr');
    }
    return valid;
  }
  function showErr(input, errId) {
    // The error class changes the field border, and shake-once gives immediate
    // feedback about which field needs attention.
    input.classList.add('error');
    input.classList.add('shake-once');
    setTimeout(() => input.classList.remove('shake-once'), 400);
    document.getElementById(errId).classList.add('show');
  }
  function hideErr(input, errId) {
    // Remove both the red field state and the message once the input is valid.
    input.classList.remove('error');
    document.getElementById(errId).classList.remove('show');
  }

  /* ================================================================
     BIO CHARACTER COUNT

     The counter helps users keep the bio concise. updatePreview() runs on the
     same input event so the right-side live preview changes as they type.
  ================================================================ */
  document.getElementById('bio').addEventListener('input', function() {
    enforceWordLimit(this);
    updatePreview();
  });

  /* ================================================================
     TEXTAREA AUTO-GROW

     Textareas can hide their first/last line when the typed content becomes
     taller than the visible box and the browser starts internally scrolling.
     This helper grows the textarea to fit its content, so the form panel
     scrolls instead of the text being clipped inside the field.
  ================================================================ */
  function fitBuilderTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight + 2, el.offsetHeight) + 'px';
  }

  function countWords(value) {
    const words = value.trim().match(/\S+/g);
    return words ? words.length : 0;
  }

  function limitWords(value, limit) {
    if (countWords(value) <= limit) return value;
    let seen = 0;
    const limited = value.split(/(\s+)/).reduce((output, part) => {
      if (!part.trim()) return seen >= limit ? output : output + part;
      if (seen >= limit) return output;
      seen++;
      return output + part;
    }, '');
    return limited.replace(/\s+$/, '');
  }

  function countLines(value) {
    return value ? value.split(/\r\n|\r|\n/).length : 1;
  }

  function limitLines(value, limit) {
    const lines = value.split(/\r\n|\r|\n/);
    if (lines.length <= limit) return value;
    return lines.slice(0, limit).join('\n');
  }

  function updateWordCount(el) {
    const counterId = el.dataset.wordCount;
    if (counterId) {
      const counter = document.getElementById(counterId);
      if (counter) counter.textContent = countWords(el.value);
    }
    const projectCounter = el.dataset.projectId
      ? document.querySelector(`[data-project-word-count="${el.dataset.projectId}"]`)
      : null;
    if (projectCounter) projectCounter.textContent = countWords(el.value);

    const lineCounterId = el.dataset.lineCount;
    if (lineCounterId) {
      const lineCounter = document.getElementById(lineCounterId);
      if (lineCounter) lineCounter.textContent = countLines(el.value);
    }
    const projectLineCounter = el.dataset.projectId
      ? document.querySelector(`[data-project-line-count="${el.dataset.projectId}"]`)
      : null;
    if (projectLineCounter) projectLineCounter.textContent = countLines(el.value);
  }

  function enforceWordLimit(el) {
    const limit = parseInt(el.dataset.wordLimit || '0', 10);
    const lineLimit = parseInt(el.dataset.lineLimit || '0', 10);
    if (lineLimit > 0) el.value = limitLines(el.value, lineLimit);
    if (limit > 0) el.value = limitWords(el.value, limit);
    updateWordCount(el);
    fitBuilderTextarea(el);
  }

  function prepareBuilderTextareas(root = document) {
    root.querySelectorAll('.field-textarea').forEach(textarea => {
      enforceWordLimit(textarea);
      if (textarea.dataset.textareaReady) return;
      textarea.dataset.textareaReady = 'true';
      textarea.addEventListener('input', () => enforceWordLimit(textarea));
    });
  }

  /* ================================================================
     LIVE INPUTS → PREVIEW
  ================================================================ */
  const liveFields = ['fullName','jobTitle','bio','location','email',
    'expRole','expCompany','expPeriod','expDesc',
    'github','linkedin','twitter','website','tagline','availability'];

  // liveFields lists the inputs that should immediately refresh the preview.
  // This avoids separate handwritten listeners for every field and keeps the
  // builder easier to extend later.
  liveFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      if (el.matches('.field-textarea')) enforceWordLimit(el);
      updatePreview();
    });
  });

  prepareBuilderTextareas();

  /* ================================================================
     AVATAR UPLOAD

     FileReader is a browser API for reading local files selected by the user.
     readAsDataURL converts the image into a text-based data URL, which can be
     stored in state/localStorage and used directly as an <img src>.
  ================================================================ */
  document.getElementById('avatarInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      // Store the image in state first, then update both the upload preview
      // and the generated portfolio preview.
      state.avatar = ev.target.result;
      const img = document.getElementById('avatarImg');
      img.src = ev.target.result;
      img.style.display = 'block';
      document.querySelector('#avatarPreview .placeholder').style.display = 'none';
      updatePreview();
    };
    reader.readAsDataURL(file);
  });

  /* ================================================================
     SKILLS TAGS

     Skills are stored as an array because the user can add/remove many values.
     The visible chips are recreated from state, which keeps the UI and data
     synchronized even after removing or loading a saved draft.
  ================================================================ */
  const tagsInput = document.getElementById('tagsInput');
  tagsInput.addEventListener('keydown', function(e) {
    // Enter and comma both commit a skill because users often type tag lists
    // naturally as "React, Node, CSS".
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = this.value.trim().replace(/,$/, '');
      if (val) addSkillChip(val);
      this.value = '';
    }
    if (e.key === 'Backspace' && !this.value && state.skills.length) {
      // Backspace on an empty tag input removes the last chip, matching common
      // tag editor behavior in modern apps.
      removeSkill(state.skills[state.skills.length - 1]);
    }
  });
  document.getElementById('tagsContainer').addEventListener('click', (event) => {
    // Event delegation lets one listener handle every remove button, including
    // chips created later by JavaScript.
    const removeBtn = event.target.closest('[data-remove-skill]');
    if (removeBtn) {
      event.stopPropagation();
      removeSkill(removeBtn.dataset.removeSkill);
      return;
    }
    tagsInput.focus();
  });

  document.querySelectorAll('[data-skill]').forEach(btn => {
    // Quick-add buttons use data-skill so the HTML controls the label while
    // this JS can reuse the same addSkillChip() function.
    btn.addEventListener('click', () => addSkillChip(btn.dataset.skill));
  });

  function addSkillChip(skill) {
    const s = skill.trim();
    // Ignore empty and duplicate skills to keep the preview clean.
    if (!s || state.skills.includes(s)) return;
    state.skills.push(s);
    renderSkills();
    updatePreview();
  }
  function removeSkill(skill) {
    state.skills = state.skills.filter(s => s !== skill);
    renderSkills();
    updatePreview();
  }
  function renderSkills() {
    const container = document.getElementById('tagsContainer');
    // Remove all existing generated chips, then rebuild from state. This simple
    // redraw avoids edge cases where the DOM and state could drift apart.
    container.querySelectorAll('.tag-chip').forEach(c => c.remove());
    state.skills.forEach(skill => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = skill;
      const remove = document.createElement('span');
      remove.className = 'remove';
      remove.dataset.removeSkill = skill;
      remove.textContent = 'x';
      chip.appendChild(remove);
      container.insertBefore(chip, tagsInput);
    });
  }

  /* ================================================================
     COLOR PICKER

     Swatches store their color name in data-color. The selected theme is kept
     in state, then updatePreview() applies a matching class to the live mini
     portfolio. The full preview page later reads this theme from localStorage.
  ================================================================ */
  document.getElementById('colorPicker').addEventListener('click', e => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
    state.theme = swatch.getAttribute('data-color');
    updatePreview();
  });

  /* ================================================================
     PROJECTS

     Projects are dynamic form blocks. Each project receives a generated id so
     input events can update the correct object in state.projects even when
     cards are added or removed.
  ================================================================ */
  let projectCount = 0;
  document.getElementById('addProjectBtn').addEventListener('click', addProject);
  document.querySelectorAll('[data-action="next-step"]').forEach(btn => btn.addEventListener('click', nextStep));
  document.querySelectorAll('[data-action="prev-step"]').forEach(btn => btn.addEventListener('click', prevStep));
  document.querySelectorAll('[data-action="finish-step"]').forEach(btn => btn.addEventListener('click', goFinish));
  document.querySelectorAll('[data-action="download-portfolio"]').forEach(btn => btn.addEventListener('click', downloadPortfolio));
  document.querySelectorAll('a[href="preview.html"]').forEach(link => {
    link.addEventListener('click', () => {
      // Save before navigation so preview.html can immediately read the latest
      // builder details from localStorage without requiring the user to click
      // "Save Draft" manually.
      collectData();
      saveDraftState();
    });
  });
  document.getElementById('avatarPreview').addEventListener('click', () => document.getElementById('avatarInput').click());
  document.getElementById('projectsList').addEventListener('click', e => {
    // Event delegation handles remove buttons for project cards that did not
    // exist when the page first loaded.
    const btn = e.target.closest('[data-remove-project]');
    if (btn) removeProject(btn.dataset.removeProject);
  });
  document.getElementById('projectsList').addEventListener('input', e => {
    // data-project-id identifies which project object to edit. data-project-key
    // identifies which property of that object should be updated.
    const field = e.target.closest('[data-project-id][data-project-key]');
    if (field && field.matches('.field-textarea')) enforceWordLimit(field);
    if (field) updateProject(field.dataset.projectId, field.dataset.projectKey, field.value);
  });

  function addProject() {
    // Limit the number of projects so the preview and downloaded portfolio stay
    // visually balanced instead of becoming a long uncurated list.
    if (state.projects.length >= 6) { alert('Max 6 projects!'); return; }
    projectCount++;
    const id = 'proj-' + projectCount;
    const proj = { id, name: '', desc: '', tech: '', url: '' };
    state.projects.push(proj);
    renderProjectCard(proj);
  }

  function renderProjectCard(proj) {
    // This function creates the editable form UI for one project. The values
    // are not hard-coded into the HTML because the user can create many cards.
    const list = document.getElementById('projectsList');
    const card = document.createElement('div');
    card.className = 'project-card-item';
    card.id = 'card-' + proj.id;
    const idx = state.projects.indexOf(proj) + 1;
    const safeAttr = value => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const safeText = value => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    card.innerHTML = `
      <div class="project-card-head">
        <span class="project-card-num">Project ${idx}</span>
        <button class="project-card-remove" type="button" data-remove-project="${proj.id}">
          <span class="material-symbols-outlined icon-15">close</span>
        </button>
      </div>
      <div class="field-row project-field-row">
        <div class="field-group field-group-tight">
          <label class="field-label">Project Name</label>
          <input class="field-input" type="text" placeholder="e.g. Quantum Dashboard" value="${safeAttr(proj.name)}" data-project-id="${proj.id}" data-project-key="name" />
        </div>
        <div class="field-group field-group-tight">
          <label class="field-label">Live URL</label>
          <input class="field-input" type="url" placeholder="https://..." value="${safeAttr(proj.url)}" data-project-id="${proj.id}" data-project-key="url" />
        </div>
      </div>
      <div class="field-group field-group-spaced">
        <label class="field-label">Description</label>
        <textarea class="field-textarea" placeholder="What does it do? What problem does it solve?" rows="3" data-word-limit="500" data-line-limit="25" data-project-id="${proj.id}" data-project-key="desc">${safeText(proj.desc)}</textarea>
        <div class="field-count"><span data-project-word-count="${proj.id}">0</span> / 500 words · <span data-project-line-count="${proj.id}">1</span> / 25 lines</div>
      </div>
      <div class="field-group field-group-tight">
        <label class="field-label">Tech Used</label>
        <input class="field-input" type="text" placeholder="React, Node.js, MongoDB..." value="${safeAttr(proj.tech)}" data-project-id="${proj.id}" data-project-key="tech" />
      </div>
    `;
    list.appendChild(card);
    prepareBuilderTextareas(card);
  }

  function removeProject(id) {
    state.projects = state.projects.filter(p => p.id !== id);
    const card = document.getElementById('card-' + id);
    // Fade/scale before removing so deletion feels intentional rather than
    // the layout suddenly jumping.
    if (card) { card.style.animation = 'none'; card.style.opacity = '0'; card.style.transform = 'scale(0.9)'; card.style.transition = 'all 0.2s'; setTimeout(() => card.remove(), 200); }
    updatePreview();
  }

  function updateProject(id, key, val) {
    // Find the matching project in state, update the changed field, then
    // redraw the live preview so the right panel stays in sync.
    const proj = state.projects.find(p => p.id === id);
    if (proj) { proj[key] = val; updatePreview(); }
  }

  // Add a default project on load so users see the project form immediately
  // instead of needing to discover the Add Project button first.
  addProject();

  /* ================================================================
     LIVE PREVIEW RENDERER

     This function builds the small preview shown on the right side of the
     builder page. It reads current form values, creates an HTML string, and
     places it into #portfolioRender. This is separate from preview.html:
     the builder preview is quick and compact, while preview.html is the full
     visitor-facing page.
  ================================================================ */
  function updatePreview() {
    // Optional chaining (?.) prevents errors if a field is missing from a page
    // variation. Empty strings keep the preview from showing "undefined".
    const name     = document.getElementById('fullName')?.value || '';
    const title    = document.getElementById('jobTitle')?.value || '';
    const bio      = document.getElementById('bio')?.value || '';
    const location = document.getElementById('location')?.value || '';
    const expRole  = document.getElementById('expRole')?.value || '';
    const expCo    = document.getElementById('expCompany')?.value || '';
    const expPer   = document.getElementById('expPeriod')?.value || '';
    const expDesc  = document.getElementById('expDesc')?.value || '';
    const github   = document.getElementById('github')?.value || '';
    const linkedin = document.getElementById('linkedin')?.value || '';
    const tagline  = document.getElementById('tagline')?.value || '';
    const avail    = document.getElementById('availability')?.value || 'open';
    const theme    = state.theme;
    const skills   = state.skills;
    const projects = state.projects;
    const avatar   = state.avatar;

    // Teal is the default style, so it needs no extra class. Other themes add
    // a modifier class that preview CSS can target.
    const themeClass = theme !== 'teal' ? 'port-theme-' + theme : '';
    const availLabel = { open:'Available for opportunities', freelance:'Open to freelance', busy:'Not available', looking:'Actively looking' }[avail] || '';
    const availEmoji = { open:'✅', freelance:'💼', busy:'🔴', looking:'👀' }[avail] || '';

    // Template literals make it easier to build nested preview markup with
    // conditional sections for avatar, tagline, links, skills, and projects.
    let html = `<div class="portfolio-render ${themeClass}">
      <div class="port-accent-bar"></div>
      <div class="port-hero">
        ${avatar
          ? `<div class="port-avatar"><img src="${avatar}" alt="avatar"></div>`
          : `<div class="port-avatar"><span class="material-symbols-outlined preview-person-icon">person</span></div>`}
        <div class="port-name ${name ? '' : 'empty'}">${name || 'Your Name'}</div>
        <div class="port-title">${title || 'Your Title'}</div>
        ${tagline ? `<div class="port-bio port-tagline">"${tagline}"</div>` : ''}
        <div class="port-bio">${bio || 'Your professional bio will appear here as you type...'}</div>
        ${location ? `<div class="port-location">📍 ${location}</div>` : ''}
        <div class="port-socials port-socials-spaced">
          <span class="port-availability">${availEmoji} ${availLabel}</span>
        </div>
        <div class="port-socials">
          ${github ? `<a class="port-social-chip" href="#">
            <span class="material-symbols-outlined" class="icon-12">code</span>GitHub</a>` : ''}
          ${linkedin ? `<a class="port-social-chip" href="#">
            <span class="material-symbols-outlined" class="icon-12">work</span>LinkedIn</a>` : ''}
        </div>
      </div>`;

    // Skills are shown only after the user adds at least one chip.
    if (skills.length) {
      html += `<div class="port-section">
        <div class="port-section-title">Technical Skills</div>
        <div class="port-skills">
          ${skills.map(s => `<span class="port-skill-chip">${s}</span>`).join('')}
        </div>
      </div>`;
    }

    // Experience is optional, so it appears only when role or company exists.
    if (expRole || expCo) {
      html += `<div class="port-section">
        <div class="port-section-title">Experience</div>
        <div class="port-exp">
          ${expRole ? `<div class="port-exp-role">${expRole}</div>` : ''}
          ${expCo   ? `<div class="port-exp-company">${expCo}</div>` : ''}
          ${expPer  ? `<div class="port-exp-period">${expPer}</div>` : ''}
          ${expDesc ? `<div class="port-exp-desc">${expDesc}</div>` : ''}
        </div>
      </div>`;
    }

    // Projects with empty names are ignored because a blank project card would
    // look unfinished in the live preview.
    const filledProjects = projects.filter(p => p.name);
    if (filledProjects.length) {
      html += `<div class="port-section">
        <div class="port-section-title">Featured Projects</div>
        ${filledProjects.map(p => `
          <div class="port-project">
            <div class="port-project-name">${p.name}</div>
            ${p.desc ? `<div class="port-project-desc">${p.desc}</div>` : ''}
            ${p.tech ? `<div class="port-project-tags">
              ${p.tech.split(',').map(t => `<span class="port-project-tag">${t.trim()}</span>`).join('')}
            </div>` : ''}
          </div>`).join('')}
      </div>`;
    }

    // Empty state gives helpful feedback before the user starts typing.
    if (!name && !bio && !expRole && !filledProjects.length && !skills.length) {
      html += `<div class="preview-empty">
        <span class="material-symbols-outlined">edit_note</span>
        <p>Start filling in the form<br />and watch your portfolio come alive!</p>
      </div>`;
    }

    html += `</div>`;
    document.getElementById('portfolioRender').innerHTML = html;

    // Update the mock browser URL. This is visual only; it does not create or
    // reserve a real domain.
    const slug = (name || 'your-name').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    document.getElementById('chromeUrl').textContent = `${slug}.nexus.dev`;
  }

  // Initial render draws the empty/default preview immediately on page load.
  updatePreview();

  /* ================================================================
     DEVICE TOGGLE (desktop/mobile preview)

     These buttons do not change real browser viewport size. They add CSS
     classes to the preview shell so the mini preview can imitate desktop or
     mobile proportions inside the builder page.
  ================================================================ */
  document.getElementById('devDesktop').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('devMobile').classList.remove('active');
    const browser = document.getElementById('previewBrowser');
    browser.classList.remove('mobile-mode');
    browser.classList.add('desktop-mode');
  });
  document.getElementById('devMobile').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('devDesktop').classList.remove('active');
    const browser = document.getElementById('previewBrowser');
    browser.classList.remove('desktop-mode');
    browser.classList.add('mobile-mode');
  });

  /* ================================================================
     SAVE DRAFT

     localStorage is a browser storage API. It saves text in the user's browser
     for this site, which lets builder.html and preview.html share portfolio
     data without a backend server or database.
  ================================================================ */
  function saveDraftState() {
    // localStorage stores strings, so JSON.stringify converts the state object
    // into text before saving.
    localStorage.setItem('spb_draft', JSON.stringify(state));
  }

  document.getElementById('saveDraftBtn').addEventListener('click', () => {
    collectData();
    saveDraftState();
    const btn = document.getElementById('saveDraftBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined icon-14">check_circle</span> Saved!';
    btn.style.color = 'var(--success)';
    btn.style.borderColor = 'rgba(52,211,153,0.3)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });

  // Load draft if exists. This restores a previous session so users do not lose
  // their form progress after refreshing or returning from preview.html.
  const draft = localStorage.getItem('spb_draft');
  if (draft) {
    try {
      const d = JSON.parse(draft);
      if (d.data) {
        Object.keys(d.data).forEach(k => {
          // The saved data keys match input IDs, so each field can be restored
          // without a long manual assignment list.
          const el = document.getElementById(k);
          if (el) el.value = d.data[k];
        });
        if (d.skills) { state.skills = d.skills; renderSkills(); }
        if (d.projects) {
          state.projects = [];
          document.getElementById('projectsList').innerHTML = '';
          d.projects.forEach(p => { state.projects.push(p); renderProjectCard(p); });
        }
        if (d.theme) {
          state.theme = d.theme;
          document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('selected', s.getAttribute('data-color') === d.theme);
          });
        }
        if (d.avatar) {
          state.avatar = d.avatar;
          const img = document.getElementById('avatarImg');
          img.src = d.avatar; img.style.display = 'block';
          document.querySelector('#avatarPreview .placeholder').style.display = 'none';
        }
      }
      updatePreview();
      prepareBuilderTextareas();
    } catch(e) {}
  }

  function collectData() {
    // Copy current input values into state.data before saving, previewing, or
    // downloading. This keeps state aligned with what the user sees.
    liveFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) state.data[id] = el.value;
    });
    state.data.skills = state.skills;
    state.data.projects = state.projects;
    state.data.theme = state.theme;
  }

  /* ================================================================
     SUMMARY (STEP 5)

     The finish step summarizes what the user has built. It is not required
     for the portfolio itself, but it gives confidence before opening the full
     preview or downloading the file.
  ================================================================ */
  function buildSummary() {
    collectData();
    const name    = document.getElementById('fullName').value || 'Not set';
    const title   = document.getElementById('jobTitle').value || 'Not set';
    const skillsN = state.skills.length;
    const projsN  = state.projects.filter(p => p.name).length;
    const expRole = document.getElementById('expRole').value || '—';
    const themeMap = { teal:'Teal', blue:'Ocean Blue', violet:'Violet', rose:'Rose', amber:'Amber', emerald:'Emerald' };

    document.getElementById('summaryCard').innerHTML = `
      <div class="summary-row"><span class="summary-key">Name</span><span class="summary-val">${name}</span></div>
      <div class="summary-row"><span class="summary-key">Title</span><span class="summary-val">${title}</span></div>
      <div class="summary-row"><span class="summary-key">Skills</span><span class="summary-val teal">${skillsN} skill${skillsN !== 1 ? 's' : ''} added</span></div>
      <div class="summary-row"><span class="summary-key">Projects</span><span class="summary-val teal">${projsN} project${projsN !== 1 ? 's' : ''} showcased</span></div>
      <div class="summary-row"><span class="summary-key">Experience</span><span class="summary-val">${expRole}</span></div>
      <div class="summary-row"><span class="summary-key">Theme</span><span class="summary-val teal">${themeMap[state.theme] || state.theme}</span></div>
      <div class="summary-row"><span class="summary-key">Build Score</span><span class="summary-val teal">🏆 ${calcScore()}%</span></div>
    `;
  }

  function calcScore() {
    // Simple scoring rewards completion of important portfolio sections. It is
    // not a technical quality score; it is a progress signal for the builder.
    let score = 0;
    if (document.getElementById('fullName').value) score += 20;
    if (document.getElementById('jobTitle').value) score += 10;
    if (document.getElementById('bio').value)      score += 15;
    if (state.avatar)                              score += 10;
    if (document.getElementById('expRole').value)  score += 15;
    if (state.skills.length >= 3)                  score += 15;
    if (state.projects.filter(p=>p.name).length)   score += 15;
    return score;
  }

  /* ================================================================
     DOWNLOAD PORTFOLIO

     This creates a standalone HTML file entirely in the browser.
     Blob is a Web API for file-like data, URL.createObjectURL() creates a
     temporary downloadable URL for that Blob, and clicking the generated anchor
     starts the download. No server API is required.
  ================================================================ */
  function downloadPortfolio() {
    collectData();
    // Pull values from state.data so the downloaded file matches the latest
    // builder form at the moment the button is clicked.
    const name    = state.data.fullName || 'Portfolio';
    const title   = state.data.jobTitle || '';
    const bio     = state.data.bio || '';
    const skills  = state.skills.join(', ');
    const expRole = state.data.expRole || '';
    const expCo   = state.data.expCompany || '';
    const expPer  = state.data.expPeriod || '';
    const expDesc = state.data.expDesc   || '';
    const github  = state.data.github || '#';
    const linkedin= state.data.linkedin || '#';
    const tagline = state.data.tagline || '';
    const location= state.data.location || '';
    const avail   = state.data.availability || 'open';
    const theme   = state.theme;
    const projects= state.projects.filter(p => p.name);
    const avatar  = state.avatar || '';
    const availLabel = { open:'Available for opportunities', freelance:'Open to freelance', busy:'Not available', looking:'Actively looking' }[avail] || '';
    const accentMap = { teal:'#2DD4BF', blue:'#3b82f6', violet:'#8b5cf6', rose:'#f43f5e', amber:'#f59e0b', emerald:'#10b981' };
    const accent = accentMap[theme] || '#2DD4BF';

    // The downloaded portfolio is a complete HTML document with its own CSS.
    // That means the file can be opened independently without the builder app.
    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#020817;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
.accent{color:${accent}}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 24px;background:radial-gradient(circle at 50% 30%,rgba(${hexToRgb(accent)},0.08),transparent 60%)}
.avatar{width:100px;height:100px;border-radius:50%;border:3px solid ${accent};margin:0 auto 20px;overflow:hidden;background:rgba(${hexToRgb(accent)},0.1);display:flex;align-items:center;justify-content:center;font-size:40px}
.avatar img{width:100%;height:100%;object-fit:cover}
h1{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,64px);font-weight:800;letter-spacing:0;margin-bottom:8px}
.subtitle{color:${accent};font-size:18px;font-weight:600;margin-bottom:16px}
.tagline{font-style:italic;font-size:15px;color:#5a7a9a;margin-bottom:16px}
.bio{max-width:600px;margin:0 auto 24px;color:#7a8fa8;font-size:16px;line-height:1.7;font-weight:300}
.location{font-size:13px;color:#3d5068;margin-bottom:20px}
.badge{display:inline-block;padding:6px 16px;border-radius:999px;background:rgba(${hexToRgb(accent)},0.1);border:1px solid rgba(${hexToRgb(accent)},0.2);color:${accent};font-size:13px;font-weight:600;margin-bottom:16px}
.socials{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.social-link{padding:8px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#7a8fa8;text-decoration:none;font-size:13px;transition:all 0.2s}
.social-link:hover{border-color:${accent};color:${accent}}
section{padding:80px 24px;max-width:900px;margin:0 auto}
.section-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${accent};margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05)}
.skills{display:flex;flex-wrap:wrap;gap:10px}
.skill{padding:6px 16px;background:rgba(${hexToRgb(accent)},0.08);border:1px solid rgba(${hexToRgb(accent)},0.15);border-radius:999px;font-size:13px;font-weight:600;color:${accent}}
.exp{border-left:3px solid rgba(${hexToRgb(accent)},0.3);padding-left:20px}
.exp-role{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;margin-bottom:4px}
.exp-co{color:${accent};font-size:14px;margin-bottom:3px}
.exp-period{font-size:12px;color:#3d5068;margin-bottom:10px}
.exp-desc{font-size:14px;color:#5a7a9a;line-height:1.7;font-weight:300}
.projects{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.project{background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:24px;transition:border-color 0.2s}
.project:hover{border-color:rgba(${hexToRgb(accent)},0.25)}
.project-name{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px}
.project-desc{font-size:13px;color:#5a7a9a;line-height:1.6;font-weight:300;margin-bottom:12px}
.project-tags{display:flex;gap:6px;flex-wrap:wrap}
.project-tag{font-size:11px;padding:3px 10px;border-radius:999px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);color:#a5b4fc}
footer{text-align:center;padding:40px;border-top:1px solid rgba(255,255,255,0.05);color:#3d5068;font-size:13px}
</style></head><body>
<div class="hero">
  <div>
    <div class="avatar">${avatar ? `<img src="${avatar}" alt="${name}">` : '👤'}</div>
    <div class="badge">${availLabel}</div>
    <h1>${name}</h1>
    <div class="subtitle">${title}</div>
    ${tagline ? `<div class="tagline">"${tagline}"</div>` : ''}
    <div class="bio">${bio}</div>
    ${location ? `<div class="location">📍 ${location}</div>` : ''}
    <div class="socials">
      ${github ? `<a class="social-link" href="${github}" target="_blank">GitHub</a>` : ''}
      ${linkedin ? `<a class="social-link" href="${linkedin}" target="_blank">LinkedIn</a>` : ''}
    </div>
  </div>
</div>
${skills ? `<section><div class="section-title">Technical Skills</div><div class="skills">${skills.split(',').map(s=>`<span class="skill">${s.trim()}</span>`).join('')}</div></section>` : ''}
${(expRole || expCo) ? `<section><div class="section-title">Experience</div><div class="exp"><div class="exp-role">${expRole}</div><div class="exp-co">${expCo}</div><div class="exp-period">${expPer}</div><div class="exp-desc">${expDesc}</div></div></section>` : ''}
${projects.length ? `<section><div class="section-title">Featured Projects</div><div class="projects">${projects.map(p=>`<div class="project"><div class="project-name">${p.name}</div><div class="project-desc">${p.desc}</div><div class="project-tags">${p.tech.split(',').map(t=>`<span class="project-tag">${t.trim()}</span>`).join('')}</div></div>`).join('')}</div></section>` : ''}
<footer>Built with NEXUS &mdash; ${name}</footer>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (name.toLowerCase().replace(/\s+/g, '-') || 'portfolio') + '.html';
    a.click();
  }

  function hexToRgb(hex) {
    // Converts "#2DD4BF" into "45,212,191" so generated CSS can use rgba()
    // with the selected accent color.
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  /* ================================================================
     CONFETTI (finish step)

     The confetti is another Canvas 2D animation. Each rectangle has position,
     size, color, rotation, speed, and drift. The animation updates those values
     every frame so pieces fall naturally and fade near the bottom.
  ================================================================ */
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = [];
    const colors = ['#2DD4BF','#6366f1','#f59e0b','#f43f5e','#34d399','#fff','#a5b4fc'];
    for (let i = 0; i < 120; i++) {
      // Randomized pieces make every celebration feel slightly different.
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: Math.random() * 10 + 5,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * Math.PI * 2,
        rd: (Math.random() - 0.5) * 0.2,
        speed: Math.random() * 3 + 1.5,
        drift: (Math.random() - 0.5) * 1.5,
        opacity: 1
      });
    }
    let frame;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      pieces.forEach(p => {
        // Move down, drift sideways, and rotate a little on every frame.
        p.y += p.speed; p.x += p.drift; p.r += p.rd;
        if (p.y < canvas.height + 20) alive = true;
        if (p.y > canvas.height * 0.7) p.opacity = Math.max(0, p.opacity - 0.02);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      // Continue only while at least one piece is still visible.
      if (alive) frame = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    frame = requestAnimationFrame(animate);
    setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0,0,canvas.width,canvas.height); }, 4000);
  }
