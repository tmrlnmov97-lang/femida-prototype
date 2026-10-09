// Mock data for the coded prototype. Navigation, starters and modes mirror the live product
// (hz.femid.ai, 08.10.2026 — artifacts/reference/femida/live-2026-10/). Answer + sources are
// SAMPLE content for layout only — replace with a real verified answer (CTO question 11).

export type ModeId =
  | 'auto' | 'legal' | 'analyse' | 'draft' | 'court' | 'date' | 'deep' | 'plan' | 'questionnaire';

export interface Mode { id: ModeId; label: string; icon: string; hint: string; badge?: 'recommended' | 'classic'; example: string }

// Example prompts are SAMPLE UX copy (not from the product). Labels/hints: 1:1 with the live product menu "Task for the next question" (live-2026-10/mode-menu-open-ru.png).
export const MODES: Mode[] = [
  { id: 'auto', label: 'Auto', icon: 'pi pi-sparkles', hint: 'A regular question. Depth is chosen automatically.', badge: 'recommended', example: 'What is the deadline for filing an appeal?' },
  { id: 'legal', label: 'Legal analysis', icon: 'pi pi-book', hint: 'Full case analysis using IRAC: issue, rule, application, conclusion.', badge: 'classic', example: 'I was dismissed without notice — do I have grounds to contest it?' },
  { id: 'analyse', label: 'Analyse document', icon: 'pi pi-file-edit', hint: 'Check a contract or another document.', example: 'Check the attached lease agreement for risky clauses.' },
  { id: 'draft', label: 'Draft a document', icon: 'pi pi-pencil', hint: 'A claim, contract, letter or another document.', badge: 'classic', example: 'Draft a claim for unpaid wages.' },
  { id: 'court', label: 'Court practice', icon: 'pi pi-hammer', hint: 'Court decisions on this question.', example: 'How do courts decide on restoring a missed deadline?' },
  { id: 'date', label: 'Law on a date', icon: 'pi pi-calendar', hint: 'Which law was in force on a given date?', example: 'Which version of the Labour Code applied on 15 March 2019?' },
  { id: 'deep', label: 'Deep research', icon: 'pi pi-compass', hint: 'Thorough research with repeated citation checks; takes longer.', badge: 'classic', example: 'Compare cassation practice on dismissal deadlines since 2018.' },
  { id: 'plan', label: 'Plan first', icon: 'pi pi-list-check', hint: 'Get a research plan first; review it, then get the answer.', example: 'Plan research on contesting a dismissal after hospital leave.' },
  { id: 'questionnaire', label: 'Questionnaire (file)', icon: 'pi pi-list', hint: 'Upload a file with questions (docx, pdf, txt, md).', badge: 'classic', example: 'Answer the questions in the attached file.' },
];

export interface NavItem { label: string; icon: string; hint?: string; badge?: string; to?: string }
export const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'Library',
    items: [
      { label: 'My cases', icon: 'pi pi-clipboard', to: '/cases' },
      { label: 'Documents', icon: 'pi pi-folder' },
      { label: 'My notes', icon: 'pi pi-bookmark' },
      // Brief: Watch is in scope as "coming soon" (follow topics, alerts on new laws and decisions).
      { label: 'Watch', icon: 'pi pi-eye', badge: 'Soon' },
    ],
  },
];
// Tools open from one "Tools" row (flyout) so the chat list keeps its room. Hints are from the brief's screen
// descriptions; Work plan is not described in the brief — [OPEN], asked in cto-questions.en.md.
export const TOOLS: NavItem[] = [
  { label: 'Document wizard', icon: 'pi pi-file-edit', hint: 'Five guided steps to a Word or PDF document.' },
  { label: 'Materials studio', icon: 'pi pi-sparkles', hint: 'Summaries, memos, timelines and risks from your files.' },
  { label: 'Law on a date', icon: 'pi pi-calendar', hint: 'Pick a topic and a date to see which laws were in force.' },
  { label: 'Work plan', icon: 'pi pi-list-check' },
  { label: 'Counsel', icon: 'pi pi-briefcase', hint: 'Works with an organisation contract.', badge: 'For organisations' },
];

// Titles: short topics, as an auto-title would give them (proposal — needs backend). Case names are SAMPLE.
export interface ChatItem { id: string; title: string; caseName?: string; status?: 'running' | 'ready'; period: 'Today' | 'Previous 7 days' }
export const CHATS: ChatItem[] = [
  { id: 'c1', title: 'Contesting a dismissal', caseName: 'Avagyan v. Poghosyan', period: 'Today' },
  { id: 'c2', title: 'Appeal deadline', status: 'ready', period: 'Today' },
  { id: 'c3', title: 'Lease agreement review', status: 'running', period: 'Today' },
  { id: 'c4', title: 'Inheritance acceptance terms', period: 'Previous 7 days' },
  { id: 'c5', title: 'Statement of claim', caseName: 'Avagyan v. Poghosyan', period: 'Previous 7 days' },
  { id: 'c6', title: 'State duty in a civil case', period: 'Previous 7 days' },
  { id: 'c7', title: 'Contract termination grounds', period: 'Previous 7 days' },
];

// label — short text on the pill; text — the full question it puts into the composer.
export const STARTERS = [
  { icon: 'pi pi-clock', label: 'Appeal deadline', text: 'What is the deadline for filing an appeal?' },
  { icon: 'pi pi-credit-card', label: 'State duty', text: 'How is the state duty calculated in a civil case?' },
  { icon: 'pi pi-briefcase', label: 'Dismissal grounds', text: 'On what grounds can an employment contract be terminated?' },
  { icon: 'pi pi-book', label: 'Inheritance deadlines', text: 'What are the deadlines for accepting an inheritance?' },
];

export interface Source {
  n: number;
  kind: 'Law' | 'Court decision' | 'ECHR';
  title: string;
  ref: string;
  quote: string;
}

export const SOURCES: Source[] = [
  { n: 1, kind: 'Law', title: 'Labour Code of the Republic of Armenia', ref: 'Article 265',
    quote: '…a claim may be filed with the court within one month of the day the order was handed over…' },
  { n: 2, kind: 'Court decision', title: 'Court of Cassation decision', ref: 'Civil chamber · 2021',
    quote: '…a hospital stay confirmed by medical records is a valid reason to restore the missed period…' },
  { n: 3, kind: 'ECHR', title: 'ECHR judgment', ref: 'Article 6 · fair trial',
    quote: '…procedural time limits must not be applied so rigidly that they deprive a person of access to court…' },
];

// Answer blocks; [n] markers become clickable citations.
export const ANSWER = {
  short: 'Yes. A missed one-month deadline can be restored if the employee had a valid reason, and a hospital stay is one [2].',
  paragraphs: [
    'The claim must normally be filed within one month of the day the dismissal order was handed over [1]. If the employee missed it for a valid reason, the court may restore the period at their request [2].',
  ],
  steps: [
    'File the claim together with a motion to restore the deadline.',
    'Attach hospital records covering the period you missed.',
    'Courts look at whether the reason really prevented filing in time [3].',
  ],
  howFound: ['Searched legislation in force: Labour Code', 'Searched court practice: Court of Cassation', 'Checked ECHR practice: Article 6'],
};

export const DEEP_STEPS = [
  'Plan the research',
  'Search legislation in force',
  'Search court practice (Court of Cassation)',
  'Check ECHR practice',
  'Write the answer with sources',
];

// SAMPLE research plan shown in "Plan first" mode before the answer.
export const PLAN_STEPS = [
  'Find the deadline rule for contesting a dismissal in the Labour Code',
  'Check when the period starts if the order was not handed over',
  'Search Court of Cassation practice on restoring a missed deadline',
  'Check ECHR practice on access to court (Article 6)',
  'Summarise what to file and which documents to attach',
];

// My cases — live product screen (hz.femid.ai, 09.10.2026). Intro copy is 1:1 with the live page; everything else here is SAMPLE
// (Petrosyan v. Alfa is from the live list; Avagyan v. Poghosyan matches the two case chats in CHATS).
export interface CaseChat { id: string; title: string; when: string }
export interface CaseFile { name: string; size: string; added: string }
export interface CaseItem { id: string; name: string; description?: string; updated: string; ts: number; archived?: boolean; chats: CaseChat[]; files: CaseFile[] }
export const CASES: CaseItem[] = [
  { id: 'k1', name: 'Avagyan v. Poghosyan', description: 'Employee dismissed while in hospital. Contesting the dismissal and restoring the missed one-month deadline.', updated: 'Today', ts: 20261009,
    chats: [{ id: 'c1', title: 'Contesting a dismissal', when: 'Today' }, { id: 'c5', title: 'Statement of claim', when: '5 Oct' }],
    files: [{ name: 'Appeal_Avagyan_v_Poghosyan.pdf', size: '2.4 MB', added: '5 Oct' }] },
  { id: 'k2', name: 'Petrosyan v. Alfa — lease termination', description: 'Tenant wants to end a commercial lease early; the landlord claims a penalty and keeps the deposit.', updated: 'Yesterday', ts: 20261008,
    chats: [{ id: 'c3', title: 'Lease agreement review', when: 'Yesterday' }, { id: 'x1', title: 'Notice period for termination', when: '7 Oct' },
      { id: 'x3', title: 'Penalty for early termination', when: '6 Oct' }, { id: 'x4', title: 'Return of the security deposit', when: '4 Oct' }, { id: 'x5', title: 'Landlord access to the premises', when: '2 Oct' }],
    files: [{ name: 'Lease_agreement_2024.docx', size: '312 KB', added: '2 Oct' }, { name: 'Termination_notice.pdf', size: '180 KB', added: '6 Oct' }, { name: 'Payment_history.pdf', size: '96 KB', added: '7 Oct' }] },
  { id: 'k3', name: 'Harutyunyan — inheritance', updated: '6 Oct', ts: 20261006, chats: [], files: [] },
  { id: 'k4', name: 'Grigoryan — labour dispute', description: 'Unpaid overtime and a disputed dismissal. Claim filed in September.', updated: '12 Sep', ts: 20260912, archived: true,
    chats: [{ id: 'x2', title: 'Unpaid overtime claim', when: '12 Sep' }],
    files: [{ name: 'Employment_contract.pdf', size: '410 KB', added: '3 Sep' }, { name: 'Timesheets_2026.pdf', size: '1.1 MB', added: '3 Sep' }] },
];
