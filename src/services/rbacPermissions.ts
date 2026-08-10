import { UserRole } from '../types/saas';

export interface RolePermissions {
  canSearchLeads: boolean;
  canEditCrm: boolean;
  canSendEmails: boolean;
  canExportCsv: boolean;
  canManageTeam: boolean;
  canConfigureIntegrations: boolean;
  canAccessSuperAdmin: boolean;
  canEditClientIcp: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    canSearchLeads: true,
    canEditCrm: true,
    canSendEmails: true,
    canExportCsv: true,
    canManageTeam: true,
    canConfigureIntegrations: true,
    canAccessSuperAdmin: true,
    canEditClientIcp: true
  },
  ADMIN: {
    canSearchLeads: true,
    canEditCrm: true,
    canSendEmails: true,
    canExportCsv: true,
    canManageTeam: true,
    canConfigureIntegrations: true,
    canAccessSuperAdmin: false,
    canEditClientIcp: true
  },
  MANAGER: {
    canSearchLeads: true,
    canEditCrm: true,
    canSendEmails: true,
    canExportCsv: true,
    canManageTeam: true,
    canConfigureIntegrations: false,
    canAccessSuperAdmin: false,
    canEditClientIcp: false
  },
  SALES_USER: {
    canSearchLeads: true,
    canEditCrm: true,
    canSendEmails: true,
    canExportCsv: false,
    canManageTeam: false,
    canConfigureIntegrations: false,
    canAccessSuperAdmin: false,
    canEditClientIcp: false
  },
  VIEWER: {
    canSearchLeads: false,
    canEditCrm: false,
    canSendEmails: false,
    canExportCsv: true,
    canManageTeam: false,
    canConfigureIntegrations: false,
    canAccessSuperAdmin: false,
    canEditClientIcp: false
  }
};

export function hasPermission(role: UserRole, permissionKey: keyof RolePermissions): boolean {
  const perm = ROLE_PERMISSIONS[role];
  return perm ? Boolean(perm[permissionKey]) : false;
}
