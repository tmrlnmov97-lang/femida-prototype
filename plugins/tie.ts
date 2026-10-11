// Typography: no hanging short words at the end of a line (user rule, 11.10.2026 — «убери висячий предлог»; memory: no widows).
// v-tie on a container ties articles, prepositions, conjunctions, short pronouns and short numbers to the next word with a
// no-break space. It watches the subtree, so text that appears later (FAQ answers, tabs, dialogs) is tied too.
// The Armenian swap at handoff needs its own word list.
const WORDS = 'a|an|the|and|or|nor|but|of|in|on|at|to|by|for|with|from|into|as|if|is|it|its|no|not|we|you|your|our|so|per|via|than|that|\\d{1,3}';
const RE = new RegExp(`(?<=^|[\\s(«“"'])(${WORDS}) (?=\\S)`, 'gi');
const SKIP = 'textarea, input, code, pre, [contenteditable], .no-tie';

export const tie = (s: string) => s.replace(RE, '$1 ');

function fix(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const p = node.parentElement;
    const v = node.nodeValue || '';
    if (!p || p.closest(SKIP) || !v.includes(' ')) return;
    const t = tie(v);
    if (t !== v) node.nodeValue = t;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) fix(n);
}

type TieEl = HTMLElement & { _tie?: MutationObserver };
export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.directive('tie', {
    mounted(el: TieEl) {
      fix(el);
      const mo = new MutationObserver((recs) => recs.forEach((r) => (r.type === 'characterData' ? fix(r.target) : r.addedNodes.forEach(fix))));
      mo.observe(el, { subtree: true, childList: true, characterData: true });
      el._tie = mo;
    },
    unmounted(el: TieEl) { el._tie?.disconnect(); },
  });
});
