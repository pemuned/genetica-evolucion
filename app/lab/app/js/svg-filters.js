(function injectSvgFilters() {
  if (typeof document === "undefined") {
    return;
  }

  var hasHandDrawn = document.getElementById("hand-drawn-filter");
  var hasSprayNoise = document.getElementById("spray-noise");
  var hasSprayHandDrawn = document.getElementById("spray-hand-drawn");

  if (hasHandDrawn && hasSprayNoise && hasSprayHandDrawn) {
    return;
  }

  var container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.setAttribute("width", "0");
  container.setAttribute("height", "0");
  container.setAttribute("aria-hidden", "true");
  container.setAttribute("focusable", "false");
  container.setAttribute(
    "style",
    "position:absolute; left:-9999px; overflow:hidden;",
  );

  container.innerHTML = [
    "<defs>",
    '  <filter id="hand-drawn-filter" x="-20%" y="-20%" width="140%" height="140%">',
    '    <feTurbulence id="prefix__turb" type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="2" result="turb">',
    '      <animate attributeName="seed" from="2" to="20" dur="4s" repeatCount="indefinite"></animate>',
    "    </feTurbulence>",
    '    <feDisplacementMap in2="turb" in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>',
    "    <feComponentTransfer>",
    '      <feFuncR type="table" tableValues="0 0.5 1"></feFuncR>',
    '      <feFuncG type="table" tableValues="0 0.5 1"></feFuncG>',
    '      <feFuncB type="table" tableValues="0 0.5 1"></feFuncB>',
    '      <feFuncA type="table" tableValues="0 0.5 1"></feFuncA>',
    "    </feComponentTransfer>",
    '    <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix>',
    '    <feComposite in2="SourceGraphic" operator="in"></feComposite>',
    "  </filter>",
    '  <filter id="spray-noise">',
    '    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="12" result="noise"></feTurbulence>',
    '    <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 30 -15"></feColorMatrix>',
    "  </filter>",
    '  <filter id="spray-hand-drawn" x="-20%" y="-20%" width="140%" height="140%">',
    '    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="12" result="sprayNoiseField"></feTurbulence>',
    '    <feColorMatrix in="sprayNoiseField" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 30 -15" result="sprayMask"></feColorMatrix>',
    '    <feTurbulence id="sprayHandDrawnTurb" type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="2" result="wobbleField">',
    '      <animate attributeName="seed" from="2" to="20" dur="4s" repeatCount="indefinite"></animate>',
    "    </feTurbulence>",
    '    <feDisplacementMap in="SourceGraphic" in2="wobbleField" scale="8.5" xChannelSelector="R" yChannelSelector="G" result="wobbledGraphic"></feDisplacementMap>',
    '    <feComposite in="sprayMask" in2="wobbledGraphic" operator="in"></feComposite>',
    "  </filter>",
    "</defs>",
  ].join("");

  var target = document.body || document.documentElement;
  if (target.firstChild) {
    target.insertBefore(container, target.firstChild);
  } else {
    target.appendChild(container);
  }
})();
