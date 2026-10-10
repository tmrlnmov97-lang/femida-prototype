<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ACCOUNT, DETAIL_FIELDS } from '~/data/mock';

// Account (live: /account), laid out like Claude's Settings: a short list of sections on the left, calm rows on the right
// (label + hint on the left, the value or control on the right), one action per block — no full-width green buttons.
// Sections: Profile · Plan & credits · Security · Your data. Demo: ?tab=plan | security | data
useHead({ title: 'Account — Femida redesign prototype' });
const route = useRoute();
const router = useRouter();
const { state: chat, LIMIT } = useChat();

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'pi pi-user' },
  { id: 'plan', label: 'Plan & credits', icon: 'pi pi-database' },
  { id: 'security', label: 'Security', icon: 'pi pi-shield' },
  { id: 'data', label: 'Your data', icon: 'pi pi-download' },
] as const;
type Tab = typeof TABS[number]['id'];
const tab = ref<Tab>('profile');
const sync = () => { const t = route.query.tab; tab.value = TABS.some((x) => x.id === t) ? (t as Tab) : 'profile'; };
watch(() => route.query.tab, sync);
function go(t: Tab) { router.replace({ query: t === 'profile' ? {} : { tab: t } }); }

const ready = ref(false);
onMounted(() => { sync(); setTimeout(() => (ready.value = true), 300); });

/* Profile → document details (header of exported Word / PDF) */
type DKey = typeof DETAIL_FIELDS[number]['key'];
const saved = reactive({ ...ACCOUNT.details });
const form = reactive({ ...ACCOUNT.details });
const dirty = computed(() => DETAIL_FIELDS.some((f) => form[f.key].trim() !== saved[f.key]));
const justSaved = ref(false);
function saveDetails() { DETAIL_FIELDS.forEach((f) => (saved[f.key] = form[f.key].trim())); justSaved.value = true; setTimeout(() => (justSaved.value = false), 2000); }
function resetDetails() { Object.assign(form, saved); }
const preview = computed(() => DETAIL_FIELDS.map((f) => ({ k: f.key as DKey, v: form[f.key].trim() || f.ph, empty: !form[f.key].trim() })));

/* Plan & credits */
const share = computed(() => Math.max(0, Math.min(1, chat.remaining / LIMIT)));
const copied = ref(false);
function copyLink() { try { navigator.clipboard?.writeText(ACCOUNT.refLink); } catch {} copied.value = true; setTimeout(() => (copied.value = false), 1600); }

/* Security */
const twoStep = ref(false);
const pwOpen = ref(false);
const PW_KEYS = ['current', 'next', 'repeat'] as const;
const pw = reactive({ current: '', next: '', repeat: '' });
const show = reactive({ current: false, next: false, repeat: false });
const pwTried = ref(false);
const pwDone = ref(false);
const pwErr = computed(() => ({
  current: !pw.current ? 'Enter your current password' : '',
  next: pw.next.length < 8 ? 'At least 8 characters' : '',
  repeat: pw.repeat !== pw.next || !pw.repeat ? 'The passwords don’t match' : '',
}));
function changePassword() {
  pwTried.value = true;
  if (pwErr.value.current || pwErr.value.next || pwErr.value.repeat) return;
  pwOpen.value = false; pwTried.value = false; Object.assign(pw, { current: '', next: '', repeat: '' });
  pwDone.value = true; setTimeout(() => (pwDone.value = false), 2600);
}
function cancelPassword() { pwOpen.value = false; pwTried.value = false; Object.assign(pw, { current: '', next: '', repeat: '' }); }

/* Your data */
const format = ref('md');
const downloading = ref(false);
const downloaded = ref(false);
function download() { downloading.value = true; setTimeout(() => { downloading.value = false; downloaded.value = true; setTimeout(() => (downloaded.value = false), 1800); }, 900); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>Account</h1>
          <p class="lead">Your profile, plan and usage</p>
        </header>

        <div class="layout">
          <!-- Sections (left on desktop, a scrollable row on a phone) -->
          <nav class="tabs" aria-label="Account sections">
            <button v-for="t in TABS" :key="t.id" class="tab" :class="{ on: tab === t.id }" :aria-current="tab === t.id ? 'page' : undefined" @click="go(t.id)">
              <i :class="t.icon" />{{ t.label }}
            </button>
          </nav>

          <div class="content">
            <div v-if="!ready" class="skel" aria-busy="true" aria-label="Loading account">
              <PSkeleton width="30%" height="20px" /><PSkeleton height="140px" border-radius="16px" /><PSkeleton height="220px" border-radius="16px" />
            </div>

            <!-- ============ Profile ============ -->
            <template v-else-if="tab === 'profile'">
              <section class="sec">
                <h2>Profile</h2>
                <div class="card">
                  <div class="row">
                    <div class="r-text"><span class="r-label">Email</span><span class="r-hint">You sign in with it</span></div>
                    <span class="r-value">{{ ACCOUNT.email }}</span>
                  </div>
                  <div class="row">
                    <div class="r-text"><span class="r-label">Role</span></div>
                    <span class="r-value">{{ ACCOUNT.role }}</span>
                  </div>
                </div>
              </section>

              <section class="sec">
                <h2>Professional details</h2>
                <p class="sub">Fill these in once — they will be added automatically to the header of documents you export (Word/PDF).</p>
                <div class="card pad">
                  <form class="grid" @submit.prevent="saveDetails">
                    <label v-for="f in DETAIL_FIELDS" :key="f.key" class="f" :class="{ wide: f.key === 'firm' || f.key === 'address' }">
                      <span class="lbl">{{ f.label }}</span>
                      <input v-model="form[f.key]" class="in" :placeholder="f.ph" maxlength="120" />
                    </label>
                  </form>

                  <!-- What the header of an exported document will look like -->
                  <div class="preview" aria-label="Document header preview">
                    <span class="pv-title">Document header preview</span>
                    <div class="pv-paper">
                      <span v-for="p in preview" :key="p.k" :class="['pv-line', `pv-${p.k}`, { empty: p.empty }]">{{ p.k === 'licence' ? `Licence № ${p.v}` : p.v }}</span>
                    </div>
                  </div>

                  <div class="foot">
                    <span class="note" :class="{ ok: justSaved }"><template v-if="justSaved"><i class="pi pi-check" />Saved</template><template v-else-if="dirty">Unsaved changes</template></span>
                    <button v-if="dirty" class="btn ghost" @click="resetDetails">Cancel</button>
                    <button class="btn primary" :disabled="!dirty" @click="saveDetails">Save details</button>
                  </div>
                </div>
              </section>
            </template>

            <!-- ============ Plan & credits ============ -->
            <template v-else-if="tab === 'plan'">
              <section class="sec">
                <h2>Plan &amp; credits</h2>
                <div class="card">
                  <div class="row">
                    <div class="r-text"><span class="r-label">Plan</span><span class="r-hint">Valid until {{ ACCOUNT.validUntil }}</span></div>
                    <span class="r-value"><span class="tag">{{ ACCOUNT.plan }}</span></span>
                  </div>
                  <div class="row col">
                    <div class="credits">
                      <div class="r-text"><span class="r-label">Credits</span><span class="r-hint">One credit per question. The same number is in the top bar and in&nbsp;emails.</span></div>
                      <span class="big"><b>{{ chat.remaining }}</b> of {{ LIMIT }} left</span>
                    </div>
                    <div class="bar" role="progressbar" :aria-valuenow="chat.remaining" aria-valuemin="0" :aria-valuemax="LIMIT" aria-label="Credits left"><span :style="{ width: `${share * 100}%` }" /></div>
                  </div>
                  <div class="row">
                    <div class="r-text"><span class="r-label">Need more?</span><span class="r-hint">Compare plans and pick the one that fits your&nbsp;work.</span></div>
                    <button class="btn secondary">See plans<i class="pi pi-arrow-right" /></button>
                  </div>
                </div>
              </section>

              <section class="sec">
                <h2>Invite a colleague</h2>
                <p class="sub">Share the link. Invited: {{ ACCOUNT.invited }}</p>
                <div class="card pad">
                  <div class="link-row">
                    <input class="in mono" :value="ACCOUNT.refLink" readonly aria-label="Your invite link" @focus="($event.target as HTMLInputElement).select()" />
                    <button class="btn secondary" @click="copyLink"><i class="pi" :class="copied ? 'pi-check' : 'pi-copy'" />{{ copied ? 'Copied' : 'Copy link' }}</button>
                  </div>
                </div>
              </section>
            </template>

            <!-- ============ Security ============ -->
            <template v-else-if="tab === 'security'">
              <section class="sec">
                <h2>Security</h2>
                <p class="sub">Change your password and manage two-step verification.</p>
                <div class="card">
                  <div class="row">
                    <div class="r-text"><span class="r-label">Two-step verification</span><span class="r-hint">A code will be sent to your email when you sign&nbsp;in.</span></div>
                    <button class="switch" role="switch" :aria-checked="twoStep" aria-label="Two-step verification" @click="twoStep = !twoStep"><span /></button>
                  </div>

                  <div class="row" :class="{ col: pwOpen }">
                    <div class="pw-head">
                      <div class="r-text"><span class="r-label">Password</span><span class="r-hint" :class="{ ok: pwDone }"><template v-if="pwDone"><i class="pi pi-check" />Password changed</template><template v-else>At least 8 characters</template></span></div>
                      <button v-if="!pwOpen" class="btn secondary" @click="pwOpen = true">Change password</button>
                    </div>
                    <form v-if="pwOpen" class="pw-form" novalidate @submit.prevent="changePassword">
                      <label v-for="k in PW_KEYS" :key="k" class="f">
                        <span class="lbl">{{ k === 'current' ? 'Current password' : k === 'next' ? 'New password' : 'Repeat the new password' }}</span>
                        <span class="pw-in" :class="{ bad: pwTried && pwErr[k] }">
                          <input v-model="pw[k]" :type="show[k] ? 'text' : 'password'" :autocomplete="k === 'current' ? 'current-password' : 'new-password'" :aria-invalid="!!(pwTried && pwErr[k])" />
                          <button type="button" :aria-label="show[k] ? 'Hide password' : 'Show password'" @click="show[k] = !show[k]"><i class="pi" :class="show[k] ? 'pi-eye-slash' : 'pi-eye'" /></button>
                        </span>
                        <span v-if="pwTried && pwErr[k]" class="err"><i class="pi pi-exclamation-circle" />{{ pwErr[k] }}</span>
                      </label>
                      <div class="foot">
                        <button type="button" class="btn ghost" @click="cancelPassword">Cancel</button>
                        <button type="submit" class="btn primary">Change password</button>
                      </div>
                    </form>
                  </div>

                  <div class="row">
                    <div class="r-text"><span class="r-label">Active sessions</span><span class="r-hint">Devices signed in to your&nbsp;account</span></div>
                    <span class="r-value">{{ ACCOUNT.sessions }} · this device</span>
                  </div>
                </div>
              </section>
            </template>

            <!-- ============ Your data ============ -->
            <template v-else>
              <section class="sec">
                <h2>Your data</h2>
                <p class="sub">Download all your questions and answers as one file to send to the team. Never share your&nbsp;password.</p>
                <div class="card">
                  <div class="row stack">
                    <div class="r-text"><span class="r-label">Download my history</span><span class="r-hint">All chats in one file</span></div>
                    <div class="r-ctrl">
                      <select v-model="format" class="sel" aria-label="File format"><option value="md">Markdown (.md)</option></select>
                      <button class="btn secondary" :disabled="downloading" @click="download"><i class="pi" :class="downloaded ? 'pi-check' : 'pi-download'" />{{ downloading ? 'Preparing…' : downloaded ? 'Downloaded' : 'Download' }}</button>
                    </div>
                  </div>
                  <div class="row">
                    <div class="r-text"><span class="r-label">Sign out</span><span class="r-hint">On this device</span></div>
                    <button class="btn secondary danger"><i class="pi pi-sign-out" />Sign out</button>
                  </div>
                </div>
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
/* Like Claude's Settings: H1, a section list on the left, calm rows on the right. 8px grid. */
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 960px; margin: 0 auto; padding: 48px 0 80px; }
.head { display: grid; gap: 8px; margin-bottom: 32px; }
h1 { margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; }
.lead { margin: 0; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.layout { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 40px; align-items: start; }

.tabs { position: sticky; top: 16px; display: grid; gap: 2px; }
.tab { display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 12px; border: 0; border-radius: 10px; background: transparent; color: var(--fd-muted); cursor: pointer; text-align: left; font: 500 15px/20px var(--fd-font-sans); transition: background-color .12s, color .12s; }
.tab .pi { width: 16px; font-size: 14px; text-align: center; }
.tab:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 5%, transparent); }
.tab.on { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.tab.on .pi { color: var(--fd-accent-text); }

.content { display: grid; gap: 40px; min-width: 0; max-width: 680px; }
.skel { display: grid; gap: 16px; }
.sec { display: grid; gap: 4px; }
h2 { margin: 0 0 12px; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.sub { margin: -8px 0 12px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: pretty; }
.card { border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); overflow: hidden; }
.card.pad { padding: 20px; }

/* Rows: label + hint left, value / control right */
.row { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 64px; padding: 14px 20px; }
.row + .row { border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row.col { flex-direction: column; align-items: stretch; gap: 12px; }
.r-text { display: grid; gap: 2px; flex: 1; min-width: 0; }
.r-label { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.r-hint { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); text-wrap: pretty; }
.r-hint.ok { color: var(--fd-accent-text); }
.r-hint .pi { font-size: 11px; }
.r-value { flex-shrink: 0; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.r-ctrl { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tag { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 13px/18px var(--fd-font-sans); }

/* Professional details */
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.f { display: grid; gap: 8px; min-width: 0; }
.f.wide { grid-column: 1 / -1; }
.lbl { color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.in { width: 100%; height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
.in::placeholder { color: var(--fd-muted); opacity: .8; }
.in:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.in.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; color: var(--fd-muted); }
.preview { display: grid; gap: 8px; margin-top: 20px; }
.pv-title { color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.pv-paper { display: grid; justify-items: end; gap: 2px; padding: 16px 20px; border-radius: 10px; border: 1px dashed var(--fd-line); background: var(--fd-bg); text-align: right; }
.pv-line { color: var(--fd-ink); font: 400 13px/19px var(--fd-font-sans); }
.pv-name { font-weight: 600; font-size: 14px; }
.pv-line.empty { color: var(--fd-muted); opacity: .7; }
.foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.note { margin-right: auto; display: inline-flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.note.ok { color: var(--fd-accent-text); }
.note .pi { font-size: 11px; }

/* Credits */
.credits { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.big { flex-shrink: 0; color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); }
.big b { color: var(--fd-ink); font: 600 28px/32px var(--fd-font-sans); }
.bar { height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--fd-ink) 10%, transparent); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 3px; background: var(--fd-accent); }
.link-row { display: flex; gap: 8px; }

/* Security */
.switch { position: relative; flex-shrink: 0; width: 44px; height: 26px; padding: 0; border: 0; border-radius: 999px; background: color-mix(in srgb, var(--fd-ink) 18%, transparent); cursor: pointer; transition: background-color .18s; }
.switch span { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / .3); transition: transform .18s var(--fd-easing, ease); }
.switch[aria-checked='true'] { background: var(--fd-accent); }
.switch[aria-checked='true'] span { transform: translateX(18px); }
.pw-head { display: flex; flex: 1; align-items: center; justify-content: space-between; gap: 24px; min-width: 0; }
.pw-form { display: grid; gap: 14px; max-width: 420px; }
.pw-in { display: flex; align-items: center; height: 44px; padding: 0 4px 0 14px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); transition: border-color .15s, box-shadow .15s; }
.pw-in:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.pw-in.bad { border-color: var(--fd-red); }
.pw-in input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.pw-in button { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.pw-in button:hover { color: var(--fd-ink); }
.err { display: flex; align-items: center; gap: 6px; color: var(--fd-red); font: 400 13px/18px var(--fd-font-sans); }
.err .pi { font-size: 12px; }
.pw-form .foot { justify-content: flex-start; margin-top: 4px; }
.sel { height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans); color-scheme: dark; }
:global(.fd-light) .sel { color-scheme: light; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex-shrink: 0; height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, color .15s, opacity .15s; }
.btn .pi { font-size: 12px; }
.btn.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.btn.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.btn.primary:disabled { opacity: .4; cursor: default; }
.btn.secondary { border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); }
.btn.secondary:hover:not(:disabled) { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.btn.secondary.danger { color: var(--fd-red); }
.btn.ghost { border: 0; background: transparent; color: var(--fd-muted); }
.btn.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.btn:focus-visible, .tab:focus-visible, .switch:focus-visible, .pw-in button:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

@media (max-width: 1023px) { .page { padding: 0 24px; } .layout { grid-template-columns: 180px minmax(0, 1fr); gap: 32px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 56px; }
  .head { margin-bottom: 20px; }
  h1 { font-size: 26px; line-height: 34px; }
  .lead { font-size: 15px; line-height: 24px; }
  .layout { grid-template-columns: 1fr; gap: 24px; }
  .tabs { position: static; display: flex; gap: 6px; overflow-x: auto; margin: 0 -16px; padding: 0 16px 2px; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--fd-line); font-size: 14px; }
  .tab.on { border-color: transparent; }
  .content { gap: 32px; }
  .grid { grid-template-columns: 1fr; }
  .row { gap: 12px; padding: 14px 16px; }
  .row.stack { flex-wrap: wrap; }
  .card.pad { padding: 16px; }
  .credits { flex-direction: column; align-items: flex-start; gap: 8px; }
  .link-row { flex-direction: column; }
  .r-ctrl { width: 100%; }
  .r-ctrl .sel { flex: 1; }
}
</style>
