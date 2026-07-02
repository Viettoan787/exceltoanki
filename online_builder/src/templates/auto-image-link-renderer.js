<script>
(function () {
  var URL_OR_ID = /(https?:\/\/[^\s<>"']+|[A-Za-z0-9_-]{25,})/g;
  var DIRECT_IMAGE = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;

  function trimUrl(value) {
    return String(value || "").replace(/[)\].,;:]+$/g, "");
  }

  function driveIdFrom(value) {
    var text = String(value || "");
    var match = text.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    if (match) return match[1];
    match = text.match(/[?&]id=([A-Za-z0-9_-]+)/);
    if (match) return match[1];
    if (/^[A-Za-z0-9_-]{25,}$/.test(text) && !/^https?:\/\//i.test(text)) return text;
    return "";
  }

  function imageSrcFrom(value) {
    var text = trimUrl(value);
    var driveId = driveIdFrom(text);
    if (driveId) return "https://drive.google.com/thumbnail?id=" + driveId + "&sz=w1200";
    if (DIRECT_IMAGE.test(text)) return text;
    return "";
  }

  function makeImage(src) {
    var img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    return img;
  }

  function replaceTextNode(node) {
    var text = node.nodeValue || "";
    URL_OR_ID.lastIndex = 0;
    if (!URL_OR_ID.test(text)) return;

    URL_OR_ID.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0;
    var changed = false;
    var match;

    while ((match = URL_OR_ID.exec(text)) !== null) {
      var token = trimUrl(match[0]);
      var src = imageSrcFrom(token);
      if (!src) continue;

      if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      frag.appendChild(makeImage(src));
      changed = true;
      last = match.index + match[0].length;
    }

    if (!changed) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function walkText(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.nodeName.toLowerCase();
        if (tag === "script" || tag === "style" || tag === "a") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }

  function renderImageLinks() {
    var roots = document.querySelectorAll(".image-area, .case-explain, #note, #extra, .content");
    Array.prototype.forEach.call(roots, walkText);
  }

  function installZoom() {
    if (window.__ankiZoomV2Installed) return;
    window.__ankiZoomV2Installed = true;

    function closeOverlay(overlay) {
      try { document.body.classList.remove("no-scroll"); } catch (e) {}
      overlay.remove();
    }

    document.addEventListener("click", function (e) {
      var img = e.target.closest(".image-area img, .case-explain img, #note img, #extra img, .content img, .imgbox img, .image-container img");
      if (!img) return;

      var overlay = document.createElement("div");
      overlay.className = "img-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-label", "Image zoom");

      var inner = document.createElement("div");
      inner.className = "img-overlay-inner";

      var zoomImg = document.createElement("img");
      zoomImg.src = img.src;
      zoomImg.alt = img.alt || "zoomed image";

      var hint = document.createElement("div");
      hint.className = "img-overlay-hint";
      hint.textContent = "Tap to close - ESC to exit";

      inner.appendChild(zoomImg);
      overlay.appendChild(inner);
      overlay.appendChild(hint);
      document.body.appendChild(overlay);
      document.body.classList.add("no-scroll");

      overlay.addEventListener("click", function () { closeOverlay(overlay); });
      document.addEventListener("keydown", function escClose(ev) {
        if (ev.key === "Escape") {
          document.removeEventListener("keydown", escClose);
          closeOverlay(overlay);
        }
      });
    });
  }

  function scheduleRenderImageLinks() {
    renderImageLinks();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderImageLinks, { once: true });
    }
    setTimeout(renderImageLinks, 50);
    setTimeout(renderImageLinks, 250);
  }

  scheduleRenderImageLinks();
  installZoom();
})();
</script>
