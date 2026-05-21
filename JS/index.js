/* ================================================================
     WEBGL SHADER BACKGROUND (from 21st.dev — ported to vanilla JS)
  ================================================================ */
  (function() {
    // Immediately Invoked Function Expression (IIFE):
    // This function runs as soon as the file loads and keeps its variables
    // private so names like "canvas" and "gl" do not clash with other scripts.
    const canvas = document.getElementById('shader-canvas');

    // "gl" stores the WebGL context. WebGL is used here because this
    // full-screen animated background is drawn on the GPU for smoother motion.
    const gl = canvas.getContext('webgl');

    // If WebGL is not available, stop only this background effect.
    if (!gl) return;

    // Vertex shader source:
    // A vertex shader controls where shape points are placed. This shader
    // simply passes the rectangle points straight through to the screen.
    const vsSource = `
      attribute vec4 aPos;
      void main() { gl_Position = aPos; }
    `;

    // Fragment shader source:
    // A fragment shader calculates the color of each pixel. This long shader
    // creates the animated teal grid/plasma effect using math, time, and noise.
    const fsSource = `
      precision highp float;
      uniform vec2 iRes;     // Canvas resolution passed from JavaScript.
      uniform float iTime;   // Seconds elapsed, used to animate movement.
      const float overallSpeed = 0.2;       // Master speed multiplier.
      const float gridSmoothWidth = 0.015;  // Soft edge size for grid lines.
      const float axisWidth = 0.05;         // Reserved axis width value.
      const float majorLineWidth = 0.025;   // Reserved major grid line width.
      const float minorLineWidth = 0.0125;  // Reserved minor grid line width.
      const float majorLineFrequency = 5.0; // Reserved spacing for large lines.
      const float minorLineFrequency = 1.0; // Reserved spacing for small lines.
      const float scale = 5.0;              // Zoom level of the shader world.
      const vec4 lineColor = vec4(0.18, 0.83, 0.75, 1.0); // Teal RGBA line color.
      const float minLineWidth = 0.01;      // Thinnest animated plasma line.
      const float maxLineWidth = 0.2;       // Thickest animated plasma line.
      const float lineSpeed = 1.0 * overallSpeed; // How fast lines travel.
      const float lineAmplitude = 1.0;      // How tall the wave movement is.
      const float lineFrequency = 0.2;      // How often the wave changes.
      const float warpSpeed = 0.2 * overallSpeed; // Speed of background warping.
      const float warpFrequency = 0.5;      // Density of the warp pattern.
      const float warpAmplitude = 1.0;      // Strength of the warp distortion.
      const float offsetFrequency = 0.5;    // Horizontal offset variation.
      const float offsetSpeed = 1.33 * overallSpeed; // Speed of line offsets.
      const float minOffsetSpread = 0.6;    // Minimum distance between lines.
      const float maxOffsetSpread = 2.0;    // Maximum distance between lines.
      const int linesPerGroup = 12;         // Number of line groups drawn.

      #define drawSmoothLine(pos, hw, t) smoothstep(hw, 0.0, abs(pos - (t)))
      #define drawCrispLine(pos, hw, t) smoothstep(hw + gridSmoothWidth, hw, abs(pos - (t)))
      #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))
      #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))

      // Pseudo-random wave function. GLSL shaders cannot use Math.random(),
      // so this combines cosines to create repeatable organic variation.
      float random(float t) {
        return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
      }

      // Returns the animated Y position for one plasma line at a given X.
      float getPlasmaY(float x, float hFade, float offset) {
        return random(x * lineFrequency + iTime * lineSpeed) * hFade * lineAmplitude + offset;
      }

      // main() runs once for every pixel being drawn.
      void main() {
        vec2 uv = gl_FragCoord.xy / iRes.xy;
        vec2 space = (gl_FragCoord.xy - iRes.xy / 2.0) / iRes.x * 2.0 * scale;
        float hFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
        float vFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);
        space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + hFade);
        space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * hFade;
        vec4 lines = vec4(0.0);
        vec4 bg1 = vec4(0.008, 0.031, 0.09, 1.0);
        vec4 bg2 = vec4(0.02, 0.055, 0.12, 1.0);
        for (int l = 0; l < linesPerGroup; l++) {
          // GLSL for-loop:
          // l starts at 0, keeps running while l is less than linesPerGroup,
          // and increases by 1 each pass. Each pass contributes one animated
          // plasma line plus a small moving highlight circle.
          float nli = float(l) / float(linesPerGroup);
          float offTime = iTime * offsetSpeed;
          float offPos = float(l) + space.x * offsetFrequency;
          float rand = random(offPos + offTime) * 0.5 + 0.5;
          float hw = mix(minLineWidth, maxLineWidth, rand * hFade) / 2.0;
          float offset = random(offPos + offTime * (1.0 + nli)) * mix(minOffsetSpread, maxOffsetSpread, hFade);
          float lp = getPlasmaY(space.x, hFade, offset);
          float line = drawSmoothLine(lp, hw, space.y) / 2.0 + drawCrispLine(lp, hw * 0.15, space.y);
          float cx = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
          vec2 cp = vec2(cx, getPlasmaY(cx, hFade, offset));
          float circle = drawCircle(cp, 0.01, space) * 4.0;
          lines += (line + circle) * lineColor * rand;
        }
        vec4 col = mix(bg1, bg2, uv.x);
        col *= vFade;
        col.a = 1.0;
        col += lines;
        gl_FragColor = col;
      }
    `;

    // compileShader() converts readable GLSL source code into a GPU shader.
    // "type" is either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
    // "src" is the string containing the shader code.
    function compileShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    }

    // "prog" is the complete WebGL program. A program combines the vertex
    // shader and fragment shader so WebGL knows how to draw the background.
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);

    // "buf" is a GPU buffer holding four points. The points make one
    // full-screen rectangle using a TRIANGLE_STRIP.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);

    // These variables store locations of shader inputs. JavaScript uses
    // them later to send position, resolution, and time data to the GPU.
    const posLoc = gl.getAttribLocation(prog, 'aPos');
    const resLoc = gl.getUniformLocation(prog, 'iRes');
    const timeLoc = gl.getUniformLocation(prog, 'iTime');

    // resize() updates the canvas resolution and WebGL viewport whenever
    // the browser size changes, preventing stretched or blurry rendering.
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // The start time is saved once. Each frame subtracts this from the
    // current time to produce elapsed seconds for smooth animation.
    const start = Date.now();

    // render() is the WebGL animation loop. It draws one frame, then asks
    // the browser to call render again before the next repaint.
    function render() {
      const t = (Date.now() - start) / 1000;

      // Clears the previous frame before drawing the new one.
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);

      // Send current canvas size and elapsed time into shader uniforms.
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);

      // Tell WebGL how to read the rectangle points from the buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);

      // Draws four vertices as a strip of two triangles, covering the screen.
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  })();

  /* ================================================================
     SPARKLES PARTICLES (from 21st.dev — ported to Canvas2D)
  ================================================================ */
  (function() {
    // This IIFE creates the floating teal particles. It is separated from
    // the WebGL code so each animation system has its own private variables.
    const canvas = document.getElementById('particles-canvas');

    // "ctx" is the Canvas 2D drawing context. It provides drawing methods
    // such as clearRect(), beginPath(), arc(), and fill().
    const ctx = canvas.getContext('2d');

    // particles stores every active Particle object on the screen.
    let particles = [];

    // COUNT is the normal number of particles created at page load.
    const COUNT = 120;

    // resize() keeps the particle canvas matched to the viewport size.
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Particle is a class, meaning it is a reusable blueprint for creating
    // many particle objects with the same behavior but different values.
    class Particle {
      // constructor() runs automatically when "new Particle()" is called.
      constructor() { this.reset(true); }

      // reset() gives the particle a fresh random position, size, movement,
      // and opacity. "init" tells whether this is first placement or respawn.
      reset(init = false) {
        // x and y store the particle's current position in canvas pixels.
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + 10;

        // size is the circle radius. Random sizes create visual depth.
        this.size = Math.random() * 2 + 0.4;

        // speedX creates small side-to-side drift. speedY is negative so the
        // particle floats upward.
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = -(Math.random() * 0.6 + 0.2);

        // opacity controls transparency. opacityDir flips between fade-in
        // and fade-out, creating the sparkle/twinkle effect.
        this.opacity = Math.random();
        this.opacityDir = Math.random() > 0.5 ? 0.01 : -0.01;
        this.opacitySpeed = Math.random() * 0.015 + 0.004;
      }

      // update() changes the particle values before each redraw.
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.opacityDir * this.opacitySpeed * 4;

        // Keep opacity between 0 and 1. When either limit is reached,
        // reverse direction so the particle starts fading the other way.
        if (this.opacity >= 1)  { this.opacity = 1;  this.opacityDir = -1; }
        if (this.opacity <= 0)  { this.opacity = 0;  this.opacityDir =  1; }

        // Recycle particles that leave the top of the screen.
        if (this.y < -10) this.reset();
      }

      // draw() paints this particle as a glowing teal circle.
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity * 0.7;
        ctx.fillStyle = '#2DD4BF';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#2DD4BF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // for-loop:
    // let i = 0 starts the counter at zero.
    // i < COUNT keeps the loop running until 120 particles are created.
    // i++ increases the counter by 1 after each pass.
    // Each pass creates one Particle object and pushes it into the array.
    for (let i = 0; i < COUNT; i++) particles.push(new Particle());

    // animate() is the main Canvas2D particle animation loop.
    function animate() {
      // Clears the entire canvas so old particle drawings do not remain.
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // forEach loop:
      // Runs once for every particle in the particles array. "p" is the
      // current particle object in that pass.
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
    animate();

    // Click to burst:
    // Creates extra particles around the user's click position.
    document.addEventListener('click', e => {
      // This for-loop creates exactly 8 temporary burst particles per click.
      for (let i = 0; i < 8; i++) {
        const p = new Particle();
        p.x = e.clientX + (Math.random() - 0.5) * 40;
        p.y = e.clientY + (Math.random() - 0.5) * 40;
        p.speedY = -(Math.random() * 2 + 1);
        p.speedX = (Math.random() - 0.5) * 2;
        p.opacity = 1;
        particles.push(p);
        // Prevents unlimited growth after many clicks. shift() removes the
        // oldest particle from the beginning of the array.
        if (particles.length > COUNT + 50) particles.shift();
      }
    });
  })();

  /* ================================================================
     SCROLL REVEAL (Intersection Observer)
  ================================================================ */
  // Selects all elements that should animate into view while scrolling.
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  // IntersectionObserver watches when selected elements enter the viewport.
  // This avoids manually calculating scroll positions on every scroll event.
  const observer = new IntersectionObserver((entries) => {
    // entries is an array of visibility-change records from the observer.
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Adding "visible" activates the CSS transition that moves/fades
        // the element into its final position.
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // forEach loop:
  // Attaches the observer to every reveal element found above.
  reveals.forEach(el => observer.observe(el));

  /* ================================================================
     HERO PREVIEW — 3D TILT ON MOUSE MOVE
  ================================================================ */
  // preview is the actual card whose CSS transform changes.
  const preview = document.querySelector('.hero-preview');

  // previewWrap is the larger area that listens for mouse movement.
  const previewWrap = document.querySelector('.hero-preview-wrap');
  if (previewWrap && preview) {
    previewWrap.addEventListener('mousemove', e => {
      // getBoundingClientRect() gives position and size of the hover area.
      const rect = previewWrap.getBoundingClientRect();

      // x and y become normalized mouse coordinates centered around 0.
      // Example: left side is negative, right side is positive.
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // This transform creates the 3D tilt. perspective() gives depth,
      // rotateY() tilts left/right, and rotateX() tilts up/down.
      preview.style.transform = `perspective(1200px) rotateY(${x * 12 - 4}deg) rotateX(${-y * 8 + 2}deg)`;
    });

    // On mouse leave, return the card to its original angled pose.
    previewWrap.addEventListener('mouseleave', () => {
      preview.style.transform = 'perspective(1200px) rotateY(-8deg) rotateX(4deg)';
    });
  }

  /* ================================================================
     ANIMATED NUMBER COUNTER (Stats)
  ================================================================ */
  // animateCounter() changes a number from 0 to its target gradually.
  // el is the element being updated, target is the final number, and suffix
  // adds symbols like "+" or "%".
  function animateCounter(el, target, suffix) {
    let count = 0;

    // step controls how much the number grows each interval. Dividing by 50
    // makes the animation finish in about 50 updates.
    const step = target / 50;

    // setInterval repeats the callback every 30 milliseconds until cleared.
    const timer = setInterval(() => {
      count += step;
      if (count >= target) { count = target; clearInterval(timer); }
      el.textContent = Math.floor(count).toLocaleString() + suffix;
    }, 30);
  }

  // This observer starts the counter animation only when the stats section
  // is visible, so users actually see the numbers counting upward.
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Finds all visible stat number containers.
        const items = entry.target.querySelectorAll('.stat-num');

        // Final counter values and suffixes in the same order as the HTML.
        const data = [
          { val: 10000, suf: '+' },
          { val: 6, suf: '' },
          { val: 99, suf: '%' }
        ];
        // forEach loop:
        // item is the current stat element, and i is its index number.
        // i is used to match each HTML stat with the correct data item.
        items.forEach((item, i) => {
          const teal = item.querySelector('.teal');
          if (teal && data[i]) animateCounter(teal, data[i].val, data[i].suf);
        });

        // Stop observing after the first run so counters do not restart
        // every time the user scrolls away and back.
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  // Finds the stats row and observes it if it exists on this page.
  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) statObserver.observe(statsEl);

  /* ================================================================
     CURSOR GLOW EFFECT
  ================================================================ */
  // Creates a new div for the radial cursor glow effect.
  const cursorGlow = document.createElement('div');

  // Object.assign copies all listed CSS properties into cursorGlow.style.
  // The glow is styled here because the element itself is created in JS.
  Object.assign(cursorGlow.style, {
    position: 'fixed', width: '300px', height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: '1',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.3s',
    left: '-999px', top: '-999px'
  });
  // Adds the glow div to the page so it can be seen.
  document.body.appendChild(cursorGlow);

  // Moves the glow to follow the mouse pointer.
  document.addEventListener('mousemove', e => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top  = e.clientY + 'px';
  });
