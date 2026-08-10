import { Lead } from '../types/lead';
import { EmailTemplate } from '../types/email';
import { Organization } from '../types/saas';

export const REUSABLE_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial-outreach',
    name: 'Initial Project Outreach',
    subjectTemplate: 'Regarding {{company_name}}\'s project — Proposal',
    bodyTemplate: `Hi {{contact_name}},

I was following {{company_name}}'s recent work in {{location}} and noticed your active requirement for {{service}}.

At {{sender_company}}, we specialize in {{service}} and End-to-End Execution. {{reason_this_lead_is_relevant}}

Would you be open to a 10-minute discovery call next Tuesday or Wednesday?

Best regards,

Business Development Team
{{sender_company}}
{{sender_email}}`
  },
  {
    id: 'followup-1',
    name: 'Follow-up #1 (3 Days Later)',
    subjectTemplate: 'Re: Regarding {{company_name}}\'s project — Proposal',
    bodyTemplate: `Hi {{contact_name}},

Following up on my previous note regarding {{company_name}}'s {{service}} requirement.

We recently wrapped a similar campaign and would love to share a brief breakdown tailored for your team.

Do you have 5 minutes this week for a brief touchpoint?

Best regards,

Business Development Team
{{sender_company}}
{{sender_email}}`
  },
  {
    id: 'followup-2',
    name: 'Follow-up #2 (Final Check-in)',
    subjectTemplate: 'Re: {{sender_company}} + {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},

Last check-in from my side! If {{company_name}} is currently evaluating external partners for upcoming projects, we'd be glad to submit a formal quote.

Otherwise, I'll touch base next quarter!

Best regards,

Business Development Team
{{sender_company}}
{{sender_email}}`
  },
  {
    id: 'meeting-request',
    name: 'Discovery Meeting Request',
    subjectTemplate: '10-min Intro Call: {{sender_company}} & {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},

Hope you're having a great week.

We'd love to schedule a brief 10-minute call to introduce {{sender_company}}'s workflows to {{company_name}}.

Are you available this Thursday at 2:00 PM or Friday at 11:00 AM?

Warm regards,

{{sender_company}} Team
{{sender_email}}`
  },
  {
    id: 'proposal-followup',
    name: 'Proposal Follow-up',
    subjectTemplate: 'Following up on our Proposal for {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},

Following up on the proposal and rate deck we submitted for {{company_name}}.

Have you or your team had a chance to review the scope? I'd be happy to answer any questions or refine line items based on your budget targets.

Best regards,

{{sender_company}} Team
{{sender_email}}`
  },
  {
    id: 'thank-you',
    name: 'Post-Call Thank You',
    subjectTemplate: 'Thank you for connecting with {{sender_company}}!',
    bodyTemplate: `Hi {{contact_name}},

Thank you for taking the time to speak with us today regarding {{company_name}}'s upcoming needs in {{location}}.

As discussed, I will put together a detailed project brief and line item quote for your review.

Looking forward to collaborating!

Warm regards,

Business Development Team
{{sender_company}}
{{sender_email}}`
  },
  {
    id: 'custom',
    name: 'Custom Email',
    subjectTemplate: 'Message for {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},\n\n[Write your custom message here]\n\nBest regards,\n{{sender_company}}\n{{sender_email}}`
  }
];

/**
 * Replaces dynamic variables in subject and body templates with verified lead and org data
 */
export function populateTemplateVariables(templateStr: string, lead?: Partial<Lead>, org?: Organization): string {
  if (!templateStr) return '';

  const company = lead?.companyName || 'your team';
  const person = lead?.decisionMakerName && lead.decisionMakerName !== 'Not found' ? lead.decisionMakerName : 'Team';
  const service = lead?.primaryService || lead?.serviceNeed || 'Commercial Services';
  const location = lead?.location && lead.location !== 'Not found' ? lead.location : 'your region';
  const reason = lead?.priorityReason || lead?.whyThisLead || `${company} has strong prospective interest.`;

  const senderCompany = org?.companyName || 'Our Business';
  const senderEmail = org?.adminEmail || org?.emailConfig?.email || 'outreach@company.com';

  let result = templateStr
    .replace(/\{\{company_name\}\}/g, company)
    .replace(/\{\{contact_name\}\}/g, person)
    .replace(/\{\{service\}\}/g, service)
    .replace(/\{\{location\}\}/g, location)
    .replace(/\{\{reason_this_lead_is_relevant\}\}/g, reason)
    .replace(/\{\{sender_company\}\}/g, senderCompany)
    .replace(/\{\{sender_email\}\}/g, senderEmail);

  if (org && org.orgId !== 'amusemac-studio') {
    result = result
      .replace(/Amusemac Studio \| MAD ABOUT CINEMA/g, senderCompany)
      .replace(/Amusemac Studio \(MAD ABOUT CINEMA\)/g, senderCompany)
      .replace(/Amusemac Studio/g, senderCompany)
      .replace(/hello@amusemacstudio.in/g, senderEmail)
      .replace(/https:\/\/amusemac\.com/g, org.website || 'https://');
  }

  return result;
}
