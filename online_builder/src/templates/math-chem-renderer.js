<script>
(function () {
  if (window.__ankiMathChemConfigured) return;
  window.__ankiMathChemConfigured = true;

  window.MathJax = {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"], ["$$", "$$"]],
      packages: {"[+]": ["mhchem"]},
      processEscapes: true
    },
    loader: {
      load: ["[tex]/mhchem"]
    },
    options: {
      skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"]
    },
    startup: {
      typeset: true
    }
  };
})();
</script>
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
