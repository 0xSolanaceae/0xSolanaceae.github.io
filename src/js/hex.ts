interface HexCell { r: number; b: number }

interface HexRow {
  hex: number[];
  ascii: string;
  addr?: string;
}

(() => {
  const svg = document.querySelector<SVGSVGElement>('.plate-svg');
  if (!svg) return;
  const root = svg;

  /** SVG elements do not get the typed addEventListener overloads that HTMLElement has. */
  function listen<K extends keyof GlobalEventHandlersEventMap>(
    el: Element, type: K, fn: (e: GlobalEventHandlersEventMap[K]) => void,
  ): void {
    el.addEventListener(type, fn as EventListener);
  }

  const FULL_BOX = root.getAttribute('viewBox') || '0 0 800 792';
  const COMPACT_BOX = '90 24 371 768';
  const COMPACT_ASC = 272;
  const narrow = matchMedia('(max-width: 720px)');
  const fitPlate = () => {
    const box = narrow.matches ? COMPACT_BOX : FULL_BOX;
    if (root.getAttribute('viewBox') !== box) {
      root.setAttribute('viewBox', box);
      for (const t of root.querySelectorAll('text.ascii')) {
        t.setAttribute('x', String(narrow.matches ? COMPACT_ASC : 601));
      }
      dispatchEvent(new Event('resize'));
    }
  };
  fitPlate();
  if ('addEventListener' in narrow) narrow.addEventListener('change', fitPlate);
  else (narrow as unknown as { addListener(fn: () => void): void }).addListener(fitPlate);

  const NS = 'http://www.w3.org/2000/svg';
  const CW = 6.9;
  const LH = 26;
  const ROW0 = 44;
  const ROWS = 28;
  const N = 24;
  const X_ADDR = 28;
  const X_HEX1 = 97;
  const X_HEX2 = 270;
  const X_ASC = 601;
  const BASE = 0xa2040;
  const CAP = 15;

  const cursor = root.querySelector<SVGGElement>('[data-hex]');
  if (!cursor) return;

  const hover = cursor.querySelector<SVGRectElement>('.hex-hover')!;
  const caretHex = cursor.querySelector<SVGRectElement>('.hex-caret')!;
  const caretAsc = cursor.querySelector<SVGRectElement>('.hex-caret-ascii')!;
  const status = root.querySelector<SVGElement>('.hex-status')!;
  const live = document.getElementById('hex-live');

  const selG = document.createElementNS(NS, 'g') as SVGGElement;
  selG.setAttribute('class', 'hex-sel');
  cursor.insertBefore(selG, cursor.firstChild);

  const rows: HexRow[] = [];
  const addrEls: SVGTextElement[] = [];
  for (let r = 0; r < ROWS; r++) rows.push({ hex: [], ascii: '' });

  for (const t of root.querySelectorAll('text')) {
    const x = Number(t.getAttribute('x'));
    const y = Number(t.getAttribute('y'));
    if (!(y >= ROW0)) continue;
    const r = Math.round((y - ROW0) / LH);
    if (r < 0 || r >= ROWS) continue;
    const txt = t.textContent ?? '';

    if (x === X_ADDR) { rows[r].addr = txt; addrEls[r] = t; }
    else if (x === X_HEX1 || x === X_HEX2) {
      for (const w of txt.trim().split(/\s+/)) rows[r].hex.push(parseInt(w, 16));
    } else if (x === X_ASC) rows[r].ascii = txt.replace(/\|/g, '');
  }

  const byteX = (b: number) => (b < 8 ? X_HEX1 + b * 3 * CW : X_HEX2 + (b - 8) * 3 * CW);
  const asciiX = (b: number) => X_ASC + (b + 1) * CW;
  const rowY = (r: number) => ROW0 + r * LH;

  const place = (el: SVGElement, x: number, w: number, r: number) => {
    el.setAttribute('x', x.toFixed(1));
    el.setAttribute('y', (rowY(r) - CAP + 3).toFixed(1));
    el.setAttribute('width', Math.max(0, w).toFixed(1));
    el.setAttribute('height', String(CAP));
  };

  const addrOf = (i: number) => '0x' + (BASE + i).toString(16).padStart(8, '0');
  const hexOf = (i: number) => {
    const v = rows[Math.floor(i / N)].hex[i % N];
    return Number.isFinite(v) ? v.toString(16).padStart(2, '0') : '--';
  };
  const charOf = (i: number) => rows[Math.floor(i / N)].ascii[i % N] || '.';

  const point = root.createSVGPoint();
  const toUser = (e: PointerEvent) => {
    point.x = e.clientX;
    point.y = e.clientY;
    return point.matrixTransform(root.getScreenCTM()!.inverse());
  };

  const cellAt = (u: DOMPoint): HexCell | null => {
    const r = Math.round((u.y - ROW0) / LH);
    if (r < 0 || r >= ROWS) return null;
    if (Math.abs(u.y - rowY(r)) > 13) return null;

    if (u.x >= X_HEX1 && u.x < X_HEX1 + 8 * 3 * CW) {
      const b = Math.floor((u.x - X_HEX1) / (3 * CW));
      return b >= 0 && b < 8 ? { r, b } : null;
    }
    if (u.x >= X_HEX2 && u.x < X_HEX2 + 16 * 3 * CW) {
      if (narrow.matches) return null;
      const b = 8 + Math.floor((u.x - X_HEX2) / (3 * CW));
      return b < N ? { r, b } : null;
    }
    if (u.x >= asciiX(0) && u.x < asciiX(0) + N * CW) {
      const b = Math.floor((u.x - asciiX(0)) / CW);
      return b >= 0 && b < N ? { r, b } : null;
    }
    return null;
  };

  let caret: HexCell | null = null;
  let anchor: HexCell | null = null;
  let dragging = false;

  const index = (c: HexCell) => c.r * N + c.b;
  const range = () => {
    if (!caret) return null;
    const a = anchor ? index(anchor) : index(caret);
    const c = index(caret);
    return { from: Math.min(a, c), to: Math.max(a, c) };
  };

  const say = (note?: string) => {
    const sel = range();
    let line = '';
    if (sel) {
      if (!anchor || sel.from === sel.to) {
        const i = sel.from;
        const ch = charOf(i);
        line = `${addrOf(i)}   ${hexOf(i)}   ${ch === ' ' ? 'space' : `'${ch}'`}   row ${Math.floor(i / N)} · byte ${i % N}`;
      } else {
        line = `${addrOf(sel.from)}–${addrOf(sel.to)}   ${sel.to - sel.from + 1} bytes   row ${Math.floor(sel.from / N)} · byte ${sel.from % N}`;
      }
    }
    if (note) line = note;
    status.textContent = line;
    status.classList.toggle('is-live', !!sel);
    if (live) live.textContent = line;
  };

  const drawSelection = () => {
    while (selG.firstChild) selG.removeChild(selG.firstChild);
    const sel = range();
    if (!sel || sel.from === sel.to) return;

    const rect = (cls: string, x: number, w: number, r: number) => {
      const el = document.createElementNS(NS, 'rect');
      if (cls) el.setAttribute('class', cls);
      place(el, x, w, r);
      selG.appendChild(el);
    };

    const r0 = Math.floor(sel.from / N);
    const r1 = Math.floor(sel.to / N);

    for (let r = r0; r <= r1; r++) {
      const b0 = r === r0 ? sel.from % N : 0;
      const b1 = r === r1 ? sel.to % N : N - 1;

      if (b0 <= 7) {
        const lo = Math.min(b0, 7);
        const hi = Math.min(b1, 7);
        rect('', byteX(lo), (hi - lo + 1) * 3 * CW - CW, r);
      }
      if (b1 >= 8) {
        const lo = Math.max(b0, 8);
        rect('', byteX(lo), (b1 - lo + 1) * 3 * CW - CW, r);
      }
      rect('sel-ascii', asciiX(b0), (b1 - b0 + 1) * CW, r);
    }
  };

  let marked: SVGTextElement | null = null;
  const markRow = () => {
    if (marked) marked.classList.remove('is-row');
    marked = null;
    if (!caret) return;
    const el = addrEls[caret.r];
    if (el) { el.classList.add('is-row'); marked = el; }
  };

  const drawCaret = () => {
    const on = !!caret;
    caretHex.style.display = on ? '' : 'none';
    caretAsc.style.display = on ? '' : 'none';
    if (!caret) return;
    place(caretHex, byteX(caret.b), 2 * CW, caret.r);
    place(caretAsc, asciiX(caret.b), CW, caret.r);
  };

  const update = (note?: string) => {
    drawSelection();
    drawCaret();
    markRow();
    say(note);
  };

  const setCaret = (cell: HexCell, keepAnchor: boolean) => {
    caret = cell;
    if (!keepAnchor) anchor = null;
    else if (!anchor) anchor = cell;
    update();
  };

  const copyText = (text: string, count: number) => {
    const done = () => {
      say(`copied ${count} byte${count === 1 ? '' : 's'}`);
      window.setTimeout(() => say(), 1200);
    };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {  }
      document.body.removeChild(ta);
      done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  };

  const copySelection = (asAscii: boolean) => {
    const sel = range();
    if (!sel) return;
    const parts: string[] = [];
    for (let i = sel.from; i <= sel.to; i++) parts.push(asAscii ? charOf(i) : hexOf(i));
    const text = asAscii ? parts.join('') : parts.join(' ');
    copyText(text, sel.to - sel.from + 1);
  };

  const clearHover = () => { hover.style.display = 'none'; };

  listen(root, 'pointermove', (e) => {
    const u = toUser(e);
    const cell = cellAt(u);

    if (dragging) {
      if (cell) setCaret(cell, true);
      return;
    }
    if (!cell) return clearHover();

    const overAscii = u.x >= asciiX(0);
    place(hover, overAscii ? byteX(cell.b) : asciiX(cell.b), overAscii ? 2 * CW : CW, cell.r);
    hover.style.display = '';
  });

  listen(root, 'pointerleave', () => { clearHover(); dragging = false; });

  listen(root, 'pointerdown', (e) => {
    const target = e.target as Element | null;
    if (target && target.closest('a')) return;
    const cell = cellAt(toUser(e));
    if (!cell) return;
    e.preventDefault();
    root.focus({ preventScroll: true });
    dragging = true;
    if (e.pointerId != null && root.setPointerCapture) {
      try { root.setPointerCapture(e.pointerId); } catch (err) {  }
    }
    anchor = cell;
    setCaret(cell, true);
    clearHover();
  });

  listen(root, 'pointerup', () => { dragging = false; });

  const stepBy = (d: number): HexCell => {
    if (!caret) return { r: 0, b: 0 };
    const i = Math.min(ROWS * N - 1, Math.max(0, index(caret) + d));
    return { r: Math.floor(i / N), b: i % N };
  };

  listen(root, 'keydown', (e) => {
    const extend = e.shiftKey;
    const k = e.key;

    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'C')) {
      e.preventDefault();
      copySelection(!!extend);
      return;
    }

    if (k === 'ArrowRight') setCaret(stepBy(1), extend);
    else if (k === 'ArrowLeft') setCaret(stepBy(-1), extend);
    else if (k === 'ArrowDown') setCaret(stepBy(N), extend);
    else if (k === 'ArrowUp') setCaret(stepBy(-N), extend);
    else if (k === 'Home') setCaret({ r: caret ? caret.r : 0, b: 0 }, extend);
    else if (k === 'End') setCaret({ r: caret ? caret.r : 0, b: N - 1 }, extend);
    else if (k === 'Escape') {
      const sel = range();
      if (anchor && sel && sel.from !== sel.to) { anchor = null; update(); }
      else { caret = null; anchor = null; update(); }
      e.preventDefault();
      return;
    } else {
      return;
    }
    e.preventDefault();
  });

  listen(status, 'pointerdown', (e) => {
    e.preventDefault();
    copySelection(e.shiftKey);
  });

  update();
})();
