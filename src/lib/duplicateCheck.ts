import type { Student } from '@/lib/mockData';

function normalizePhone(phone?: string): string {
  return (phone ?? '').replace(/[^0-9]/g, '');
}

function normalizeEmail(email?: string): string {
  return (email ?? '').trim().toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Small edit-distance check so "Almaz Kebede" vs "Almaz Kebde" still flags as a likely typo. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

export interface DuplicateCandidate {
  name: string;
  parentPhone?: string;
  parentEmail?: string;
  dateOfBirth?: string;
}

/** Client-side, best-effort — mirrors the exact-match rules the backend already applies to
 * public admissions applications (name+DOB, name+parent contact), plus a small fuzzy-name
 * pass for typo tolerance. The direct-enroll path bypasses admissions entirely, so nothing
 * else checks for this today. */
export function findPossibleDuplicates(students: Student[], candidate: DuplicateCandidate): Student[] {
  const name = normalizeName(candidate.name);
  const phone = normalizePhone(candidate.parentPhone);
  const email = normalizeEmail(candidate.parentEmail);
  if (!name) return [];

  return students.filter((s) => {
    if (s.status !== 'Active' && s.status !== 'Suspended') return false;
    const sName = normalizeName(s.name);
    const sPhone = normalizePhone(s.parentPhone);
    const sEmail = normalizeEmail(s.parentEmail);

    const sameDob = !!candidate.dateOfBirth && !!s.dateOfBirth && candidate.dateOfBirth === s.dateOfBirth;
    const sameContact = (!!phone && phone === sPhone) || (!!email && email === sEmail);
    const exactNameMatch = sName === name;
    const closeNameMatch = !exactNameMatch && levenshtein(sName, name) <= 2 && Math.min(sName.length, name.length) > 4;

    if (exactNameMatch && (sameDob || sameContact)) return true;
    if (closeNameMatch && sameContact) return true;
    return false;
  });
}
