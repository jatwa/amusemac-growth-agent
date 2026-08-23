import fs from 'fs';
import { INITIAL_USERS, INITIAL_ORGANIZATIONS } from './src/data/plansCatalog.ts';

console.log('==================================================');
console.log('DEFAULT INITIAL USERS & WORKSPACES');
console.log('==================================================\n');

console.log('Initial Users in Codebase:');
INITIAL_USERS.forEach((u, i) => {
  console.log(`\nUser #${i + 1}:`);
  console.log(`  Name        : ${u.name}`);
  console.log(`  Email       : ${u.email}`);
  console.log(`  User ID     : ${u.userId}`);
  console.log(`  Workspace ID: ${u.orgId}`);
  console.log(`  Role        : ${u.role}`);
  console.log(`  Status      : ${u.status}`);
});

console.log('\nInitial Organizations in Codebase:');
INITIAL_ORGANIZATIONS.forEach((o, i) => {
  console.log(`\nOrg #${i + 1}:`);
  console.log(`  Company Name: ${o.companyName}`);
  console.log(`  Workspace ID: ${o.orgId}`);
  console.log(`  Plan ID     : ${o.planId}`);
  console.log(`  Admin Email : ${o.adminEmail}`);
  console.log(`  Admin Name  : ${o.adminName}`);
});
