/**
 * test_demo.js
 * Demo completo de la API Finix — corre todo el flujo CRUD en la terminal.
 * Uso: node test_demo.js
 */

const http = require('http');

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = { hostname: 'localhost', port: 3000 };

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(icon, label, value) {
  console.log(`${CYAN}${icon} ${BOLD}${label}${RESET}  ${value}`);
}

function ok(label) { console.log(`${GREEN}  ✔ ${label}${RESET}`); }
function err(label) { console.log(`${RED}  ✘ ${label}${RESET}`); }
function sep(title) {
  console.log(`\n${YELLOW}${'─'.repeat(50)}${RESET}`);
  console.log(`${BOLD}${YELLOW}  ${title}${RESET}`);
  console.log(`${YELLOW}${'─'.repeat(50)}${RESET}`);
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({ ...BASE, method, path, headers }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Demo principal ────────────────────────────────────────────────────────────

async function runDemo() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════╗`);
  console.log(`║       FINIX API — Demo Completo      ║`);
  console.log(`╚══════════════════════════════════════╝${RESET}\n`);

  let token, financeId;
  const email = `demo_${Date.now()}@finix.com`;
  const password = 'Demo1234!';

  // ── 1. REGISTRO ────────────────────────────────────────────────────────────
  sep('1. REGISTRO DE USUARIO');
  const reg = await request('POST', '/api/auth/register', {
    name: 'Demo User', email, password, passwordConfirm: password
  });
  log('📧', 'Email:', email);
  log('📊', 'Status:', reg.status);
  if (reg.status === 201) {
    ok('Usuario registrado correctamente');
  } else {
    err(`Error al registrar: ${JSON.stringify(reg.data?.message || reg.data)}`);
  }

  // ── 2. LOGIN ───────────────────────────────────────────────────────────────
  sep('2. LOGIN');
  const login = await request('POST', '/api/auth/login', { email, password });
  log('📊', 'Status:', login.status);
  if (login.status === 200 && login.data.token) {
    token = login.data.token;
    ok('Login exitoso');
    log('🔑', 'Token (primeros 40 chars):', token.substring(0, 40) + '...');
  } else {
    err('No se obtuvo token');
    return;
  }

  // ── 3. MI PERFIL ───────────────────────────────────────────────────────────
  sep('3. VER MI PERFIL');
  const me = await request('GET', '/api/users/me', null, token);
  log('📊', 'Status:', me.status);
  if (me.status === 200) {
    ok('Perfil obtenido');
    log('👤', 'Nombre:', me.data.data?.name || me.data.name);
    log('📧', 'Email:', me.data.data?.email || me.data.email);
  } else {
    err(`Error: ${JSON.stringify(me.data?.message)}`);
  }

  // ── 4. CREAR FINANZA ───────────────────────────────────────────────────────
  sep('4. CREAR TRANSACCIÓN (INGRESO)');
  const create = await request('POST', '/api/personal-finance', {
    tipo: 'ingreso',
    monto: 1500000,
    moneda: 'COP',
    categoria: 'salario',
    descripcion: 'Pago de nómina demo',
    metodoPago: 'transferencia_bancaria',
    estado: 'completado',
    tags: ['trabajo', 'demo']
  }, token);
  log('📊', 'Status:', create.status);
  if (create.status === 201) {
    financeId = create.data.data?._id || create.data._id;
    ok('Transacción creada');
    log('🆔', 'ID:', financeId);
    log('💰', 'Monto:', '$1,500,000 COP');
  } else {
    err(`Error: ${JSON.stringify(create.data?.message || create.data)}`);
  }

  // ── 5. LISTAR ──────────────────────────────────────────────────────────────
  sep('5. LISTAR TRANSACCIONES');
  const list = await request('GET', '/api/personal-finance', null, token);
  log('📊', 'Status:', list.status);
  if (list.status === 200) {
    const count = list.data.data?.length ?? list.data.results ?? '?';
    ok(`Listado exitoso — ${count} transacción(es) encontradas`);
  } else {
    err(`Error: ${JSON.stringify(list.data?.message)}`);
  }

  // ── 6. VER POR ID ──────────────────────────────────────────────────────────
  sep('6. VER TRANSACCIÓN POR ID');
  if (financeId) {
    const getOne = await request('GET', `/api/personal-finance/${financeId}`, null, token);
    log('📊', 'Status:', getOne.status);
    if (getOne.status === 200) {
      ok('Transacción encontrada por ID');
      log('📝', 'Descripción:', getOne.data.data?.descripcion || getOne.data.descripcion);
    } else {
      err(`Error: ${JSON.stringify(getOne.data?.message)}`);
    }
  }

  // ── 7. EDITAR ──────────────────────────────────────────────────────────────
  sep('7. EDITAR TRANSACCIÓN (PUT)');
  if (financeId) {
    const update = await request('PUT', `/api/personal-finance/${financeId}`, {
      monto: 1800000,
      descripcion: 'Pago de nómina demo (ACTUALIZADO)',
      tags: ['trabajo', 'demo', 'actualizado']
    }, token);
    log('📊', 'Status:', update.status);
    if (update.status === 200) {
      ok('Transacción actualizada correctamente');
      log('💰', 'Nuevo monto:', '$1,800,000 COP');
    } else {
      err(`Error: ${JSON.stringify(update.data?.message || update.data)}`);
    }
  }

  // ── 8. ELIMINAR ────────────────────────────────────────────────────────────
  sep('8. ELIMINAR TRANSACCIÓN (soft-delete)');
  if (financeId) {
    const del = await request('DELETE', `/api/personal-finance/${financeId}`, null, token);
    log('📊', 'Status:', del.status);
    if (del.status === 200 || del.status === 204) {
      ok('Transacción eliminada (soft-delete)');
      log('ℹ️ ', 'Nota:', 'El registro no se borra físicamente, solo se marca como eliminado');
    } else {
      err(`Error: ${JSON.stringify(del.data?.message || del.data)}`);
    }
  }

  // ── RESUMEN ────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}${GREEN}╔══════════════════════════════════════╗`);
  console.log(`║        ✅  Demo completado            ║`);
  console.log(`╚══════════════════════════════════════╝${RESET}\n`);
}

runDemo().catch(e => {
  console.error(`${RED}Error fatal: ${e.message}${RESET}`);
  console.error('¿Está corriendo el servidor? Ejecuta: npm run dev (en la carpeta backend)');
});
