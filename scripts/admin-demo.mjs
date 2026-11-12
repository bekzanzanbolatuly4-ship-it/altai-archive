import assert from 'node:assert/strict';
import {cp, mkdir, mkdtemp, rm, symlink, writeFile, chmod} from 'node:fs/promises';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const root = process.cwd();
const isolated = await mkdtemp(path.join(os.tmpdir(), 'altai-admin-demo-'));
const testMode = process.argv.includes('--test');
const ownerEmail = 'local-demo-owner@example.invalid';
const ownerPassword = randomBytes(32).toString('base64url');
const roles = ['SUPERADMIN', 'SITE_ADMIN', 'ARCHIVE_EMPLOYEE', 'EDITOR', 'BRANCH_ADMIN', 'MODERATOR', 'ANALYST'];
const permissions = {
  SUPERADMIN: {upload: true, edit: true, publish: true, accounts: true, audit: true, export: true},
  SITE_ADMIN: {upload: true, edit: true, publish: true, accounts: false, audit: true, export: true},
  ARCHIVE_EMPLOYEE: {upload: true, edit: true, publish: false, accounts: false, audit: false, export: false},
  EDITOR: {upload: false, edit: true, publish: true, accounts: false, audit: false, export: false},
  BRANCH_ADMIN: {upload: true, edit: true, publish: false, accounts: false, audit: false, export: false},
  MODERATOR: {upload: false, edit: true, publish: false, accounts: false, audit: false, export: false},
  ANALYST: {upload: false, edit: false, publish: false, accounts: false, audit: true, export: true},
};

let server;
let serverLogs = '';
let baseUrl = '';
let credentialsPath = '';
const stopServer = () => server?.kill('SIGTERM');
process.once('SIGINT', stopServer);
process.once('SIGTERM', stopServer);

try {
  await cp(root, isolated, {
    recursive: true,
    filter(source) {
      const relative = path.relative(root, source);
      if (!relative) return true;
      const first = relative.split(path.sep)[0];
      const excluded = new Set(['.git', '.next', '.data', '.vercel', '.agents', '.codex', '.aws', 'node_modules', 'output', 'coverage', 'dist']);
      return !excluded.has(first) && !first.startsWith('.env');
    },
  });
  await symlink(path.join(root, 'node_modules'), path.join(isolated, 'node_modules'), 'dir');
  await mkdir(path.join(isolated, '.data', 'uploads'), {recursive: true});

  const syntheticPdf = makeSyntheticPdf();
  const documents = [makeSampleDocument('local-synthetic', 'LOCAL DEMO · Synthetic test record', '10000000-0000-4000-8000-000000000001.pdf')];
  if (testMode) {
    for (const role of roles) {
      documents.push(makeSampleDocument(`workflow-${role.toLowerCase()}`, `LOCAL DEMO · Workflow fixture ${role}`, `${randomUUID()}.pdf`));
      documents.push(makeSampleDocument(`delete-${role.toLowerCase()}`, `LOCAL DEMO · Delete fixture ${role}`, `${randomUUID()}.pdf`));
    }
  }
  for (const document of documents) {
    await writeFile(path.join(isolated, '.data', 'uploads', document.fileName), syntheticPdf, {mode: 0o600});
    document.size = syntheticPdf.length;
  }
  await writeFile(path.join(isolated, '.data', 'archive-store.json'), JSON.stringify({users: [], documents, sessions: [], audit: []}, null, 2), {mode: 0o600});

  if (!testMode) {
    credentialsPath = path.join(isolated, 'LOCAL-DEMO-CREDENTIALS.json');
    await writeFile(credentialsPath, JSON.stringify({email: ownerEmail, password: ownerPassword}, null, 2), {flag: 'wx', mode: 0o600});
    await chmod(credentialsPath, 0o600);
  }

  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: 'development',
    NEXT_TELEMETRY_DISABLED: '1',
    DEMO_READ_ONLY: 'false',
    ARCHIVE_OWNER_EMAIL: ownerEmail,
    ARCHIVE_OWNER_PASSWORD: ownerPassword,
    SESSION_SECRET: randomBytes(48).toString('base64url'),
    UPLOAD_LIMIT_MB: '10',
    APP_ORIGIN: baseUrl,
    NEXT_PUBLIC_SITE_URL: baseUrl,
  };
  server = spawn(process.execPath, [path.join(isolated, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: isolated,
    env,
    stdio: testMode ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (testMode) {
    server.stdout.on('data', chunk => { serverLogs += chunk.toString(); });
    server.stderr.on('data', chunk => { serverLogs += chunk.toString(); });
  }
  await waitForServer(server, `${baseUrl}/admin`);

  if (testMode) {
    await testAdminRoles();
  } else {
    console.log('Local admin demonstration is running with a temporary isolated copy and synthetic records.');
    console.log(`Open: ${baseUrl}/admin`);
    console.log(`Generated one-run login is stored in this private file (mode 0600): ${credentialsPath}`);
    console.log('No Supabase, Redis, production credentials, or project .data files are used. Ctrl+C stops the server and removes the temporary copy.');
    await new Promise(resolve => server.once('exit', resolve));
  }
} catch (error) {
  if (testMode && serverLogs) process.stderr.write(serverLogs.slice(-6000));
  throw error;
} finally {
  process.removeListener('SIGINT', stopServer);
  process.removeListener('SIGTERM', stopServer);
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise(resolve => server.once('exit', resolve));
  }
  await rm(isolated, {recursive: true, force: true});
}

function makeSampleDocument(id, title, fileName) {
  return {
    id,
    fileName,
    originalName: 'LOCAL-DEMO-synthetic.pdf',
    mimeType: 'application/pdf',
    size: 0,
    title,
    description: 'Generated test fixture in a temporary local copy. This is not an archival record.',
    date: 'Not applicable · synthetic fixture',
    fond: '',
    inventory: '',
    caseName: '',
    documentIdentifier: 'LOCAL-DEMO-ONLY',
    keywords: ['local demo', 'synthetic'],
    language: 'English',
    provenance: 'Generated locally for demonstration; no archival source.',
    accessStatus: 'restricted',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'owner',
  };
}

function makeSyntheticPdf() {
  const stream = [
    'BT',
    '/F1 24 Tf',
    '72 700 Td',
    '(LOCAL ADMIN DEMONSTRATION) Tj',
    '0 -42 Td',
    '/F1 16 Tf',
    '(SYNTHETIC CONTENT ONLY) Tj',
    '0 -28 Td',
    '(NOT AN ARCHIVAL SOURCE) Tj',
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let output = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(Buffer.byteLength(output, 'ascii'));
    output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output, 'ascii');
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(output, 'ascii');
}

async function findFreePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, '127.0.0.1', resolve));
  const address = probe.address();
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  if (!address || typeof address === 'string') throw new Error('Unable to reserve a local port');
  return address.port;
}

async function waitForServer(child, url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error(`Isolated Next server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(1500)});
      if (response.ok) return;
    } catch {}
    await delay(1000);
  }
  throw new Error('Isolated Next server did not become ready within 60 seconds');
}

async function testAdminRoles() {
  const ownerCookie = await login(ownerEmail, ownerPassword);
  const createdAccounts = new Map([['SUPERADMIN', {email: ownerEmail, password: ownerPassword, cookie: ownerCookie}]]);

  for (const role of roles.filter(value => value !== 'SUPERADMIN')) {
    const password = randomBytes(32).toString('base64url');
    const email = `${role.toLowerCase()}@local-demo.invalid`;
    const response = await api(ownerCookie, '/api/admin/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: `Local fixture ${role}`, email, password, role}),
    });
    assert.equal(response.status, 201, `SUPERADMIN should create ${role} only in the isolated fixture`);
    createdAccounts.set(role, {email, password, cookie: await login(email, password)});
  }

  const publicDocuments = await fetch(`${baseUrl}/api/documents`).then(response => response.json());
  assert.deepEqual(publicDocuments.documents, [], 'Draft and restricted local fixtures must remain private');
  const deniedPublicFile = await fetch(`${baseUrl}/api/documents/local-synthetic/file`);
  assert.equal(deniedPublicFile.status, 404, 'The public file route must not expose a restricted draft');

  for (const role of roles) {
    const {cookie} = createdAccounts.get(role);
    const expected = permissions[role];
    const docs = await api(cookie, '/api/admin/documents');
    assert.equal(docs.status, 200, `${role} should have document read access`);
    const file = await api(cookie, '/api/admin/documents/local-synthetic/file');
    assert.equal(file.status, 200, `${role} should be able to read an authenticated restricted file`);
    assert.match(file.headers.get('content-type') || '', /application\/pdf/);

    const uploadForm = new FormData();
    uploadForm.set('file', new Blob([makeSyntheticPdf()], {type: 'application/pdf'}), `LOCAL-DEMO-${role}.pdf`);
    uploadForm.set('title', `LOCAL DEMO · Upload fixture ${role}`);
    uploadForm.set('accessStatus', 'public');
    const upload = await api(cookie, '/api/admin/documents', {method: 'POST', body: uploadForm});
    assert.equal(upload.status, expected.upload ? 201 : 403, `${role} upload permission`);
    if (expected.upload) {
      const {document} = await upload.json();
      assert.equal(document.status, 'draft', 'Uploads must start as drafts');
      assert.equal(document.accessStatus, expected.publish ? 'public' : 'restricted', 'Non-publishers must not create public-access records');
    }

    const patch = await api(cookie, `/api/admin/documents/workflow-${role.toLowerCase()}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({title: `LOCAL DEMO · Edited by ${role}`}),
    });
    assert.equal(patch.status, expected.edit ? 200 : 403, `${role} metadata edit permission`);

    const publishDoc = `workflow-${role.toLowerCase()}`;
    const requestStatus = async status => api(cookie, `/api/admin/documents/${publishDoc}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    const reviewResponse = await requestStatus('review');
    assert.equal(reviewResponse.status, expected.edit ? 200 : 403, `${role} draft review submission permission`);
    if (expected.publish) {
      assert.equal((await requestStatus('approved')).status, 200, `${role} can approve`);
      const published = await api(cookie, `/api/admin/documents/${publishDoc}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'published', accessStatus: 'public'}),
      });
      assert.equal(published.status, 200, `${role} can publish after approval`);
    } else if (expected.edit) {
      assert.equal((await requestStatus('approved')).status, 403, `${role} must not approve records`);
      const publicAccess = await api(cookie, `/api/admin/documents/${publishDoc}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({accessStatus: 'public'}),
      });
      assert.equal(publicAccess.status, 403, `${role} must not grant public access`);
    }

    const deleteResponse = await api(cookie, `/api/admin/documents/delete-${role.toLowerCase()}`, {method: 'DELETE'});
    assert.equal(deleteResponse.status, expected.edit && expected.publish ? 200 : 403, `${role} delete permission for another employee's draft`);

    const audit = await api(cookie, '/api/admin/audit');
    assert.equal(audit.status, expected.audit ? 200 : 403, `${role} audit permission`);
    const accounts = await api(cookie, '/api/admin/users');
    assert.equal(accounts.status, expected.accounts ? 200 : 403, `${role} account-management permission`);
    const exportResponse = await api(cookie, '/api/admin/export');
    assert.equal(exportResponse.status, expected.export ? 200 : 403, `${role} export permission`);
  }

  const owner = createdAccounts.get('SUPERADMIN');
  const invalidSuperadminCreate = await api(owner.cookie, '/api/admin/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: 'Rejected fixture', email: 'second-owner@local-demo.invalid', password: randomBytes(32).toString('base64url'), role: 'SUPERADMIN'}),
  });
  assert.equal(invalidSuperadminCreate.status, 400, 'The account API must not create or assign a second SUPERADMIN through staff creation');

  const crossOrigin = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {'Origin': 'https://not-local.invalid', 'Content-Type': 'application/json', Cookie: owner.cookie},
    body: JSON.stringify({}),
  });
  assert.equal(crossOrigin.status, 403, 'Cookie-authenticated account mutations must reject cross-origin requests');

  const unauthenticated = await fetch(`${baseUrl}/api/admin/export`);
  assert.equal(unauthenticated.status, 401, 'Admin export must require an authenticated staff session');

  const disabledAccount = createdAccounts.get('MODERATOR');
  const disabledUser = (await api(owner.cookie, '/api/admin/users').then(response => response.json())).users.find(user => user.email === disabledAccount.email);
  const disable = await api(owner.cookie, '/api/admin/users', {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: disabledUser.id, disabled: true}),
  });
  assert.equal(disable.status, 200, 'SUPERADMIN can disable a staff account');
  assert.equal((await api(disabledAccount.cookie, '/api/admin/documents')).status, 401, 'Disabled users cannot reuse an existing session');

  const loggedOut = await api(owner.cookie, '/api/auth/logout', {method: 'POST'});
  assert.equal(loggedOut.status, 200);
  assert.equal((await api(owner.cookie, '/api/admin/documents')).status, 401, 'Logout must revoke the server-side session');

  for (let attempt = 0; attempt < 8; attempt++) {
    const denied = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {'Origin': baseUrl, 'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'rate-limit-fixture@local-demo.invalid', password: randomBytes(32).toString('base64url')}),
    });
    assert.equal(denied.status, 401, 'Unmatched logins should return a uniform authentication error');
  }
  const rateLimited = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Origin': baseUrl, 'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'rate-limit-fixture@local-demo.invalid', password: randomBytes(32).toString('base64url')}),
  });
  assert.equal(rateLimited.status, 429, 'Repeated login failures must be rate limited');

  console.log('PASS: isolated admin role matrix (7 roles), read/upload/edit/publish/account/audit/export routes, restricted file access, draft privacy, cross-origin rejection, disabled-session revocation, logout, and login rate limit. Synthetic data and random credentials were discarded.');
}

async function login(email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Origin': baseUrl, 'Content-Type': 'application/json'},
    body: JSON.stringify({email, password}),
  });
  assert.equal(response.status, 200, 'Local synthetic staff login should succeed');
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie, 'Login should issue an HttpOnly session cookie');
  return cookie;
}

async function api(cookie, route, init = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set('Cookie', cookie);
  if (init.method && !['GET', 'HEAD'].includes(init.method.toUpperCase())) headers.set('Origin', baseUrl);
  return fetch(`${baseUrl}${route}`, {...init, headers, cache: 'no-store'});
}
