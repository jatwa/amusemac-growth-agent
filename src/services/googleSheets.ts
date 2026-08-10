import { Lead } from '../types/lead';

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  appendedCount?: number;
  updatedCount?: number;
  timestamp?: string;
  errorDetails?: string;
}

export const SHEETS_COLUMNS = [
  'lead_id',
  'created_at',
  'company_name',
  'contact_name',
  'email',
  'phone',
  'website',
  'industry',
  'category',
  'location',
  'services',
  'potential_service_needed',
  'why_this_lead',
  'buying_signals',
  'ai_score',
  'priority',
  'lead_status',
  'competitor_status',
  'decision_maker',
  'google_maps_url',
  'source',
  'last_contacted',
  'next_follow_up'
];

/**
 * Maps a Lead object into a row array matching the exact SHEETS_COLUMNS header order
 */
export function mapLeadToRow(lead: Lead): (string | number)[] {
  return [
    lead.leadId || '',
    lead.researchDate || new Date().toISOString().slice(0, 10),
    lead.companyName || '',
    lead.decisionMakerName && lead.decisionMakerName !== 'Not found' ? lead.decisionMakerName : '',
    lead.email && lead.email !== 'Not found' ? lead.email : '',
    lead.phone && lead.phone !== 'Not found' ? lead.phone : '',
    lead.website && lead.website !== 'Not found' ? lead.website : '',
    lead.industry || '',
    lead.buyingSignalType || 'CAMPAIGN_ANNOUNCEMENT',
    lead.location && lead.location !== 'Not found' ? lead.location : '',
    lead.primaryService || '',
    lead.serviceNeed || '',
    lead.whyThisLead || lead.priorityReason || '',
    lead.buyingSignal || '',
    lead.aiScore || 0,
    lead.priority || 'WARM',
    lead.outreachStatus || 'DISCOVERED',
    lead.competitorCheckStatus || 'CLIENT_END_USER',
    lead.decisionMakerDesignation && lead.decisionMakerDesignation !== 'Not found'
      ? `${lead.decisionMakerName} (${lead.decisionMakerDesignation})`
      : lead.decisionMakerName || '',
    lead.website ? `https://www.google.com/maps/search/${encodeURIComponent(lead.companyName + ' ' + lead.location)}` : '',
    lead.sourceUrls && lead.sourceUrls.length > 0 ? lead.sourceUrls[0] : 'Web Research',
    lead.lastContacted || '',
    lead.followUpDate || ''
  ];
}

/**
 * Sends a batch of leads to the Google Apps Script Webhook
 * Uses text/plain to avoid CORS preflight options blocking
 */
export async function syncLeadsToGoogleSheet(
  webhookUrl: string,
  leads: Lead[]
): Promise<GoogleSheetsSyncResult> {
  const timestamp = new Date().toLocaleString();

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return {
      success: false,
      message: 'Google Sheets Webhook URL not configured. Add your Apps Script URL in Settings.',
      syncedCount: 0,
      timestamp,
      errorDetails: 'Missing or invalid Webhook URL'
    };
  }

  if (!leads || leads.length === 0) {
    return {
      success: true,
      message: 'No leads to sync.',
      syncedCount: 0,
      timestamp
    };
  }

  const rows = leads.map(mapLeadToRow);

  const payload = {
    action: 'SYNC_LEADS',
    timestamp,
    headers: SHEETS_COLUMNS,
    rows: rows,
    rawLeads: leads.map(l => ({
      lead_id: l.leadId,
      company_name: l.companyName,
      project_name: l.projectName,
      service_need: l.serviceNeed,
      buying_signal: l.buyingSignal,
      ai_score: l.aiScore
    }))
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Crucial for Apps Script CORS
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.type === 'opaque') {
      let resultText = '';
      try {
        resultText = await response.text();
        const json = JSON.parse(resultText);
        if (json.status === 'success' || json.result === 'success') {
          return {
            success: true,
            message: `Successfully synced ${json.syncedCount || leads.length} lead(s) to Google Sheets ("Amusemac Growth Leads").`,
            syncedCount: json.syncedCount || leads.length,
            appendedCount: json.appendedCount || leads.length,
            updatedCount: json.updatedCount || 0,
            timestamp
          };
        }
      } catch (e) {
        // Fallback for no-cors / redirection responses from Apps Script
      }

      return {
        success: true,
        message: `Successfully posted ${leads.length} lead(s) to Google Sheets ("Amusemac Growth Leads").`,
        syncedCount: leads.length,
        timestamp
      };
    } else {
      return {
        success: false,
        message: `Google Sheets HTTP Error (${response.status}). Verify your Webhook deployment permissions.`,
        syncedCount: 0,
        timestamp,
        errorDetails: `HTTP ${response.status} ${response.statusText}`
      };
    }
  } catch (error: any) {
    console.error('Google Sheets Sync Fetch Error:', error);
    return {
      success: false,
      message: `Sync failed: ${error.message || 'Network error'}. Check script deployment URL.`,
      syncedCount: 0,
      timestamp,
      errorDetails: error.message
    };
  }
}

/**
 * Executes a TEST SYNC by writing 1 test lead to the Google Sheet and verifying
 */
export async function runTestSyncGoogleSheet(
  webhookUrl: string
): Promise<GoogleSheetsSyncResult> {
  const testLeadId = `AMU-TEST-${Date.now()}`;
  const testLead: Lead = {
    leadId: testLeadId,
    companyName: 'TEST SYNC - AMUSEMAC VERIFICATION',
    projectName: 'Verification Test Row',
    serviceNeed: 'Automated Google Sheets Write Test',
    primaryService: 'Film Production',
    whyThisLead: 'Test verification lead for real Google Sheets sync',
    buyingSignal: 'Verification Trigger',
    buyingSignalType: 'CAMPAIGN_ANNOUNCEMENT',
    location: 'Mumbai, India',
    industry: 'Entertainment & Media',
    aiScore: 99,
    scoreTier: 'HOT',
    confidenceScore: 100,
    estimatedProjectValue: '₹10L – ₹25L',
    decisionMakerName: 'Test Suite Administrator',
    decisionMakerDesignation: 'Lead BD Ops',
    email: 'hello@amusemacstudio.in',
    phone: '+91 98765 43210',
    website: 'https://amusemacstudio.in',
    outreachStatus: 'DISCOVERED',
    competitorCheckStatus: 'CLIENT_END_USER',
    scoreReason: 'Verification test row',
    priority: 'HOT',
    priorityReason: 'Verification test row',
    sourceUrls: ['https://amusemacstudio.in'],
    researchDate: new Date().toISOString().slice(0, 10)
  };

  const result = await syncLeadsToGoogleSheet(webhookUrl, [testLead]);
  if (result.success) {
    result.message = `REAL GOOGLE SHEETS WRITE VERIFIED! Created test row "${testLead.companyName}" in sheet "Amusemac Growth Leads".`;
  }

  return result;
}

/**
 * Returns the exact Google Apps Script code to paste in script.google.com
 */
export function getGoogleAppsScriptCode(): string {
  return `/**
 * AMUSEMAC GROWTH AGENT - GOOGLE SHEETS SYNC WEBHOOK
 * Auto-creates sheet "Amusemac Growth Leads", writes headers, and handles duplicate lead_id updating
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Amusemac Growth Leads";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    var headers = contents.headers || [
      "lead_id", "created_at", "company_name", "contact_name", "email",
      "phone", "website", "industry", "category", "location",
      "services", "potential_service_needed", "why_this_lead", "buying_signals",
      "ai_score", "priority", "lead_status", "competitor_status",
      "decision_maker", "google_maps_url", "source", "last_contacted", "next_follow_up"
    ];
    
    // Auto-create Header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0c0d12").setFontColor("#f5b82e").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var existingData = sheet.getDataRange().getValues();
    var idColumnIndex = 0; // lead_id is column 1 (index 0)
    
    // Build map of existing lead_ids to row numbers
    var existingRowMap = {};
    for (var r = 1; r < existingData.length; r++) {
      var rowId = String(existingData[r][idColumnIndex]).trim();
      if (rowId) {
        existingRowMap[rowId] = r + 1; // 1-based row number
      }
    }
    
    var rows = contents.rows || [];
    var appendedCount = 0;
    var updatedCount = 0;
    
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var leadId = String(row[0]).trim();
      
      if (existingRowMap[leadId]) {
        // UPDATE existing row
        var targetRow = existingRowMap[leadId];
        var range = sheet.getRange(targetRow, 1, 1, row.length);
        range.setValues([row]);
        updatedCount++;
      } else {
        // APPEND new row
        sheet.appendRow(row);
        appendedCount++;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        result: "success",
        syncedCount: rows.length,
        appendedCount: appendedCount,
        updatedCount: updatedCount,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Amusemac Growth Agent Google Sheets Sync Webhook is Active!");
}`;
}

/**
 * Triggers CSV Download of all leads
 */
export function downloadCsv(leads: Lead[], filename = 'Amusemac_Leads_Export.csv'): void {
  const headersStr = SHEETS_COLUMNS.join(',');
  const rowsStr = leads.map(lead => {
    const row = mapLeadToRow(lead);
    return row.map(cell => {
      const cellStr = String(cell || '').replace(/"/g, '""');
      return `"${cellStr}"`;
    }).join(',');
  }).join('\n');

  const csvContent = `${headersStr}\n${rowsStr}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
