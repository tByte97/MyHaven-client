// Підписані Telegram дані запуску WebApp (initData). Бекенд перевіряє їх
// підпис і видає короткоживучий access-токен, тож JWT в URL не потрібен.
export function getTelegramInitData() {
  const fromSdk = window.Telegram?.WebApp?.initData;
  if (fromSdk) return fromSdk;

  // Без telegram-web-app.js: Telegram передає initData у фрагменті URL
  // як #tgWebAppData=<urlencoded initData>&tgWebAppVersion=...
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return '';
  return new URLSearchParams(hash).get('tgWebAppData') || '';
}
