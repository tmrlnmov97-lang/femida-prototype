import { reactive, computed } from 'vue';
import { ANSWER, SOURCES, MODES, DEEP_STEPS, type ModeId, type Source } from '~/data/mock';

export type ErrorKind = 'temporary' | 'quota' | 'service';
export type AssistantStatus = 'searching' | 'plan' | 'deep' | 'streaming' | 'done' | 'refused' | 'error';

export interface UserMsg { id: number; role: 'user'; text: string; mode: ModeId; file?: string }
export interface AssistantMsg {
  id: number; role: 'assistant'; mode: ModeId; status: AssistantStatus;
  progress: number; sources: Source[]; errorKind?: ErrorKind; deepStep: number; question: string;
}
export type Msg = UserMsg | AssistantMsg;

const LIMIT = 50;
// Full answer text in reveal order (short → paragraphs → steps), used to drive streaming.
export const ANSWER_BLOCKS = [ANSWER.short, ...ANSWER.paragraphs, ...ANSWER.steps];
export const ANSWER_LENGTH = ANSWER_BLOCKS.reduce((n, b) => n + b.length, 0);

const state = reactive({
  messages: [] as Msg[],
  remaining: 42,
  mode: 'auto' as ModeId,
  skipClarifying: false,
  file: null as null | { name: string; size: string },
  sourcesOpen: false,
  activeSource: null as null | number,
  busy: false,
  caseCtx: null as null | { id: string; name: string; docs: number }, // chat that belongs to a case
  chatTitle: null as null | string, // shown as the last breadcrumb
  draft: '' as string, // text to put into the composer when the chat opens (e.g. from Watch)
});

let seq = 1;
const timers: ReturnType<typeof setTimeout>[] = [];
const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()!); };

const last = () => state.messages[state.messages.length - 1] as AssistantMsg | undefined;

function stream(msg: AssistantMsg, done: () => void) {
  msg.status = 'streaming';
  const step = () => {
    msg.progress = Math.min(ANSWER_LENGTH, msg.progress + 7);
    // sources "arrive" as the text that cites them is written
    const shown = SOURCES.filter((s) => msg.progress > (s.n === 1 ? 10 : s.n === 2 ? 90 : ANSWER_LENGTH - 60));
    if (shown.length !== msg.sources.length) msg.sources = shown;
    if (msg.progress < ANSWER_LENGTH) later(step, 28);
    else { msg.status = 'done'; msg.sources = [...SOURCES]; done(); }
  };
  later(step, 28);
}

export function useChat() {
  const modeObj = computed(() => MODES.find((m) => m.id === state.mode)!);
  const isEmpty = computed(() => state.messages.length === 0);
  const outOfQuestions = computed(() => state.remaining <= 0);
  const low = computed(() => state.remaining > 0 && state.remaining <= 10);

  function send(text: string) {
    const q = text.trim();
    if ((!q && !state.file) || state.busy || outOfQuestions.value) return;
    state.messages.push({ id: seq++, role: 'user', text: q || 'Please analyse the attached document.', mode: state.mode, file: state.file?.name });
    const msg = reactive<AssistantMsg>({ id: seq++, role: 'assistant', mode: state.mode, status: 'searching', progress: 0, sources: [], deepStep: 0, question: q });
    state.messages.push(msg);
    state.file = null;
    state.busy = true;
    const finish = () => { state.busy = false; };

    if (/cake|bake|recipe|торт|пирог/i.test(q)) {
      later(() => { msg.status = 'refused'; finish(); }, 1100); // refusal: question not counted
      return;
    }
    if (state.mode === 'plan') {
      later(() => { msg.status = 'plan'; finish(); }, 1100); // user reviews the plan first
      return;
    }
    state.sourcesOpen = true;
    if (state.mode === 'deep') {
      msg.status = 'deep';
      const tick = () => {
        msg.deepStep++;
        if (msg.deepStep < DEEP_STEPS.length) later(tick, 900);
        else stream(msg, () => { state.remaining--; finish(); });
      };
      later(tick, 900);
      return;
    }
    later(() => stream(msg, () => { state.remaining--; finish(); }), 1100);
  }

  function newChat() {
    clearTimers();
    state.messages = []; state.busy = false; state.sourcesOpen = false; state.activeSource = null; state.file = null; state.caseCtx = null; state.chatTitle = null;
  }

  function approvePlan(msg: AssistantMsg) {
    if (msg.status !== 'plan') return;
    state.busy = true; state.sourcesOpen = true; msg.status = 'searching';
    later(() => stream(msg, () => { state.remaining--; state.busy = false; }), 900);
  }

  function openSource(n: number) { state.sourcesOpen = true; state.activeSource = n; }

  function retry() {
    const m = last();
    if (!m || m.status !== 'error') return;
    state.messages.splice(state.messages.length - 2, 2);
    const prev = state.messages.length;
    send(m.question || ANSWER.short);
    return prev;
  }

  /** Reviewer tool: jump straight to any state. */
  function demo(name: string) {
    newChat();
    state.remaining = 42;
    const q = 'Can an employee contest a dismissal after the one-month deadline if they were in hospital?';
    const push = (status: AssistantStatus, extra: Partial<AssistantMsg> = {}) => {
      state.messages.push({ id: seq++, role: 'user', text: q, mode: extra.mode || 'legal' });
      state.messages.push(reactive<AssistantMsg>({ id: seq++, role: 'assistant', mode: extra.mode || 'legal', status, progress: 0, sources: [], deepStep: 0, question: q, ...extra }));
    };
    switch (name) {
      case 'answer': push('done', { progress: ANSWER_LENGTH, sources: [...SOURCES] }); state.sourcesOpen = true; break;
      case 'fragment': push('done', { progress: ANSWER_LENGTH, sources: [...SOURCES] }); state.sourcesOpen = true; state.activeSource = 2; break;
      case 'streaming': push('streaming', { progress: 150, sources: SOURCES.slice(0, 2) }); state.sourcesOpen = true; break;
      case 'searching': push('searching'); state.sourcesOpen = true; break;
      case 'deep': push('deep', { mode: 'deep', deepStep: 2 }); state.sourcesOpen = true; break;
      case 'plan': push('plan', { mode: 'plan' }); break;
      case 'mode-menu': break;
      case 'refused': state.messages.push({ id: seq++, role: 'user', text: 'How to bake a cake?', mode: 'auto' });
        state.messages.push(reactive<AssistantMsg>({ id: seq++, role: 'assistant', mode: 'auto', status: 'refused', progress: 0, sources: [], deepStep: 0, question: 'How to bake a cake?' })); break;
      case 'error-temporary': push('error', { errorKind: 'temporary' }); break;
      case 'error-quota': push('error', { errorKind: 'quota' }); break;
      case 'error-service': push('error', { errorKind: 'service' }); break;
      case 'low': state.remaining = 8; break;
      case 'out': state.remaining = 0; push('done', { progress: ANSWER_LENGTH, sources: [...SOURCES] }); break;
      default: break;
    }
  }

  return { state, modeObj, isEmpty, outOfQuestions, low, send, newChat, openSource, retry, demo, approvePlan, LIMIT };
}
