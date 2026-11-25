const TOKEN_KEY = 'islamicform_admin_token';
const EMAIL_KEY = 'islamicform_admin_email';

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getAdminEmail() {
  return sessionStorage.getItem(EMAIL_KEY) || '';
}

export function saveAdminSession(token, email) {
  sessionStorage.setItem(TOKEN_KEY, token);
  if (email) {
    sessionStorage.setItem(EMAIL_KEY, email);
  }
}

export function clearAdminSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}
