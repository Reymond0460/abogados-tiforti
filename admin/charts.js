'use strict';
/* Gráficos SVG sin librerías: barras (simples y apiladas) y pastel (donut). */
window.AdminCharts = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#0e3b83', '#0077b4', '#7fb6dd', '#c98a00', '#2a8f7a', '#8a95a5'];
  const el = (tag, attrs, text) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (text != null) e.textContent = text;
    return e;
  };
  const svg = (w, h, label) => el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label, class: 'chart', preserveAspectRatio: 'xMidYMid meet' });
  const niceMax = (m) => { if (m <= 4) return 4; const step = Math.ceil(m / 4); return step * 4; };

  /* labels: [string]; series: [{name, color, values:[n]}] (apilado si hay más de una) */
  function bars({ labels, series, label }) {
    const W = 360, H = 230, L = 30, R = 8, T = 18, B = 30;
    const s = svg(W, H, label);
    const totals = labels.map((_, i) => series.reduce((a, x) => a + x.values[i], 0));
    const max = niceMax(Math.max(0, ...totals)), plotH = H - T - B, plotW = W - L - R;
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, y = T + plotH - (plotH * v) / max;
      s.append(el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid' }), el('text', { x: L - 6, y: y + 4, class: 'axis', 'text-anchor': 'end' }, String(v)));
    }
    const slot = plotW / labels.length, bw = Math.min(48, slot * 0.6);
    labels.forEach((lab, i) => {
      const x = L + slot * i + (slot - bw) / 2; let acc = 0;
      series.forEach((sr, k) => {
        const v = sr.values[i]; if (!v) return;
        const h = (plotH * v) / max, y = T + plotH - (plotH * (acc + v)) / max; acc += v;
        s.append(el('rect', { x, y, width: bw, height: h, fill: sr.color || COLORS[k], rx: 2 }));
        if (series.length > 1 && h >= 16) s.append(el('text', { x: x + bw / 2, y: y + h / 2 + 4, class: 'bar-in', 'text-anchor': 'middle' }, String(v)));
      });
      if (totals[i]) s.append(el('text', { x: x + bw / 2, y: T + plotH - (plotH * totals[i]) / max - 5, class: 'bar-top', 'text-anchor': 'middle' }, String(totals[i])));
      s.append(el('text', { x: x + bw / 2, y: H - 10, class: 'axis', 'text-anchor': 'middle' }, lab));
    });
    return s;
  }

  /* items: [{label, value, color}] */
  function donut({ items, label }) {
    const S = 180, c = S / 2, r = 72, ri = 44;
    const s = svg(S, S, label), total = items.reduce((a, x) => a + x.value, 0);
    if (!total) { s.append(el('circle', { cx: c, cy: c, r: (r + ri) / 2, fill: 'none', stroke: '#e3e6ec', 'stroke-width': r - ri })); s.append(el('text', { x: c, y: c + 5, class: 'donut-n', 'text-anchor': 'middle' }, '0')); return s; }
    const pt = (rad, a) => [c + rad * Math.cos(a), c + rad * Math.sin(a)];
    let a0 = -Math.PI / 2;
    items.filter((x) => x.value > 0).forEach((it) => {
      const frac = it.value / total;
      if (frac >= 0.9999) { s.append(el('circle', { cx: c, cy: c, r: (r + ri) / 2, fill: 'none', stroke: it.color, 'stroke-width': r - ri })); return; }
      const a1 = a0 + frac * Math.PI * 2, big = frac > 0.5 ? 1 : 0;
      const [x0, y0] = pt(r, a0), [x1, y1] = pt(r, a1), [x2, y2] = pt(ri, a1), [x3, y3] = pt(ri, a0);
      s.append(el('path', { d: `M${x0} ${y0}A${r} ${r} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${ri} ${ri} 0 ${big} 0 ${x3} ${y3}Z`, fill: it.color, stroke: '#fff', 'stroke-width': 2 }));
      a0 = a1;
    });
    s.append(el('text', { x: c, y: c + 2, class: 'donut-n', 'text-anchor': 'middle' }, String(total)), el('text', { x: c, y: c + 20, class: 'axis', 'text-anchor': 'middle' }, 'total'));
    return s;
  }
  return { bars, donut, COLORS };
})();
