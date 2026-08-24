import { User, Organization, AuthProviderType, AuthIdentity } from '../types/saas';
import { INITIAL_USERS, INITIAL_ORGANIZATIONS } from '../data/plansCatalog';
import { loadOrganizationsList, saveOrganizationsList } from './tenantStore';

export interface AuthSession {
  user: User;
  organization: Organization;
  token: string;
  expiresAt: string;
}

const AUTH_SESSION_KEY = 'amusemac_auth_session';
const USER_STORE_KEY = 'amusemac_users_list';

/**
 * Collision-safe UUID generator
 */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolves real display name according to strict priority:
 * profile name -> given_name + family_name -> email title-cased name.
 * Never uses "GOOGLE User" or provider defaults.
 */
export function resolveDisplayName(
  profileName?: string,
  givenName?: string,
  familyName?: string,
  email?: string
): string {
  if (profileName && profileName.trim() && !profileName.toLowerCase().includes('user')) {
    return profileName.trim();
  }
  if (givenName && givenName.trim()) {
    return `${givenName.trim()} ${familyName ? familyName.trim() : ''}`.trim();
  }
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    const parts = prefix.replace(/[._-]/g, ' ').split(' ').filter(Boolean);
    if (parts.length > 0) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }
  return 'Workspace Member';
}

/**
 * Loads persisted user accounts list
 */
export function loadUsersList(): User[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(USER_STORE_KEY);
      if (saved) return JSON.parse(saved);
    }
  } catch (e) {}
  return INITIAL_USERS;
}

/**
 * Saves persisted user accounts list
 */
export function saveUsersList(users: User[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_STORE_KEY, JSON.stringify(users));
    }
  } catch (e) {}
}

/**
 * Retrieves current active authenticated session if valid
 */
export function getCurrentSession(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(AUTH_SESSION_KEY);
    if (!saved) return null;
    const session: AuthSession = JSON.parse(saved);

    // Check 24h session expiry
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Saves authenticated session
 */
export function saveSession(user: User, organization: Organization): AuthSession {
  const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 Hours
  const tokenPayload = {
    userId: user.userId,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    plan: organization.planId || 'FREE',
    exp: Date.now() + 86400000
  };
  const jsonStr = JSON.stringify(tokenPayload);
  const b64 = typeof btoa !== 'undefined'
    ? btoa(jsonStr)
    : Buffer.from(jsonStr).toString('base64');
  const encodedPayload = b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const token = `amu_sess_${encodedPayload}`;

  const session: AuthSession = {
    user,
    organization,
    token,
    expiresAt
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    }
  } catch (e) {}
  return session;
}

/**
 * Authenticates Admin user server-side via POST /api/auth/login
 */
export async function loginAdminServer(email: string, password: string): Promise<AuthSession> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.session) {
    throw new Error(data.message || 'Invalid admin email or password.');
  }

  const session: AuthSession = data.session;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    }
  } catch (e) {}
  return session;
}

/**
 * Authenticates user via Email & Password
 */
export async function loginUser(email: string, password: string): Promise<AuthSession> {
  return loginAdminServer(email, password);
}

/**
 * Resolves Google Client ID across Vite build-time env, window runtime config, and backend /api/config
 */
export async function getGoogleClientId(): Promise<string> {
  const envVal = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envVal && typeof envVal === 'string' && envVal.trim() && !envVal.includes('YOUR_GOOGLE_CLIENT_ID')) {
    return envVal.trim();
  }

  if (typeof window !== 'undefined' && (window as any).__AMUSEMAC_CONFIG__?.GOOGLE_CLIENT_ID) {
    const winVal = (window as any).__AMUSEMAC_CONFIG__.GOOGLE_CLIENT_ID;
    if (winVal && typeof winVal === 'string' && winVal.trim()) {
      return winVal.trim();
    }
  }

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.googleClientId) {
        return data.googleClientId.trim();
      }
    }
  } catch (e) {}

  return '';
}

/**
 * Authenticates user via Google OAuth ID Token server-side verification
 */
export async function verifyGoogleAuthWithBackend(idToken: string): Promise<AuthSession> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idToken })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Google OAuth verification failed');
  }

  saveSession(data.session.user, data.session.organization);
  return data.session;
}

/**
 * Authenticates user via Zoho OAuth authorization code server-side verification
 */
export async function verifyZohoAuthWithBackend(code: string, state?: string): Promise<AuthSession> {
  const res = await fetch('/api/auth/zoho/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, state })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Zoho OAuth verification failed');
  }

  saveSession(data.session.user, data.session.organization);
  return data.session;
}

/**
 * Authenticates user via OAuth Provider (Google, Zoho)
 */
export async function loginWithOAuthProvider(
  provider: AuthProviderType,
  userEmail?: string,
  userName?: string,
  givenName?: string,
  familyName?: string
): Promise<AuthSession> {
  await new Promise(r => setTimeout(r, 400));

  const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : `user_${generateUuid().slice(0, 8)}@gmail.com`;
  const displayName = resolveDisplayName(userName, givenName, familyName, cleanEmail);

  const users = loadUsersList();
  const orgs = loadOrganizationsList();

  // 1. Check if user already exists
  const foundUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (foundUser) {
    const targetOrg = orgs.find(o => o.orgId === foundUser.orgId) || INITIAL_ORGANIZATIONS[0];
    return saveSession(foundUser, targetOrg);
  }

  // 2. Check if matching org exists by admin email
  const matchingOrg = orgs.find(o => o.adminEmail.toLowerCase() === cleanEmail);
  if (matchingOrg) {
    const matchedUser: User = {
      userId: `usr-${matchingOrg.orgId}-admin`,
      orgId: matchingOrg.orgId,
      email: cleanEmail,
      name: displayName,
      fullName: displayName,
      whatsappNumber: '',
      emailVerified: true,
      whatsappVerified: false,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: matchingOrg.createdAt,
      authIdentities: [
        {
          identityId: `id-${provider.toLowerCase()}-${generateUuid()}`,
          userId: `usr-${matchingOrg.orgId}-admin`,
          provider,
          providerAccountId: `acct-${provider.toLowerCase()}-${generateUuid()}`,
          email: cleanEmail,
          name: displayName,
          connectedAt: new Date().toISOString(),
          isPrimary: true
        }
      ]
    };
    saveUsersList([...users, matchedUser]);
    return saveSession(matchedUser, matchingOrg);
  }

  // 3. NEW CUSTOMER VIA OAUTH: Create isolated customer workspace on FREE plan
  const newOrgId = `org-cust-${generateUuid()}`;

  const newOrg: Organization = {
    orgId: newOrgId,
    companyName: `${displayName}'s Workspace`,
    tagline: 'SaaS Customer Workspace',
    website: 'https://',
    status: 'ACTIVE',
    planId: 'FREE', // ALWAYS assign FREE plan to new signups!
    emailConfig: {
      provider: 'CUSTOM_SMTP',
      email: cleanEmail,
      status: 'SIMULATED'
    },
    connectedMailboxes: [],
    sheetsWebhookUrl: '',
    createdAt: new Date().toISOString().slice(0, 10),
    renewalDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    adminEmail: cleanEmail,
    adminName: displayName,
    notes: `Created via ${provider} OAuth`
  };

  const newUser: User = {
    userId: `usr-${newOrgId}-admin`,
    orgId: newOrgId,
    email: cleanEmail,
    name: displayName,
    fullName: displayName,
    whatsappNumber: '',
    emailVerified: true,
    whatsappVerified: false,
    role: 'ADMIN', // Org Admin ONLY (NOT platform SUPER_ADMIN)
    status: 'ACTIVE',
    createdAt: new Date().toISOString().slice(0, 10),
    authIdentities: [
      {
        identityId: `id-${provider.toLowerCase()}-${generateUuid()}`,
        userId: `usr-${newOrgId}-admin`,
        provider,
        providerAccountId: `acct-${provider.toLowerCase()}-${generateUuid()}`,
        email: cleanEmail,
        name: displayName,
        connectedAt: new Date().toISOString(),
        isPrimary: true
      }
    ]
  };

  saveOrganizationsList([...orgs, newOrg]);
  saveUsersList([...users, newUser]);
  return saveSession(newUser, newOrg);
}

/**
 * Registers new user and organization via signup form
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function signupUser(
  companyName: string,
  email: string,
  password: string
): Promise<AuthSession> {
  await new Promise(r => setTimeout(r, 400));

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid work email address');
  }

  const passValidation = validatePasswordPolicy(password);
  if (!passValidation.valid) {
    throw new Error(`Password policy failed: ${passValidation.errors.join('. ')}`);
  }

  const displayName = companyName.trim() + ' Admin';
  const newOrgId = `org-cust-${generateUuid()}`;

  const newOrg: Organization = {
    orgId: newOrgId,
    companyName: companyName.trim(),
    tagline: 'SaaS Client Workspace',
    website: 'https://',
    status: 'ACTIVE',
    planId: 'FREE', // Assign FREE plan by default
    trialEndDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    emailConfig: {
      provider: 'CUSTOM_SMTP',
      email: cleanEmail,
      status: 'SIMULATED'
    },
    connectedMailboxes: [],
    sheetsWebhookUrl: '',
    createdAt: new Date().toISOString().slice(0, 10),
    renewalDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    adminEmail: cleanEmail,
    adminName: displayName,
    notes: 'Created via Customer Signup'
  };

  const newUser: User = {
    userId: `usr-${newOrgId}-admin`,
    orgId: newOrgId,
    email: cleanEmail,
    name: displayName,
    fullName: displayName,
    whatsappNumber: '',
    emailVerified: true,
    whatsappVerified: false,
    role: 'ADMIN', // Org Admin ONLY
    status: 'ACTIVE',
    createdAt: new Date().toISOString().slice(0, 10),
    authIdentities: [
      {
        identityId: `id-email-${generateUuid()}`,
        userId: `usr-${newOrgId}-admin`,
        provider: 'EMAIL',
        providerAccountId: cleanEmail,
        email: cleanEmail,
        connectedAt: new Date().toISOString(),
        isPrimary: true
      }
    ]
  };

  const existingOrgs = loadOrganizationsList();
  const existingUsers = loadUsersList();

  saveOrganizationsList([...existingOrgs, newOrg]);
  saveUsersList([...existingUsers, newUser]);

  return saveSession(newUser, newOrg);
}

/**
 * Logs out active authenticated session
 */
export function logoutUser(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (e) {}
}
