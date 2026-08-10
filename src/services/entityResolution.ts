import { StandardSourceRecord } from './connectors/connectorRegistry';

export interface ResolvedEntity {
  companyName: string;
  normalizedName: string;
  domain?: string;
  industry: string;
  location: string;
  sources: StandardSourceRecord[];
  mergedEmail?: string;
  mergedPhone?: string;
  mergedDecisionMaker?: string;
}

export function resolveSourceEntities(records: StandardSourceRecord[]): ResolvedEntity[] {
  const entityMap = new Map<string, ResolvedEntity>();

  for (const record of records) {
    const norm = record.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!entityMap.has(norm)) {
      entityMap.set(norm, {
        companyName: record.companyName,
        normalizedName: norm,
        domain: record.companyUrl,
        industry: record.industry,
        location: record.location,
        sources: [record],
        mergedEmail: record.email,
        mergedPhone: record.phone,
        mergedDecisionMaker: record.personName
      });
    } else {
      const existing = entityMap.get(norm)!;
      existing.sources.push(record);
      if (!existing.mergedEmail && record.email) existing.mergedEmail = record.email;
      if (!existing.mergedPhone && record.phone) existing.mergedPhone = record.phone;
      if (!existing.mergedDecisionMaker && record.personName) existing.mergedDecisionMaker = record.personName;
    }
  }

  return Array.from(entityMap.values());
}
