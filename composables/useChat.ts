import { reactive, computed } from 'vue';
import { ANSWER, SOURCES, MODES, DEEP_STEPS, PLAN_QUESTION, type ModeId, type Source } from '~/data/mock';

export type ErrorKind = 'temporary' | 'quota' | 'service';
export type AssistantStatus = 'searching' | 'planning' | 'asking' | 'plan' | 'deep' | 'streaming' | 'done' | 'refused' | 'error' | 'stopped';
// Plan first, the way Claude plans: read the sources → ask clarifying questions (options, like Claude's question picker) →
// draft the plan → "Would you like to proceed?" (run / answer directly / keep planning with feedback)
export interface PlanProgress { phase: 'search' | 'draft'; read: number; steps: number; secs: number }
export type PlanApproval = { steps: number; sources: number } | 'direct';
export interface PlanAnswer { h: string; a: string }

export interface UserMsg { id: number; role: 'user'; text: string; mode: ModeId; file?: string }
export interface AssistantMsg {
  id: number; role: 'assistant'; mode: ModeId; status: AssistantStatus;
  progress: number; sources: Source[]; errorKind?: ErrorKind; deepStep: number; question: string;
  // plan mode only
  planning?: PlanProgress; approved?: PlanApproval; noQuestions?: boolean; answers?: PlanAnswer[]; revisions?: string[];
}
export type Msg = UserMsg | AssistantMsg;

const LIMIT = 50;
// Full answer text in reveal order (short → paragraphs → steps), used to drive streaming.
export const ANSWER_BLOCKS = [ANSWER.short, ...ANSWER.paragraphs, ...ANSWER.steps];
export const ANSWER_LENGTH = ANSWER_BLOCKS.reduce((n, b) => n + b.length, 0);

const state = reactive({
  messages: [] as Msg[],
  remaining: 42,
  upsell: false, // out of credits → the plan picker over the chat (UpgradeDialog), like Claude
  mode: 'auto' as ModeId,
  skipClarifying: false,
  file: null as null | { name: string; size: string },
  sourcesOpen: false,
  activeSource: null as null | number,
  busy: false,
  caseCtx: null as null | { id: string; name: string; docs: number }, // chat that belongs to a case
  chatTitle: null as null | string, // shown as the last breadcrumb
  draft: '' as string, // text to put into the composer when the chat opens (e.g. from Watch)
  pendingAsk: '' as string, // a guest's question from the website, sent as soon as the app opens after sign-in
});

let seq = 1;
// Desktop/tablet: the Sources panel opens with the answer. Phone: it is a bottom sheet over the answer, so only on demand.
const autoSources = () => typeof window === 'undefined' || window.innerWidth >= 768;
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
  // one credit per answer; the last one opens the plan picker a moment after the answer lands
  function spend() { state.remaining = Math.max(0, state.remaining - 1); if (state.remaining === 0) later(() => { state.upsell = true; }, 600); }

  function send(text: string) {
    const q = text.trim();
    if (outOfQuestions.value) { state.upsell = true; return; } // asking with no credits left opens the plans
    if ((!q && !state.file) || state.busy) return;
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
      // read the sources, then ask (unless "Skip clarifying questions"), then draft the plan for review
      msg.status = 'planning'; msg.noQuestions = state.skipClarifying;
      msg.planning = { phase: 'search', read: 0, steps: 0, secs: 0 };
      let n = 0;
      const search = () => {
        n++; const p = msg.planning!; p.read = Math.min(7, Math.ceil(n * .7)); p.steps = Math.min(16, Math.round(n * 1.6));
        if (n < 10) later(search, 240);
        else if (msg.noQuestions) draftPlan(msg);
        else { msg.status = 'asking'; finish(); } // waits for the answers in the dock
      };
      later(search, 400);
      return;
    }
    if (autoSources()) state.sourcesOpen = true;
    if (state.mode === 'deep') {
      msg.status = 'deep';
      const tick = () => {
        msg.deepStep++;
        if (msg.deepStep < DEEP_STEPS.length) later(tick, 900);
        else stream(msg, () => { spend(); finish(); });
      };
      later(tick, 900);
      return;
    }
    later(() => stream(msg, () => { spend(); finish(); }), 1100);
  }

  function newChat() {
    clearTimers();
    state.messages = []; state.busy = false; state.sourcesOpen = false; state.activeSource = null; state.file = null; state.caseCtx = null; state.chatTitle = null; state.upsell = false;
  }

  /** Draft (or re-draft) the plan; ends with "Would you like to proceed?" in the dock. */
  function draftPlan(msg: AssistantMsg) {
    msg.status = 'planning'; state.busy = true;
    msg.planning = { ...(msg.planning || { read: 7, steps: 16 }), phase: 'draft', secs: 0 };
    const tick = () => { msg.planning!.secs++; if (msg.planning!.secs < 3) later(tick, 1000); else { msg.status = 'plan'; state.busy = false; } };
    later(tick, 1000);
  }
  function answerQuestions(msg: AssistantMsg, answers: PlanAnswer[]) {
    if (msg.status !== 'asking') return;
    msg.answers = answers; draftPlan(msg);
  }
  function revisePlan(msg: AssistantMsg, text: string) {
    if (msg.status !== 'plan' || !text.trim()) return;
    msg.revisions = [...(msg.revisions || []), text.trim()]; draftPlan(msg);
  }

  function approvePlan(msg: AssistantMsg, how: PlanApproval = 'direct') {
    if (msg.status !== 'plan') return;
    msg.approved = how;
    state.busy = true; if (autoSources()) state.sourcesOpen = true; msg.status = 'searching';
    later(() => stream(msg, () => { spend(); state.busy = false; }), 900);
  }

  /** Stop drafting the plan — nothing is counted. */
  function stop() {
    const m = last();
    if (!m || (m.status !== 'planning' && m.status !== 'asking')) return;
    clearTimers(); m.status = 'stopped'; state.busy = false;
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
    const push = (status: AssistantStatus, extra: Partial<AssistantMsg> = {}, text = q) => {
      state.messages.push({ id: seq++, role: 'user', text, mode: extra.mode || 'legal' });
      state.messages.push(reactive<AssistantMsg>({ id: seq++, role: 'assistant', mode: extra.mode || 'legal', status, progress: 0, sources: [], deepStep: 0, question: text, ...extra }));
    };
    switch (name) {
      case 'answer': push('done', { progress: ANSWER_LENGTH, sources: [...SOURCES] }); state.sourcesOpen = true; break;
      case 'fragment': push('done', { progress: ANSWER_LENGTH, sources: [...SOURCES] }); state.sourcesOpen = true; state.activeSource = 2; break;
      case 'streaming': push('streaming', { progress: 150, sources: SOURCES.slice(0, 2) }); state.sourcesOpen = true; break;
      case 'searching': push('searching'); state.sourcesOpen = true; break;
      case 'deep': push('deep', { mode: 'deep', deepStep: 2 }); state.sourcesOpen = true; break;
      case 'planning': state.mode = 'plan'; push('planning', { mode: 'plan', planning: { phase: 'search', read: 4, steps: 9, secs: 0 } }, PLAN_QUESTION); break;
      case 'plan-questions': state.mode = 'plan'; push('asking', { mode: 'plan', planning: { phase: 'search', read: 7, steps: 16, secs: 0 } }, PLAN_QUESTION); break;
      case 'plan': state.mode = 'plan';
        push('plan', { mode: 'plan', planning: { phase: 'draft', read: 7, steps: 16, secs: 19 }, answers: [{ h: 'Order', a: 'Yes, in writing' }, { h: 'Sick note', a: 'Ordinary doctor’s note' }, { h: 'Explanation', a: 'Not asked' }, { h: 'Liability', a: 'No agreement' }] }, PLAN_QUESTION); break;
      case 'mode-menu': break;
      case 'refused': state.messages.push({ id: seq++, role: 'user', text: 'How to bake a cake?', mode: 'auto' });
        state.messages.push(reactive<AssistantMsg>({ id: seq++, role: 'assistant', mode: 'auto', status: 'refused', progress: 0, sources: [], deepStep: 0, question: 'How to bake a cake?' })); break;
      case 'error-temporary': push('error', { errorKind: 'temporary' }); break;
      case 'error-quota': push('error', { errorKind: 'quota' }); break;
      case 'error-service': push('error', { errorKind: 'service' }); break;
      case 'low': state.remaining = 8; break;
      case 'out': state.remaining = 0; push('done', { progress: ANSWER_LENGTH, sources: [...SOURCES] }); later(() => { state.upsell = true; }, 400); break;
      case 'last': state.remaining = 1; break; // one credit left: the next answer uses it and the plans pop up
      default: break;
    }
  }

  return { state, modeObj, isEmpty, outOfQuestions, low, send, newChat, openSource, retry, demo, approvePlan, answerQuestions, revisePlan, stop, LIMIT };
}
