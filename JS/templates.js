/* ================================================================
     WEBGL SHADER BACKGROUND
  ================================================================ */
  (function() {
    // IIFE (Immediately Invoked Function Expression):
    // Runs the WebGL background setup immediately and keeps variables private.
    const canvas = document.getElementById('shader-canvas');

    // "gl" is the WebGL context. It lets this page draw animated background
    // pixels on the GPU instead of creating many HTML elements.
    const gl = canvas.getContext('webgl');

    // If WebGL is unsupported, stop this background only. The gallery still works.
    if (!gl) return;

    // Vertex shader:
    // "p" is a point position. This tiny shader passes full-screen rectangle
    // points directly to WebGL clip space.
    const vs = `attribute vec4 p;void main(){gl_Position=p;}`;

    // Fragment shader:
    // Runs once per pixel and creates teal animated wave/grid lines.
    // R is resolution and T is elapsed time, both passed from JavaScript.
    const fs = `
      precision highp float;
      uniform vec2 R; uniform float T;
      float rnd(float t){return(cos(t)+cos(t*1.3+1.3)+cos(t*1.4+1.4))/3.;}
      void main(){
        vec2 uv=gl_FragCoord.xy/R;
        vec2 sp=(gl_FragCoord.xy-R/2.)/R.x*10.;
        float hf=1.-(cos(uv.x*6.28)*.5+.5);
        float vf=1.-(cos(uv.y*6.28)*.5+.5);
        sp.y+=rnd(sp.x*.5+T*.04)*hf;
        sp.x+=rnd(sp.y*.5+T*.04+2.)*hf;
        vec4 lines=vec4(0.);
        vec4 lc=vec4(.18,.83,.75,1.);
        for(int l=0;l<8;l++){
          // GLSL for-loop:
          // l starts at 0, runs while l is below 8, and increases by 1.
          // Each pass adds one moving line layer to the background.
          float nl=float(l)/8.;
          float rn=rnd(float(l)+sp.x*.5+T*.13)*.5+.5;
          float hw=mix(.01,.15,rn*hf)/2.;
          float off=rnd(float(l)+T*.2*(1.+nl))*mix(.6,2.,hf);
          float lp=rnd(sp.x*.2+T*.2)*hf+off;
          float line=smoothstep(hw,.0,abs(lp-sp.y))/2.;
          lines+=line*lc*rn;
        }
        vec4 c=mix(vec4(.008,.031,.09,1.),vec4(.015,.045,.11,1.),uv.x);
        c*=vf; c.a=1.; c+=lines;
        gl_FragColor=c;
      }`;
    // mkShader() compiles a shader string into a GPU shader object.
    // "type" decides whether this is a vertex or fragment shader.
    function mkShader(type, src) {
      const s = gl.createShader(type); gl.shaderSource(s, src);
      gl.compileShader(s); return s;
    }
    // A WebGL program links the vertex and fragment shaders together.
    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    // Buffer containing four points that form a full-screen rectangle.
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    // Shader variable locations. JavaScript uses these to send data into GLSL.
    const pLoc = gl.getAttribLocation(prog,'p');
    const rLoc = gl.getUniformLocation(prog,'R');
    const tLoc = gl.getUniformLocation(prog,'T');

    // resize() keeps the canvas pixel dimensions equal to the browser window.
    function resize() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; gl.viewport(0,0,canvas.width,canvas.height); }
    window.addEventListener('resize', resize); resize();
    // Starting time used to calculate elapsed seconds for animation.
    const t0 = Date.now();

    // render() is the WebGL animation loop. It draws one frame and then
    // schedules the next frame with requestAnimationFrame().
    (function render() {
      gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(prog);
      gl.uniform2f(rLoc,canvas.width,canvas.height);
      gl.uniform1f(tLoc,(Date.now()-t0)/1000);
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.vertexAttribPointer(pLoc,2,gl.FLOAT,false,0,0);
      gl.enableVertexAttribArray(pLoc);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      requestAnimationFrame(render);
    })();
  })();

  /* ================================================================
     PARTICLES
  ================================================================ */
  (function() {
    // This IIFE creates the small floating particle layer above the shader.
    const c = document.getElementById('particles-canvas');

    // Canvas 2D context is enough here because particles are simple circles.
    const ctx = c.getContext('2d');

    // pts stores all particle objects. Each object keeps its own position,
    // radius, speed, opacity, and opacity direction.
    let pts = [];

    // Matches the canvas drawing size to the viewport.
    function resize() { c.width=window.innerWidth; c.height=window.innerHeight; }
    window.addEventListener('resize', resize); resize();

    // for-loop:
    // i starts at 0, runs while i is less than 80, and i++ adds 1 each pass.
    // Each pass creates one particle object and pushes it into pts.
    for (let i=0;i<80;i++) pts.push({
      x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.4+0.3,
      sx:(Math.random()-.5)*.4, sy:-(Math.random()*.4+.1),
      op:Math.random(), od:Math.random()>.5?.006:-.006
    });
    // anim() is the particle animation loop.
    (function anim() {
      ctx.clearRect(0,0,c.width,c.height);

      // forEach loop:
      // Runs once for each particle. "p" is the current particle object.
      pts.forEach(p=>{
        p.x+=p.sx; p.y+=p.sy; p.op+=p.od;
        // Clamp opacity between 0 and 1 and reverse fade direction at limits.
        if(p.op>=1){p.op=1;p.od=-.006;}
        if(p.op<=0){p.op=0;p.od=.006;}

        // Recycle particles that move above the screen.
        if(p.y<-10){p.x=Math.random()*c.width;p.y=c.height+10;}
        ctx.save(); ctx.globalAlpha=p.op*.45;
        ctx.fillStyle='#2DD4BF'; ctx.shadowBlur=3; ctx.shadowColor='#2DD4BF';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(anim);
    })();
  })();

  /* ================================================================
     CUSTOM CURSOR
  ================================================================ */
  // dot is the small center cursor element. ring is the larger trailing circle.
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  // mx/my store the real mouse position. rx/ry store the ring position,
  // which follows slowly to create a smooth trailing animation.
  let mx=0,my=0,rx=0,ry=0;

  // Updates the dot instantly whenever the mouse moves.
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });

  // cursorAnim() eases the ring toward the mouse position every frame.
  (function cursorAnim() {
    rx += (mx-rx)*.13; ry += (my-ry)*.13;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(cursorAnim);
  })();
  // forEach loop:
  // Adds hover listeners to every clickable item so the custom cursor grows
  // when the user is over an interactive element.
  document.querySelectorAll('a,button,.tmpl-card,.filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.style.width='14px'; dot.style.height='14px';
      ring.style.width='48px'; ring.style.height='48px';
      ring.style.borderColor='rgba(45,212,191,0.7)';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.width='8px'; dot.style.height='8px';
      ring.style.width='32px'; ring.style.height='32px';
      ring.style.borderColor='rgba(45,212,191,0.4)';
    });
  });

  /* ================================================================
     FILTER SYSTEM
  ================================================================ */
  // cards contains only real template cards. The data-category selector avoids
  // accidentally including the empty-state element.
  const cards = document.querySelectorAll('.tmpl-card[data-category]');

  // emptyState is shown when filtering hides every card.
  const emptyState = document.getElementById('emptyState');

  // currentFilter stores the active category. "all" means no category filter.
  let currentFilter = 'all';

  // currentSort stores the active sorting mode from the select dropdown.
  let currentSort = 'popular';

  // Adds a click handler to every category filter button.
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active styling from all buttons, then activate the clicked one.
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // data-filter from HTML decides which category should be shown.
      currentFilter = btn.getAttribute('data-filter');
      applyFilter();
    });
  });

  // When sorting changes, store the new value and rebuild the gallery order.
  document.getElementById('sortSelect').addEventListener('change', function() {
    currentSort = this.value;
    applyFilter();
  });

  // applyFilter() handles both sorting and filtering, then updates the count.
  function applyFilter() {
    // visible counts how many cards remain after the filter.
    let visible = 0;

    // Convert NodeList to Array so we can use Array.sort().
    const cardArr = Array.from(cards);

    // Sort comparator:
    // a and b are two cards being compared. Returning a negative/positive
    // number tells JavaScript which card should come first.
    cardArr.sort((a,b) => {
      if (currentSort === 'popular') return parseInt(b.dataset.uses) - parseInt(a.dataset.uses);
      if (currentSort === 'rating')  return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
      if (currentSort === 'newest')  return new Date(b.dataset.date) - new Date(a.dataset.date);
      return 0;
    });

    const grid = document.getElementById('templatesGrid');

    // Re-appending existing card nodes changes their visual order in the DOM.
    cardArr.forEach(c => grid.appendChild(c));

    // forEach loop:
    // card is the current template card. i is its index in the sorted array.
    cardArr.forEach((card, i) => {
      const cat = card.getAttribute('data-category');
      const show = currentFilter === 'all' || cat === currentFilter;

      // hidden class uses CSS display:none to hide non-matching cards.
      card.classList.toggle('hidden', !show);
      if (show) {
        visible++;

        // Staggers the reveal animation so cards do not all appear at once.
        card.style.animationDelay = (i * 0.06) + 's';
        card.classList.remove('reveal');

        // Reading offsetWidth forces browser reflow, allowing the animation
        // class to restart after filtering/sorting.
        void card.offsetWidth;
        card.classList.add('reveal');

        // setTimeout delays the visible class to create a cascade effect.
        setTimeout(() => card.classList.add('visible'), 60 + i * 60);
      }
    });

    // Show empty message only when no cards are visible.
    emptyState.style.display = visible === 0 ? 'block' : 'none';

    // Updates the text count in the results header.
    document.getElementById('visibleCount').textContent = visible;
  }

  /* ================================================================
     VIEW TOGGLE (grid / list)
  ================================================================ */
  document.getElementById('viewGrid').addEventListener('click', function() {
    // "this" is the clicked grid button because a normal function is used.
    this.classList.add('active');
    document.getElementById('viewList').classList.remove('active');

    // Removing list-view returns CSS grid to the normal 3-column layout.
    document.getElementById('templatesGrid').classList.remove('list-view');

    // Featured cards span more columns in grid view, so restore that class.
    document.querySelectorAll('.tmpl-card[data-featured="true"]').forEach(c => c.classList.add('featured'));
  });
  document.getElementById('viewList').addEventListener('click', function() {
    // Activate list button and deactivate grid button.
    this.classList.add('active');
    document.getElementById('viewGrid').classList.remove('active');

    // list-view class changes the gallery CSS from card grid to horizontal rows.
    document.getElementById('templatesGrid').classList.add('list-view');

    // Featured cards do not make sense in list view, so remove the larger layout.
    document.querySelectorAll('.tmpl-card[data-featured="true"]').forEach(c => c.classList.remove('featured'));
  });

  /* ================================================================
     PREVIEW MODAL
  ================================================================ */
  // openModal() fills the preview modal using data-* attributes from a card.
  function openModal(card) {
    // dataset reads HTML data attributes like data-name and data-rating.
    const name = card.dataset.name;
    const desc = card.dataset.desc;
    const img  = card.dataset.img;
    const cat  = card.dataset.category;
    const rating = card.dataset.rating;
    const uses = parseInt(card.dataset.uses).toLocaleString();

    // Update modal text/image content before showing it.
    document.getElementById('modalName').textContent = name;
    document.getElementById('modalDesc').textContent = desc;
    document.getElementById('modalImg').src = img;
    document.getElementById('modalCat').textContent = cat.charAt(0).toUpperCase() + cat.slice(1) + ' Template';
    document.getElementById('modalMeta').textContent = `★ ${rating} rating · ${uses} portfolios built with this template`;

    // open class makes the modal visible. Body overflow hidden prevents
    // the page behind the modal from scrolling.
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // closeModal() hides the modal and restores normal page scrolling.
  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
  // Buttons with data-modal-trigger="card" open the modal for their closest card.
  document.querySelectorAll('[data-modal-trigger="card"]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.closest('.tmpl-card')));
  });

  // Any element marked data-action="close-modal" closes the modal.
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Clicking the dark overlay outside the modal box closes the modal.
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Escape key also closes the modal for keyboard users.
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ================================================================
     SCROLL REVEAL
  ================================================================ */
  // IntersectionObserver adds .visible when reveal elements enter the viewport.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  // Observe every reveal element on the page.
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* ================================================================
     ANIMATE POPULARITY BARS ON SCROLL
  ================================================================ */
  // Separate observer for the popularity progress bars. It restarts each bar
  // width animation when the card first scrolls into view.
  const barObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const fill = e.target.querySelector('.tmpl-popularity-fill');

        // Store the target width, set it to 0, then restore it after a tiny
        // delay so CSS transition animates the fill.
        if (fill) { const w = fill.style.width || getComputedStyle(fill).width; fill.style.width='0'; setTimeout(()=>fill.style.width=w, 100); }

        // Stop observing after one animation.
        barObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  // Attach popularity observer to every card.
  document.querySelectorAll('.tmpl-card').forEach(c => barObserver.observe(c));
