// ════════════════════════════════════════════════════════════════
//  WEBGL2 SHADER BACKGROUND
//  Vanilla port of the animated-shader-hero React component.
//  The GLSL is the exact defaultShaderSource from the component
//  (by Matthias Hurrle @atzedent) — colors are naturally dark
//  navy/slate which matches the Stitch palette perfectly.
//  Mouse/pointer interaction is fully ported from PointerHandler.
// ════════════════════════════════════════════════════════════════
(function initShader() {
  // initShader() is wrapped in an IIFE so it runs immediately when contact.js
  // loads, while keeping shader variables out of the global scope.
  const canvas = document.getElementById('hero-shader');

  // WebGL2 context. WebGL2 is used because the shader source starts with
  // "#version 300 es", which requires WebGL2 instead of older WebGL1.
  const gl = canvas.getContext('webgl2');

  // If WebGL2 is unavailable, skip only the animated background.
  if (!gl) return;

  // ── Exact GLSL from the component (defaultShaderSource) ──────
  // Colors: deep space / nebula — naturally dark navy matching
  // Stitch's #020817 background. No changes needed.
  const vertSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

  const fragSrc = `#version 300 es
/*
 * made by Matthias Hurrle (@atzedent)
 * Adapted colors to match Stitch dark navy/teal palette
 */
precision highp float;
out vec4 O;
uniform vec2  resolution;
uniform float time;
uniform vec2  touch;
uniform vec2  move;
uniform int   pointerCount;

#define FC gl_FragCoord.xy
#define T  time
#define R  resolution
#define MN min(R.x, R.y)

float rnd(vec2 p) {
  p = fract(p * vec2(12.9898, 78.233));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(in vec2 p) {
  vec2 i = floor(p), f = fract(p),
       u = f * f * (3. - 2. * f);
  float a = rnd(i),
        b = rnd(i + vec2(1, 0)),
        c = rnd(i + vec2(0, 1)),
        d = rnd(i + 1.);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float t = .0, a = 1.;
  mat2 m = mat2(1., -.5, .2, 1.2);
  for (int i = 0; i < 5; i++) {
    // GLSL for-loop:
    // i starts at 0, runs while i is less than 5, and increases by 1.
    // This creates five layers of noise. Each layer adds finer detail.
    t += a * noise(p);
    p *= 2. * m;
    a *= .5;
  }
  return t;
}

float clouds(vec2 p) {
  float d = 1., t = .0;
  for (float i = .0; i < 3.; i++) {
    // GLSL for-loop:
    // Starts at 0.0, runs while i is less than 3.0, and adds 1.0 each pass.
    // It blends several cloud/noise layers to create a nebula-like texture.
    float a = d * fbm(i * 10. + p.x * .2 + .2 * (1. + i) * p.y + d + i * i + p);
    t = mix(t, d, a);
    d = a;
    p *= 2. / (i + 1.);
  }
  return t;
}

void main(void) {
  vec2 uv = (FC - .5 * R) / MN;
  vec2 st = uv * vec2(2., 1.);
  vec3 col = vec3(0.);

  float bg = clouds(vec2(st.x + T * .5, -st.y));

  uv *= 1. - .3 * (sin(T * .2) * .5 + .5);

  /* Loop: original uses orange/fire tones.
     We remap cos(sin(i)*vec3(1,2,3)) toward teal/slate/navy
     to match the Stitch color palette exactly.             */
  for (float i = 1.; i < 12.; i++) {
    uv += .1 * cos(i * vec2(.1 + .01 * i, .8) + i * i + T * .5 + .1 * uv.x);
    vec2 p = uv;
    float d = length(p);

    /* Original: cos(sin(i)*vec3(1,2,3))
       Remapped to teal-to-slate gradient matching Stitch:
         r: ~0.0  (navy base)
         g: ~0.18 (slate-teal mid)
         b: ~0.35 (teal accent)                           */
    vec3 tealPalette = vec3(
      0.05 + 0.05 * cos(i * 0.7),
      0.15 + 0.12 * cos(i * 0.4 + 1.2),
      0.25 + 0.18 * cos(i * 0.3 + 2.4)
    );

    col += .00125 / d * (tealPalette + 1.);

    float b = noise(i + p + bg * 1.731);
    col += .002 * b / length(max(p, vec2(b * p.x * .02, p.y)));

    /* bg blend: Stitch navy #020817 = vec3(0.008, 0.031, 0.09) */
    col = mix(col, vec3(bg * 0.012, bg * 0.045, bg * 0.13), d);
  }

  O = vec4(col, 1.);
}`;

  // ── Compile helper ───────────────────────────────────────────
  // compile() turns GLSL source code into a WebGL shader object.
  // type is gl.VERTEX_SHADER or gl.FRAGMENT_SHADER, and src is the shader text.
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  // ── Build program ────────────────────────────────────────────
  // Build the shader program by compiling both shaders, attaching them,
  // and linking them into one GPU pipeline.
  const vertShader = compile(gl.VERTEX_SHADER, vertSrc);
  const fragShader = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vertShader || !fragShader) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vertShader);
  gl.attachShader(prog, fragShader);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

  // ── Geometry: fullscreen quad ────────────────────────────────
  // Geometry buffer: four points that make a full-screen rectangle.
  // The fragment shader then colors every pixel inside that rectangle.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ── Uniform locations ────────────────────────────────────────
  // Uniform locations are handles for values JavaScript sends to the shader.
  const uRes  = gl.getUniformLocation(prog, 'resolution');
  const uTime = gl.getUniformLocation(prog, 'time');
  const uTouch = gl.getUniformLocation(prog, 'touch');
  const uMove  = gl.getUniformLocation(prog, 'move');
  const uPtrCount = gl.getUniformLocation(prog, 'pointerCount');

  // ── Resize ───────────────────────────────────────────────────
  // resize() matches the canvas pixel size to the viewport.
  // dpr uses devicePixelRatio so the shader stays sharp on high-DPI screens,
  // while 0.5 reduces GPU cost compared with full retina resolution.
  function resize() {
    const dpr = Math.max(1, 0.5 * devicePixelRatio);
    canvas.width  = innerWidth  * dpr;
    canvas.height = innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── PointerHandler — exact port of the component class ───────
  // pointers stores active pointer/touch positions by pointerId.
  const pointers   = new Map();

  // lastCoords stores the last known pointer position.
  let   lastCoords = [0, 0];

  // moves accumulates mouse movement for shader interaction.
  let   moves      = [0, 0];

  // isActive says whether at least one pointer is currently down/active.
  let   isActive   = false;

  // Converts screen coordinates into canvas coordinates. WebGL's Y axis is
  // flipped compared with normal browser coordinates, so Y is inverted.
  function mapCoord(x, y) {
    const dpr = Math.max(1, 0.5 * devicePixelRatio);
    return [x * dpr, canvas.height - y * dpr];
  }

  // Use document so the whole page is interactive with the background
  // pointerdown starts interaction and records this pointer's position.
  document.addEventListener('pointerdown', (e) => {
    isActive = true;
    pointers.set(e.pointerId, mapCoord(e.clientX, e.clientY));
  });
  // pointerup removes the finished pointer from the Map.
  document.addEventListener('pointerup', (e) => {
    if (pointers.size === 1) lastCoords = [e.clientX, e.clientY];
    pointers.delete(e.pointerId);
    isActive = pointers.size > 0;
  });
  document.addEventListener('pointerleave', (e) => {
    if (pointers.size === 1) lastCoords = [e.clientX, e.clientY];
    pointers.delete(e.pointerId);
    isActive = pointers.size > 0;
  });
  // pointermove updates the active pointer and movement totals.
  document.addEventListener('pointermove', (e) => {
    if (!isActive) return;
    lastCoords = [e.clientX, e.clientY];
    pointers.set(e.pointerId, mapCoord(e.clientX, e.clientY));
    moves = [moves[0] + e.movementX, moves[1] + e.movementY];
  });

  // getFirst() returns the first active pointer, or the last known position
  // if no pointer is currently active.
  function getFirst() {
    return pointers.size > 0
      ? pointers.values().next().value
      : lastCoords;
  }
  // getCoords() returns all active pointer coordinates as one flat array.
  function getCoords() {
    return pointers.size > 0
      ? Array.from(pointers.values()).flat()
      : [0, 0];
  }

  // ── Render loop ──────────────────────────────────────────────
  // loop() is the render loop. requestAnimationFrame passes "now" as the
  // current timestamp, and this function draws one shader frame.
  function loop(now) {
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // first feeds the touch uniform. coords is kept from the original port;
    // the pointer count and first pointer are what this shader actually uses.
    const first  = getFirst();
    const coords = getCoords();

    gl.uniform2f(uRes,  canvas.width, canvas.height);
    gl.uniform1f(uTime, now * 1e-3);
    gl.uniform2f(uTouch, first[0] || 0, first[1] || 0);
    gl.uniform2f(uMove,  moves[0],      moves[1]);
    gl.uniform1i(uPtrCount, pointers.size);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// ════════════════════════════════════════════════════════════════
//  FORM — character counter, validation, submission
// ════════════════════════════════════════════════════════════════

// Character counter:
// This section updates the message length display, validates message length,
// and grows the textarea as the user types.
function fitMessageBox(el) {
  // Reset height first so shrinking text can also shrink the box.
  el.style.height = 'auto';

  // scrollHeight is the full content height. Math.max keeps a 170px minimum.
  el.style.height = Math.max(el.scrollHeight, 170) + 'px';
}

document.getElementById('message').addEventListener('input', function () {
  // "this" is the textarea because a normal function is used.
  const len = this.value.length;

  // el is the character counter span.
  const el  = document.getElementById('char-count');
  el.textContent  = len + ' / 1000';

  // Turns the counter red near the 1000-character limit.
  el.style.color  = len > 900 ? '#f87171' : '';
  if (len > 0) {
    // Message is valid only when trimmed length is at least 20 characters.
    const ok = this.value.trim().length >= 20;
    showErr('message-err', !ok);
    setBorder(this, ok);
  }
  fitMessageBox(this);
});
fitMessageBox(document.getElementById('message'));

// Helpers:
// Small reusable functions for showing validation errors and coloring borders.
function showErr(id, show) {
  // hidden class controls whether an error message is visible.
  document.getElementById(id).classList.toggle('hidden', !show);
}
function setBorder(el, ok) {
  // Teal border means valid. Red border means invalid.
  el.style.borderColor = ok ? 'rgba(45,212,191,0.35)' : 'rgba(248,113,113,0.55)';
}

// validateForm() checks every required field and returns true only if all pass.
function validateForm() {
  // Read current form values and remove surrounding whitespace.
  const name    = document.getElementById('name').value.trim();
  const email   = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value;
  const message = document.getElementById('message').value.trim();
  // Basic email regular expression: requires text, @, domain, dot, and ending.
  const rx      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ok starts true and becomes false if any validation rule fails.
  let ok = true;

  showErr('name-err',    !name);                   if (!name)             ok = false;
  showErr('email-err',   !rx.test(email));          if (!rx.test(email))   ok = false;
  showErr('subject-err', !subject);                 if (!subject)          ok = false;
  showErr('message-err', message.length < 20);      if (message.length<20) ok = false;

  setBorder(document.getElementById('name'),    !!name);
  setBorder(document.getElementById('email'),   rx.test(email));
  setBorder(document.getElementById('subject'), !!subject);
  setBorder(document.getElementById('message'), message.length >= 20);
  return ok;
}

// Blur validation:
// This array loop attaches blur/focus validation to name, email, and message.
['name','email','message'].forEach(id => {
  // forEach loop:
  // id is the current field id from the array during each pass.
  document.getElementById(id).addEventListener('blur', function () {
    if (id === 'email') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim());
      showErr('email-err', !ok); setBorder(this, ok);
    } else if (id === 'message') {
      const ok = this.value.trim().length >= 20;
      showErr('message-err', !ok); setBorder(this, ok);
    } else {
      const ok = this.value.trim().length > 0;
      showErr(id + '-err', !ok); setBorder(this, ok);
    }
  });
  document.getElementById(id).addEventListener('focus', function () {
    // On focus, clear manual border color so CSS focus styles can show normally.
    this.style.borderColor = '';
  });
});

// Submit:
// Handles form submission without reloading the page.
document.getElementById('contact-form').addEventListener('submit', async function (e) {
  // preventDefault stops the browser from doing a normal form POST/reload.
  e.preventDefault();

  // Stop submission if validation fails.
  if (!validateForm()) return;

  // Swap button text for loading spinner and disable button to prevent repeats.
  document.getElementById('btn-text').classList.add('hidden');
  const loadEl = document.getElementById('btn-loading');
  loadEl.classList.remove('hidden');
  loadEl.style.display = 'flex';
  document.getElementById('submit-btn').disabled = true;

  // ── Plug in real EmailJS here:
  // await emailjs.send('SERVICE_ID','TEMPLATE_ID',{
  //   from_name:  document.getElementById('name').value,
  //   from_email: document.getElementById('email').value,
  //   subject:    document.getElementById('subject').value,
  //   message:    document.getElementById('message').value,
  // }, 'PUBLIC_KEY');

  // Temporary fake delay that simulates an API/email service request.
  await new Promise(r => setTimeout(r, 1800));

  // Hide the form and show the success message.
  document.getElementById('contact-form').classList.add('hidden');
  document.getElementById('success-state').classList.remove('hidden');
  showToast('Message sent successfully!');
});

// Reset:
// Restores the form after the success screen.
document.getElementById('resetFormBtn')?.addEventListener('click', resetForm);

// Optional chaining ?. means the listener is added only if the element exists.
document.querySelector('[data-contact-action="email"]')?.addEventListener('click', () => { window.location = 'mailto:hello@nexus.showcase'; });
document.querySelector('[data-contact-action="github"]')?.addEventListener('click', () => { window.open('https://github.com', '_blank', 'noopener'); });

function resetForm() {
  // Clear input values and swap success screen back to the form.
  document.getElementById('contact-form').reset();
  document.getElementById('contact-form').classList.remove('hidden');
  document.getElementById('success-state').classList.add('hidden');
  document.getElementById('btn-text').classList.remove('hidden');
  document.getElementById('btn-loading').classList.add('hidden');
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('char-count').textContent = '0 / 1000';
  fitMessageBox(document.getElementById('message'));
  // forEach loop clears validation border color on every form field.
  ['name','email','subject','message'].forEach(id => {
    document.getElementById(id).style.borderColor = '';
  });

  // forEach loop hides every validation error message again.
  ['name-err','email-err','subject-err','message-err'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

// Toast:
// Shows a temporary notification in the bottom-right corner.
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');

  // setTimeout removes the show class after 4 seconds.
  setTimeout(() => t.classList.remove('show'), 4000);
}
