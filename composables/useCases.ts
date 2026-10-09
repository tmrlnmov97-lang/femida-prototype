import { reactive } from 'vue';
import { CASES, type CaseItem } from '~/data/mock';

// Shared, in-memory cases store for the prototype (list page ↔ case page).
const state = reactive({
  cases: CASES.map((c) => ({ ...c, chats: c.chats.map((x) => ({ ...x })), files: c.files.map((f) => ({ ...f })) })) as CaseItem[],
});

export function monogram(name: string) {
  const words = name.replace(/[—–-]/g, ' ').split(/\s+/).filter((w) => w && !/^v\.?$/i.test(w));
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const fileIcon = (f: string) => (/\.docx?$/i.test(f) ? 'pi pi-file-word' : /\.pdf$/i.test(f) ? 'pi pi-file-pdf' : 'pi pi-file');

export function useCases() {
  const byId = (id: string) => state.cases.find((c) => c.id === id);
  function create(name: string) {
    const c: CaseItem = { id: `k${Date.now()}`, name, updated: 'Just now', ts: 99999999, chats: [], files: [] };
    state.cases.unshift(c);
    return c;
  }
  function remove(c: CaseItem) { state.cases = state.cases.filter((x) => x !== c); }
  function addFile(c: CaseItem) { // prototype: a sample upload lands in the case
    c.files.push({ name: `Document_${c.files.length + 1}.pdf`, size: '240 KB', added: 'Just now' });
    c.updated = 'Just now'; c.ts = 99999999;
  }
  return { state, byId, create, remove, addFile };
}
