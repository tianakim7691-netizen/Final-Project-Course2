/* ===============================
   script.js  (Tiana Portfolio)
   =============================== */

/* ========== HERO TYPED ========== */
(() => {
  const heroPre = document.querySelector('.hero pre');
  if (!heroPre) return;

  const FINAL_HTML = `
<span class="token-selector">.portfolio</span> <span class="token-brace">{</span><br>
&nbsp;&nbsp;<span class="token-key">owner</span>: "<span class="token-str">Tiana Kim</span>";<br>
&nbsp;&nbsp;<span class="token-key">root</span>: "<span class="token-role">Designer</span>";<br>
&nbsp;&nbsp;<span class="token-key">skills</span>: <a href="#" class="token-skill">Graphic</a>, <a href="#" class="token-skill">Packaging</a>, <a href="#" class="token-skill">Photoshoot</a>, <a href="#" class="token-skill">UI</a>, <a href="#" class="token-skill">Illustration</a>, <a href="work.html" class="token-skill">Web</a>;<br>
&nbsp;&nbsp;<span class="token-key">secondary</span>: <span class="token-sec">JavaScript</span>, <span class="token-sec">CSS</span>, <span class="token-sec">HTML</span>, <span class="token-sec">Figma</span>;<br>
<span class="token-brace">}</span>
`;

  function measureHtml(html, refEl) {
    const s = document.createElement('pre');
    const cs = getComputedStyle(refEl);
    Object.assign(s.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'pre',
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing
    });
    s.innerHTML = html;
    document.body.appendChild(s);
    const rect = s.getBoundingClientRect();
    s.remove();
    return { w: rect.width, h: rect.height };
  }

  const { w, h } = measureHtml(FINAL_HTML, heroPre);
  heroPre.style.display = 'inline-block';
  heroPre.style.width = Math.ceil(w) + 'px';
  heroPre.style.minHeight = Math.ceil(h) + 'px';

  // typed.js
  if (window.Typed) {
    new Typed("#typed-code", {
      strings: [FINAL_HTML],
      typeSpeed: 20,
      backSpeed: 0,
      showCursor: true,
      cursorChar: "_",
      loop: false
    });
  }
})();

/* ========== HOVER CAROUSEL (optional on pages that include it) ========== */
(() => {
  const viewport = document.getElementById('carousel');
  const track    = document.getElementById('track');
  if (!viewport || !track) return;

  // ---- 설정 ----
  const IMG_COUNT  = 18;
  const IMG_SRC    = (i) => `assets/${i}.svg`;
  const LINK_HREF  = (i) => `detail${i}.html`;
  const EDGE_ZONE  = 120;
  const BASE_SPEED = 600;
  const GAP        = 16;
  const PADDING_X  = 0;

  // ---- 상태 ----
  let segmentWidth = 0;
  let offsetX = 0;
  let dir = 0;
  let hovering = false;
  let lastTs = 0;
  let rafId = null;

  const originals = [];

  // 1) 원본 카드
  for (let i = 1; i <= IMG_COUNT; i++) {
    const a = document.createElement('a');
    a.className = 'item';
    a.href = LINK_HREF(i);
    a.setAttribute('aria-label', `Open image ${i}`);

    const img = document.createElement('img');
    img.src = IMG_SRC(i);
    img.alt = `image ${i}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = i <= 3 ? 'high' : 'low';

    a.appendChild(img);
    originals.push(a);
  }

  // 2) 세그먼트 3세트
  function appendSegment() {
    originals.forEach((node) => track.appendChild(node.cloneNode(true)));
  }
  appendSegment(); appendSegment(); appendSegment();

  // 3) 측정 + 가운데 세그먼트에서 시작
  function applyTransform() {
    track.style.transform = `translate3d(${offsetX}px,0,0)`;
  }
  function measureAndCenter() {
    const first = track.children[0];
    if (!first) return;
    const cardW = first.getBoundingClientRect().width;
    segmentWidth = (IMG_COUNT * cardW) + ((IMG_COUNT - 1) * GAP) + (PADDING_X * 2);
    offsetX = -segmentWidth; // 가운데 세그먼트
    applyTransform();
  }
  window.addEventListener('load', measureAndCenter);
  window.addEventListener('resize', () => {
    const ratio = (Math.abs(offsetX) % segmentWidth) / segmentWidth;
    measureAndCenter();
    offsetX = -segmentWidth - ratio * segmentWidth;
    applyTransform();
  });

  // 4) 커서 위치로 방향 결정
  viewport.addEventListener('mouseenter', () => (hovering = true));
  viewport.addEventListener('mouseleave', () => { hovering = false; dir = 0; });

  viewport.addEventListener('mousemove', (e) => {
    const rect = viewport.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ease = (t) => Math.pow(Math.min(1, Math.max(0, t)), 1.5);
    if (x < EDGE_ZONE) {
      const ratio = 1 - x / EDGE_ZONE;
      dir = -ease(ratio);
    } else if (x > rect.width - EDGE_ZONE) {
      const ratio = (x - (rect.width - EDGE_ZONE)) / EDGE_ZONE;
      dir = ease(ratio);
    } else {
      dir = 0;
    }
  });

  // 5) 루프 보정
  function normalizeLoop() {
    if (offsetX <= -2 * segmentWidth) offsetX += segmentWidth;
    else if (offsetX >= 0) offsetX -= segmentWidth;
  }

  // 6) 애니메이션 루프
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (hovering && dir !== 0) {
      const delta = dir * BASE_SPEED * dt;
      offsetX -= delta;
      normalizeLoop();
      applyTransform();
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
})();

/* ========== WORK PAGE (grid + pagination + tag filter) ========== */
(() => {
  const worksSection = document.getElementById('works');
  const grid  = document.getElementById('work-grid');
  const pager = document.getElementById('work-pager');
  const tags  = document.getElementById('work-tags');
  if (!worksSection || !grid || !pager || !tags) return;

  // ===== 설정 =====
  const PER_PAGE = 6;
  const EXT = 'svg'; // 필요하면 'png' / 'jpg' 로 바꾸세요
  const IMG  = (i) => `assets/${i}.${EXT}`;
  const LINK = (i) => `detail${i}.html`;
  const TOTAL = 18;

  // 더미 데이터
  const TAGS = ['Graphic','Photography','Packaging','Web','Illustration','UI'];
  const DATA = Array.from({ length: TOTAL }, (_, k) => {
    const id = k + 1;
    return { id, src: IMG(id), href: LINK(id), title: `Work ${id}`, tag: TAGS[id % TAGS.length] };
  });

  // 상태
  let currentTag  = 'all';
  let currentPage = 1;

  // 유틸
  const filterByTag = (list, tag) => tag === 'all' ? list : list.filter(v => v.tag === tag);
  const pageSlice   = (list, page, per) => list.slice((page - 1) * per, page * per);

  // Lazy-load: viewport 기준으로 관찰(가장 안정적)
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset && img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        obs.unobserve(img);
      });
    },
    { root: null, rootMargin: '400px' }
  );

  // 렌더: 카드
  function renderGrid() {
    const list  = filterByTag(DATA, currentTag);
    const items = pageSlice(list, currentPage, PER_PAGE);

    const html = items.map(item => `
      <a href="${item.href}" class="group block overflow-hidden ">
        <div class="thumb">
          <img
            data-src="${item.src}"
            alt="${item.title}"
            loading="lazy"
            decoding="async"
          />
        </div>
      </a>
    `).join('');

    grid.innerHTML = html;
    grid.querySelectorAll('img[data-src]').forEach(img => io.observe(img));
  }

  // 렌더: 페이지네이션
  function renderPager() {
    const list = filterByTag(DATA, currentTag);
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);

    const btn = (label, page, { active=false, disabled=false } = {}) => `
      <button
        data-page="${page}"
        class="${active ? 'is-active text-orange-500' : 'text-gray-200 hover:text-white'} ${disabled ? 'is-disabled' : ''}">
        ${label}
      </button>
    `;

    let nums = '';
    for (let p = 1; p <= totalPages; p++) nums += btn(p, p, { active: p === currentPage });

    pager.innerHTML = `
      ${btn('‹', currentPage - 1, { disabled: currentPage === 1 })}
      ${nums}
      ${btn('›', currentPage + 1, { disabled: currentPage === totalPages })}
    `;
  }

  // 이벤트: 페이지 클릭
  pager.addEventListener('click', (e) => {
    const el = e.target.closest('button[data-page]');
    if (!el || el.classList.contains('is-disabled')) return;
    currentPage = parseInt(el.dataset.page, 10);
    renderGrid();
    renderPager();
    worksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // 이벤트: 태그 클릭 (활성 스타일 토글)
  (() => {
    const tagButtons = tags.querySelectorAll('.tag-btn');
    tagButtons.forEach(b => b.classList.remove('active', 'text-orange-400'));
    const def = tags.querySelector('.tag-btn[data-tag="all"]');
    if (def) def.classList.add('active', 'text-orange-400');

    tagButtons.forEach(btn => {
      btn.setAttribute('type', 'button');
      btn.addEventListener('click', () => {
        currentTag  = btn.dataset.tag;
        currentPage = 1;
        tagButtons.forEach(b => b.classList.remove('active', 'text-orange-400'));
        btn.classList.add('active', 'text-orange-400');
        renderGrid();
        renderPager();
      });
    });
  })();

  // 초기 렌더
  renderGrid();
  renderPager();
})();
