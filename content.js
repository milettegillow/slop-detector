(function () {
  try {
    if (document.contentType && document.contentType !== "text/html") return;

    const RULES = (typeof window !== "undefined" && window.SLOP_RULES) || [];
    const inlineRules = RULES.filter((r) => r.tier <= 2 && r.pattern);

    // Compile each inline rule with the global flag so exec() finds every match.
    const compiled = inlineRules.map((r) => {
      const flags = r.pattern.flags.includes("g") ? r.pattern.flags : r.pattern.flags + "g";
      return Object.assign({}, r, { regex: new RegExp(r.pattern.source, flags) });
    });

    const SKIP_TAGS = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "TEXTAREA",
      "INPUT",
      "SELECT",
      "CODE",
      "PRE",
    ]);

    const processedNodes = new WeakSet();
    const counts = { totalTier1: 0, totalTier2: 0, byCategory: Object.create(null) };

    function shouldSkipAncestor(node) {
      let p = node.parentNode;
      while (p && p.nodeType === 1) {
        if (SKIP_TAGS.has(p.tagName)) return true;
        if (p.getAttribute && p.getAttribute("contenteditable") === "true") return true;
        const cls = p.className;
        if (typeof cls === "string" && /\bsd-/.test(cls)) return true;
        p = p.parentNode;
      }
      return false;
    }

    function findMatches(text) {
      const all = [];
      for (const rule of compiled) {
        rule.regex.lastIndex = 0;
        let m;
        while ((m = rule.regex.exec(text)) !== null) {
          if (m[0].length === 0) {
            rule.regex.lastIndex++;
            continue;
          }
          all.push({
            start: m.index,
            end: m.index + m[0].length,
            ruleId: rule.id,
            tier: rule.tier,
            category: rule.category,
            explanation: rule.explanation,
          });
        }
      }
      // Greedy overlap resolution: lower tier wins, then longer match wins.
      all.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.end - b.start - (a.end - a.start);
      });
      const accepted = [];
      for (const m of all) {
        const overlaps = accepted.some((a) => !(m.end <= a.start || m.start >= a.end));
        if (!overlaps) accepted.push(m);
      }
      accepted.sort((a, b) => a.start - b.start);
      return accepted;
    }

    function processTextNode(node) {
      if (!node || node.nodeType !== 3 || !node.parentNode) return;
      if (processedNodes.has(node)) return;
      if (shouldSkipAncestor(node)) {
        processedNodes.add(node);
        return;
      }
      const text = node.nodeValue;
      if (!text || text.length < 3) {
        processedNodes.add(node);
        return;
      }
      const matches = findMatches(text);
      if (matches.length === 0) {
        processedNodes.add(node);
        return;
      }
      const frag = document.createDocumentFragment();
      let pos = 0;
      for (const m of matches) {
        if (m.start > pos) {
          frag.appendChild(document.createTextNode(text.slice(pos, m.start)));
        }
        const span = document.createElement("span");
        span.className = "sd-hl sd-tier-" + m.tier;
        span.dataset.ruleId = m.ruleId;
        span.dataset.category = m.category;
        span.dataset.explanation = m.explanation;
        span.textContent = text.slice(m.start, m.end);
        frag.appendChild(span);
        if (m.tier === 1) counts.totalTier1++;
        else counts.totalTier2++;
        counts.byCategory[m.category] = (counts.byCategory[m.category] || 0) + 1;
        pos = m.end;
      }
      if (pos < text.length) {
        frag.appendChild(document.createTextNode(text.slice(pos)));
      }
      node.parentNode.replaceChild(frag, node);
    }

    function walkAndProcess(root) {
      if (!root || root.nodeType !== 1) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue || n.nodeValue.trim().length < 2) return NodeFilter.FILTER_REJECT;
          if (shouldSkipAncestor(n)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      for (const node of nodes) processTextNode(node);
    }

    // ── Tier 3 structural metrics ─────────────────────────────────────────
    function computeStructural() {
      const text = document.body ? document.body.innerText || "" : "";
      const wordCount = (text.match(/\b\w+\b/g) || []).length;

      const emCat = "Em dash density";
      delete counts.byCategory[emCat];
      if (wordCount >= 50) {
        const emDashes = (text.match(/—/g) || []).length;
        const density = (emDashes / wordCount) * 100;
        if (density > 2) counts.byCategory[emCat] = emDashes;
      }

      const fragCat = "Three-fragment cadence";
      delete counts.byCategory[fragCat];
      const sentences = text.match(/[^.!?\n]+[.!?]+/g) || [];
      let triples = 0;
      let run = 0;
      for (const s of sentences) {
        if (s.trim().length <= 40) {
          run++;
        } else {
          if (run >= 3) triples++;
          run = 0;
        }
      }
      if (run >= 3) triples++;
      if (triples > 0) counts.byCategory[fragCat] = triples;
    }

    // ── Widget ────────────────────────────────────────────────────────────
    let widget = null;
    let widgetExpanded = false;

    function totalTells() {
      let total = counts.totalTier1 + counts.totalTier2;
      if (counts.byCategory["Em dash density"]) total += counts.byCategory["Em dash density"];
      if (counts.byCategory["Three-fragment cadence"]) total += counts.byCategory["Three-fragment cadence"];
      return total;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c]));
    }

    function renderWidget() {
      const total = totalTells();
      if (!widget) {
        widget = document.createElement("div");
        widget.className = "sd-widget sd-collapsed";
        document.documentElement.appendChild(widget);
      }
      if (total === 0) {
        widget.style.display = "none";
        return;
      }
      widget.style.display = "";

      if (!widgetExpanded) {
        widget.className = "sd-widget sd-collapsed";
        widget.innerHTML =
          '<span class="sd-count">' +
          total +
          '</span><span class="sd-pill-label">tells</span><span class="sd-chevron">▴</span>';
        widget.onclick = () => {
          widgetExpanded = true;
          renderWidget();
        };
      } else {
        widget.className = "sd-widget sd-expanded";
        const sortedCats = Object.entries(counts.byCategory).sort((a, b) => b[1] - a[1]);
        const rows = sortedCats
          .map(
            ([cat, n]) =>
              '<div class="sd-category-row" data-sd-category="' +
              escapeHtml(cat) +
              '"><span class="sd-category-name">' +
              escapeHtml(cat) +
              '</span><span class="sd-category-count">' +
              n +
              "</span></div>"
          )
          .join("");
        const host = (location.hostname || "") + (location.pathname || "");
        widget.innerHTML =
          '<button class="sd-close" aria-label="Collapse">×</button>' +
          '<h2 class="sd-wordmark">Slop Detector</h2>' +
          '<p class="sd-hostname">' + escapeHtml(host) + '</p>' +
          '<p class="sd-total">' + total + '</p>' +
          '<span class="sd-total-label">tells found</span>' +
          '<div class="sd-categories">' + rows + '</div>' +
          '<a class="sd-footer-link" href="https://github.com/miletteriis/slop-detector#what-it-detects" target="_blank" rel="noopener">what does this detect?</a>';
        widget.onclick = null;
        widget.querySelector(".sd-close").addEventListener("click", (e) => {
          e.stopPropagation();
          widgetExpanded = false;
          renderWidget();
        });
        widget.querySelectorAll(".sd-category-row").forEach((row) => {
          row.addEventListener("click", (e) => {
            e.stopPropagation();
            scrollToCategory(row.getAttribute("data-sd-category"));
          });
        });
      }
    }

    function scrollToCategory(category) {
      if (!category) return;
      const safe = category.replace(/"/g, '\\"');
      const el = document.querySelector('.sd-hl[data-category="' + safe + '"]');
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("sd-flash");
      void el.offsetWidth;
      el.classList.add("sd-flash");
      setTimeout(() => el.classList.remove("sd-flash"), 1600);
    }

    // ── Tooltip (single shared element) ───────────────────────────────────
    let tooltip = null;
    let tooltipTimer = null;

    function ensureTooltip() {
      if (tooltip) return tooltip;
      tooltip = document.createElement("div");
      tooltip.className = "sd-tooltip";
      tooltip.innerHTML =
        '<span class="sd-tooltip-category"></span><span class="sd-tooltip-explanation"></span>';
      document.documentElement.appendChild(tooltip);
      return tooltip;
    }

    function showTooltip(el) {
      const t = ensureTooltip();
      t.querySelector(".sd-tooltip-category").textContent = el.dataset.category || "";
      t.querySelector(".sd-tooltip-explanation").textContent = el.dataset.explanation || "";
      t.style.visibility = "hidden";
      t.classList.add("sd-visible");
      const rect = el.getBoundingClientRect();
      const tRect = t.getBoundingClientRect();
      let top = window.scrollY + rect.top - tRect.height - 8;
      let left = window.scrollX + rect.left + rect.width / 2 - tRect.width / 2;
      if (top < window.scrollY + 4) top = window.scrollY + rect.bottom + 8;
      const minLeft = window.scrollX + 4;
      const maxLeft = window.scrollX + document.documentElement.clientWidth - tRect.width - 4;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;
      t.style.top = top + "px";
      t.style.left = left + "px";
      t.style.visibility = "";
    }

    function hideTooltip() {
      if (tooltip) tooltip.classList.remove("sd-visible");
    }

    document.addEventListener(
      "mouseover",
      (e) => {
        const el = e.target.closest && e.target.closest(".sd-hl");
        if (!el) return;
        clearTimeout(tooltipTimer);
        tooltipTimer = setTimeout(() => showTooltip(el), 200);
      },
      true
    );

    document.addEventListener(
      "mouseout",
      (e) => {
        const el = e.target.closest && e.target.closest(".sd-hl");
        if (!el) return;
        clearTimeout(tooltipTimer);
        hideTooltip();
      },
      true
    );

    // ── MutationObserver (debounced) ──────────────────────────────────────
    let mutationTimer = null;
    const pendingNodes = new Set();

    function isOurOwnElement(n) {
      if (n.nodeType !== 1) return false;
      const cls = n.className;
      if (typeof cls === "string" && /\bsd-/.test(cls)) return true;
      if (n.closest && n.closest(".sd-widget, .sd-tooltip")) return true;
      return false;
    }

    function flushMutations() {
      mutationTimer = null;
      const nodes = Array.from(pendingNodes);
      pendingNodes.clear();
      for (const n of nodes) {
        if (!n.parentNode && n.nodeType !== 3) continue;
        if (n.nodeType === 3) {
          processTextNode(n);
        } else if (n.nodeType === 1) {
          if (isOurOwnElement(n)) continue;
          walkAndProcess(n);
        }
      }
      computeStructural();
      renderWidget();
    }

    function scheduleFlush() {
      if (mutationTimer) return;
      mutationTimer = setTimeout(flushMutations, 500);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        const target = mut.target;
        if (target && target.nodeType === 1 && target.closest && target.closest(".sd-widget, .sd-tooltip")) {
          continue;
        }
        for (const added of mut.addedNodes) {
          if (added.nodeType === 1) {
            if (isOurOwnElement(added)) continue;
            pendingNodes.add(added);
          } else if (added.nodeType === 3) {
            pendingNodes.add(added);
          }
        }
      }
      if (pendingNodes.size > 0) scheduleFlush();
    });

    function init() {
      walkAndProcess(document.body);
      computeStructural();
      renderWidget();
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.body) {
      init();
    } else {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    }
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[Slop Detector] init failed:", err);
    }
  }
})();
