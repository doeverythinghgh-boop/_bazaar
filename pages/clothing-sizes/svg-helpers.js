/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function(window){
  "use strict";

  const svgNS = "http://www.w3.org/2000/svg";

  function clearSvgContainer(container) {
    container.innerHTML = '';
  }

  function addSvgText(parent, x, y, content, id, anchor = 'middle', fontSize = 12, fill = '#2c1e12') {
    const g = document.createElementNS(svgNS, "g");
    if (id) g.setAttribute('id', `textGroup-${id}`);

    const halo = document.createElementNS(svgNS, "text");
    halo.setAttribute('x', x); halo.setAttribute('y', y);
    if (id) halo.setAttribute('id', `textHalo-${id}`);
    halo.setAttribute('text-anchor', anchor);
    halo.setAttribute('font-size', fontSize); halo.setAttribute('font-family', 'Segoe UI, Cairo');
    halo.setAttribute('fill', 'white'); halo.setAttribute('stroke', 'white'); halo.setAttribute('stroke-width', '3');
    halo.setAttribute('font-weight', '700');
    halo.textContent = content;
    g.appendChild(halo);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute('x', x); text.setAttribute('y', y);
    if (id) text.setAttribute('id', id);
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('font-size', fontSize);
    text.setAttribute('font-family', 'Segoe UI, Cairo');
    text.setAttribute('fill', fill);
    text.setAttribute('font-weight', '700');
    text.textContent = content;
    g.appendChild(text);

    parent.appendChild(g);
    return g;
  }

  function addDimensionLine(parent, x1, y1, x2, y2, color = '#b35900', label = '', labelPos = 'middle', idPrefix = '') {
    const group = document.createElementNS(svgNS, "g");
    if (idPrefix) group.setAttribute('id', `dimensionGroup-${idPrefix}`);

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    if (idPrefix) line.setAttribute('id', `dimensionLine-${idPrefix}`);
    line.setAttribute('stroke', color); line.setAttribute('stroke-width', '2.2'); line.setAttribute('stroke-dasharray', '4,3');
    group.appendChild(line);

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 8;
    const arrowX = x2 - arrowSize * 0.6 * Math.cos(angle);
    const arrowY = y2 - arrowSize * 0.6 * Math.sin(angle);
    const poly = document.createElementNS(svgNS, "polygon");
    poly.setAttribute('id', `dimensionArrow-${idPrefix || Date.now()}`);
    poly.setAttribute('points', `${x2},${y2} ${arrowX - arrowSize*0.5*Math.sin(angle)},${arrowY + arrowSize*0.5*Math.cos(angle)} ${arrowX + arrowSize*0.5*Math.sin(angle)},${arrowY - arrowSize*0.5*Math.cos(angle)}`);
    poly.setAttribute('fill', color);
    group.appendChild(poly);

    if (label) {
      let midX = (x1 + x2) / 2; let midY = (y1 + y2) / 2;
      if (labelPos === 'above') midY -= 15; else if (labelPos === 'below') midY += 20;
      else if (labelPos === 'left') { midX -= 12; midY += 4; } else midY -= 8;
      addSvgText(group, midX, midY, label, idPrefix ? `text-${idPrefix}` : `textDim-${Date.now()}`, labelPos === 'left' ? 'end' : 'middle', 13, color);
    }
    parent.appendChild(group);
  }

  window.SvgHelpers = { clearSvgContainer, addSvgText, addDimensionLine, svgNS };
})(window);
