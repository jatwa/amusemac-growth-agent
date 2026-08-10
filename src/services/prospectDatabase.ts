import { RawCompany, Lead } from '../types/lead';

/**
 * Normalizes company strings for accurate deduplication
 */
export function normalizeCompanyKey(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Extract clean domain name from URL
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase().replace(/[^a-z0-9.]/g, '');
  }
}

export interface DeduplicationResult {
  uniqueCompanies: RawCompany[];
  duplicateCount: number;
}

/**
 * Aggressive deduplication against raw pool and existing CRM leads
 */
export function deduplicateRawCompanies(
  rawPool: RawCompany[],
  existingLeads: Lead[] = []
): DeduplicationResult {
  const seenKeys = new Set<string>();

  // Add existing CRM leads to seenKeys
  existingLeads.forEach(lead => {
    if (lead.companyName) seenKeys.add(normalizeCompanyKey(lead.companyName));
    if (lead.website) seenKeys.add(extractDomain(lead.website));
  });

  const uniqueCompanies: RawCompany[] = [];
  let duplicateCount = 0;

  for (const raw of rawPool) {
    const nameKey = normalizeCompanyKey(raw.companyName);
    const domainKey = extractDomain(raw.website);
    const phoneKey = raw.phone ? raw.phone.replace(/[^0-9]/g, '') : '';

    const isDup =
      (nameKey && seenKeys.has(nameKey)) ||
      (domainKey && seenKeys.has(domainKey)) ||
      (phoneKey && phoneKey.length >= 8 && seenKeys.has(phoneKey));

    if (isDup) {
      duplicateCount++;
    } else {
      if (nameKey) seenKeys.add(nameKey);
      if (domainKey) seenKeys.add(domainKey);
      if (phoneKey && phoneKey.length >= 8) seenKeys.add(phoneKey);
      uniqueCompanies.push(raw);
    }
  }

  return { uniqueCompanies, duplicateCount };
}
