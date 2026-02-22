export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("too many requests");
}

const ERROR_MAP: Record<string, string> = {
  "email rate limit exceeded": "ელფოსტის გაგზავნის ლიმიტს გადააჭარბე. ცოტა ხანში სცადე თავიდან ან დროებით გამორთე Email Confirmation Supabase-ში.",
  "Invalid login credentials": "ელფოსტა ან პაროლი არასწორია.",
  "User already registered": "ეს ელფოსტა უკვე რეგისტრირებულია.",
  "Signup requires a valid password": "პაროლი არასწორი ფორმატისაა.",
  "Unable to validate email address: invalid format": "ელფოსტის ფორმატი არასწორია.",
  "Email not confirmed": "ელფოსტა ჯერ არ არის დადასტურებული.",
};

export function translateAuthError(message: string): string {
  if (isRateLimitError(message)) {
    return ERROR_MAP["email rate limit exceeded"];
  }
  return ERROR_MAP[message] ?? message;
}
