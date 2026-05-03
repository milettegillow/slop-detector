(function () {
  const SD_DEBUG = true;

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

    const STRUCT_KEYS = ["Em dash density", "Three-fragment cadence"];

    // We track parents we've already wrapped so re-walks (mutation flushes) skip them.
    // Detached parents are GC'd, so the WeakSet self-cleans as React re-renders.
    const processedParents = new WeakSet();

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

    function parentAlreadyWrapped(parent) {
      // Cheap iteration over direct element children; avoids forcing layout.
      let child = parent.firstElementChild;
      while (child) {
        const cls = child.className;
        if (typeof cls === "string" && /\bsd-hl\b/.test(cls)) return true;
        child = child.nextElementSibling;
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

    // Wrap a text node in-place. Returns number of matches wrapped, or 0.
    // Does NOT update counts — counts are recomputed from the DOM after the batch.
    function wrapTextNode(node) {
      if (!node || node.nodeType !== 3) return 0;
      if (!node.isConnected) return 0;
      const parent = node.parentNode;
      if (!parent || parent.nodeType !== 1) return 0;
      const text = node.nodeValue;
      if (!text || text.length < 3) return 0;
      const matches = findMatches(text);
      if (matches.length === 0) return 0;

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
        pos = m.end;
      }
      if (pos < text.length) {
        frag.appendChild(document.createTextNode(text.slice(pos)));
      }
      parent.replaceChild(frag, node);
      return matches.length;
    }

    function collectTextNodes(root) {
      if (!root || root.nodeType !== 1) return [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue || n.nodeValue.trim().length < 2) return NodeFilter.FILTER_REJECT;
          const parent = n.parentNode;
          if (!parent || parent.nodeType !== 1) return NodeFilter.FILTER_REJECT;
          if (processedParents.has(parent)) return NodeFilter.FILTER_REJECT;
          if (shouldSkipAncestor(n)) return NodeFilter.FILTER_REJECT;
          if (parentAlreadyWrapped(parent)) {
            processedParents.add(parent);
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      return nodes;
    }

    function walkAndProcess(root) {
      const candidates = collectTextNodes(root);
      let nodesProcessed = 0;
      let matchesAttempted = 0;
      let wrapFailures = 0;
      for (const node of candidates) {
        const parent = node.parentNode;
        try {
          const wrapped = wrapTextNode(node);
          nodesProcessed++;
          matchesAttempted += wrapped;
          if (parent && parent.nodeType === 1) processedParents.add(parent);
        } catch (err) {
          wrapFailures++;
          if (SD_DEBUG && console && console.warn) {
            console.warn("[slop-detector] wrap failure on node:", err && err.message);
          }
        }
      }
      return { textNodesConsidered: candidates.length, nodesProcessed, matchesAttempted, wrapFailures };
    }

    // ── Single source of truth: count from DOM ────────────────────────────
    function recountInlineFromDOM() {
      const struct = {};
      for (const k of STRUCT_KEYS) {
        if (counts.byCategory[k]) struct[k] = counts.byCategory[k];
      }
      for (const k of Object.keys(counts.byCategory)) delete counts.byCategory[k];

      const tier1 = document.querySelectorAll(".sd-hl.sd-tier-1");
      const tier2 = document.querySelectorAll(".sd-hl.sd-tier-2");
      counts.totalTier1 = tier1.length;
      counts.totalTier2 = tier2.length;

      const all = document.querySelectorAll(".sd-hl");
      for (const el of all) {
        const cat = el.dataset && el.dataset.category;
        if (!cat) continue;
        counts.byCategory[cat] = (counts.byCategory[cat] || 0) + 1;
      }

      for (const k of STRUCT_KEYS) if (struct[k]) counts.byCategory[k] = struct[k];
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
      } else if (!widget.isConnected) {
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

    const categoryClickIndex = Object.create(null);

    function scrollToCategory(category) {
      if (!category) return;
      const safe = category.replace(/"/g, '\\"');
      const els = document.querySelectorAll('.sd-hl[data-category="' + safe + '"]');
      if (!els.length) return;
      const idx = (categoryClickIndex[category] || 0) % els.length;
      categoryClickIndex[category] = idx + 1;
      const el = els[idx];
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
      if (tooltip && tooltip.isConnected) return tooltip;
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
    // SPA strategy: on any mutation batch, re-walk the entire body. The
    // processedParents WeakSet skips parents we've already wrapped, so this
    // is cheap. React re-renders create fresh parents not in the set, so
    // their content gets wrapped. Counts are recomputed from the DOM.
    let mutationTimer = null;
    let mutationsPending = false;

    function flushMutations() {
      mutationTimer = null;
      mutationsPending = false;
      const stats = walkAndProcess(document.body);
      computeStructural();
      recountInlineFromDOM();
      renderWidget();
      if (SD_DEBUG && console && console.log) {
        console.log(
          "[slop-detector] re-scan: " +
            stats.textNodesConsidered + " text nodes, " +
            stats.matchesAttempted + " matches attempted, " +
            document.querySelectorAll(".sd-hl").length + " spans in DOM, " +
            stats.wrapFailures + " failures"
        );
      }
    }

    function scheduleFlush() {
      if (mutationTimer) {
        mutationsPending = true;
        return;
      }
      mutationTimer = setTimeout(() => {
        flushMutations();
        if (mutationsPending) scheduleFlush();
      }, 500);
    }

    const observer = new MutationObserver((mutations) => {
      // We don't read addedNodes here — we just trigger a re-walk. The walker
      // filter (processedParents + parentAlreadyWrapped) decides what's stale.
      // Skip the trigger if every mutation is inside our own UI.
      let interesting = false;
      for (const mut of mutations) {
        const target = mut.target;
        if (
          target &&
          target.nodeType === 1 &&
          target.closest &&
          target.closest(".sd-widget, .sd-tooltip, .sd-hl")
        ) {
          continue;
        }
        interesting = true;
        break;
      }
      if (interesting) scheduleFlush();
    });

    function init() {
      const stats = walkAndProcess(document.body);
      computeStructural();
      recountInlineFromDOM();
      renderWidget();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      if (SD_DEBUG && console && console.log) {
        console.log(
          "[slop-detector] init: walked " +
            stats.textNodesConsidered + " text nodes, " +
            stats.matchesAttempted + " matches attempted, " +
            document.querySelectorAll(".sd-hl").length + " spans in DOM, " +
            stats.wrapFailures + " failures"
        );
      }
    }

    if (document.body) {
      init();
    } else {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    }
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[slop-detector] init failed:", err);
    }
  }
})();
