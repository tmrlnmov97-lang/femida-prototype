import { reactive } from 'vue';
import { NOTES, ANSWER, type Note } from '~/data/mock';

// Shared notes store: My notes page ↔ "Save to notes" under an answer in the chat.
export type NoteItem = Note & { comment?: string };
const state = reactive({ notes: NOTES.map((n) => ({ ...n })) as NoteItem[] });

// Prototype "today" (sample data is dated around 9 Oct 2026)
export const savedOn = (s: string) => (s === 'Today' || s === 'Just now' ? '9 Oct 2026' : s === 'Yesterday' ? '8 Oct 2026' : /\d{4}$/.test(s) ? s : `${s} 2026`);

export function useNotes() {
  const byQuestion = (q: string) => state.notes.find((n) => n.kind === 'answer' && n.title === q);
  function saveAnswer(question: string, ctx?: { caseId?: string; chat?: string }) {
    if (byQuestion(question)) return;
    state.notes.unshift({
      id: `n${Date.now()}`, kind: 'answer', title: question, excerpt: ANSWER.short.replace(/\s*\[\d+\]/g, ''),
      saved: 'Just now', ts: 99999999, caseId: ctx?.caseId, chat: ctx?.chat,
    });
  }
  function remove(id: string) { state.notes = state.notes.filter((n) => n.id !== id); }
  return { state, byQuestion, saveAnswer, remove };
}
