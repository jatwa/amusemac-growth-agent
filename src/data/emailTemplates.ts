import { Lead } from '../types/lead';
import { EmailTemplate } from '../types/email';

export const REUSABLE_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial-outreach',
    name: 'Initial Project Outreach',
    subjectTemplate: 'Regarding {{company_name}}\'s project — Amusemac Studio Proposal',
    bodyTemplate: `Hi {{contact_name}},

I was following {{company_name}}'s recent work in {{location}} and noticed your active requirement for {{service}}.

At Amusemac Studio (MAD ABOUT CINEMA), we specialize in {{service}}, Production Design, and End-to-End Creative Execution. {{reason_this_lead_is_relevant}}

We have turnkey line production crews and soundstages ready to support your upcoming shoot schedule.

Would you be open to a 10-minute discovery call next Tuesday or Wednesday?

Best regards,

Business Development Team
Amusemac Studio | MAD ABOUT CINEMA
hello@amusemacstudio.in
https://amusemac.com`
  },
  {
    id: 'followup-1',
    name: 'Follow-up #1 (3 Days Later)',
    subjectTemplate: 'Re: Regarding {{company_name}}\'s project — Amusemac Studio Proposal',
    bodyTemplate: `Hi {{contact_name}},

Following up on my previous note regarding {{company_name}}'s {{service}} requirement.

We recently wrapped a similar production campaign and would love to share a 60-second visual breakdown tailored for your team.

Do you have 5 minutes this week for a brief touchpoint?

Best regards,

Business Development Team
Amusemac Studio | MAD ABOUT CINEMA
hello@amusemacstudio.in`
  },
  {
    id: 'followup-2',
    name: 'Follow-up #2 (Final Check-in)',
    subjectTemplate: 'Re: Amusemac Studio + {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},

Last check-in from my side! If {{company_name}} is currently evaluating external production partners or studio facilities for upcoming projects, we'd be glad to submit a formal quote.

Otherwise, I'll touch base next quarter!

Best regards,

Business Development Team
Amusemac Studio
hello@amusemacstudio.in`
  },
  {
    id: 'meeting-request',
    name: 'Discovery Meeting Request',
    subjectTemplate: '10-min Intro Call: Amusemac Studio & {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},

Hope you're having a great week.

We'd love to schedule a brief 10-minute call to introduce Amusemac Studio's commercial film production and custom set engineering workflows to {{company_name}}.

Are you available this Thursday at 2:00 PM or Friday at 11:00 AM?

Warm regards,

Amusemac Studio Team
hello@amusemacstudio.in`
  },
  {
    id: 'proposal-followup',
    name: 'Proposal Follow-up',
    subjectTemplate: 'Following up on our Production Proposal for {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},

Following up on the production proposal and rate deck we submitted for {{company_name}}.

Have you or your team had a chance to review the scope? I'd be happy to answer any questions or refine line items based on your budget targets.

Best regards,

Amusemac Studio Team
hello@amusemacstudio.in`
  },
  {
    id: 'thank-you',
    name: 'Post-Call Thank You',
    subjectTemplate: 'Thank you for connecting with Amusemac Studio!',
    bodyTemplate: `Hi {{contact_name}},

Thank you for taking the time to speak with us today regarding {{company_name}}'s upcoming production needs in {{location}}.

As discussed, I will put together a detailed project brief and line item quote for your review.

Looking forward to collaborating!

Warm regards,

Business Development Team
Amusemac Studio
hello@amusemacstudio.in`
  },
  {
    id: 'custom',
    name: 'Custom Email',
    subjectTemplate: 'Message for {{company_name}}',
    bodyTemplate: `Hi {{contact_name}},\n\n[Write your custom message here]\n\nBest regards,\nAmusemac Studio\nhello@amusemacstudio.in`
  }
];

/**
 * Replaces dynamic variables in subject and body templates with verified lead data
 */
export function populateTemplateVariables(templateStr: string, lead?: Partial<Lead>): string {
  if (!lead) return templateStr;

  const company = lead.companyName || 'your team';
  const person = lead.decisionMakerName && lead.decisionMakerName !== 'Not found' ? lead.decisionMakerName : 'Team';
  const service = lead.primaryService || lead.serviceNeed || 'Commercial Production';
  const location = lead.location && lead.location !== 'Not found' ? lead.location : 'your region';
  const reason = lead.priorityReason || lead.whyThisLead || `${company} has strong visual campaign requirements.`;

  return templateStr
    .replace(/\{\{company_name\}\}/g, company)
    .replace(/\{\{contact_name\}\}/g, person)
    .replace(/\{\{service\}\}/g, service)
    .replace(/\{\{location\}\}/g, location)
    .replace(/\{\{reason_this_lead_is_relevant\}\}/g, reason);
}
