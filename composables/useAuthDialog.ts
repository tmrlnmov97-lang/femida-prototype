// Sign-in dialog over the website (AuthCard from Figma 28:228). Opened by the landing composer with the guest's question,
// or by Log in / Try free / Start free without one. After sign-in the question is sent in the app (useChat.pendingAsk).
export type AuthStep = 'register' | 'login' | 'code' | 'forgot';
export function useAuthDialog() {
  const auth = useState('fd-auth', () => ({ open: false, step: 'register' as AuthStep, question: '' }));
  function openAuth(step: AuthStep = 'register', question = '') {
    auth.value = { open: true, step, question: question.trim() };
  }
  function closeAuth() { auth.value = { ...auth.value, open: false }; }
  return { auth, openAuth, closeAuth };
}
