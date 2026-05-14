/**
 * MEV Unified Pre-flight Check
 * Combines G1 (framework), G2 (tavily probe), G3 (time) into one command.
 * 
 * Usage: node scripts/mev-prefight.cjs [--force]
 * Output: single JSON with all gate results
 */

const { spawnSync } = require('child_process');
const path = require('path');

const WORKSPACE = path.resolve(process.env.USERPROFILE, '.openclaw/workspace');
const FORCE = process.argv.includes('--force') || process.argv.includes('-f');

function runScript(scriptName, args = []) {
  const scriptPath = path.join(WORKSPACE, 'scripts', scriptName);
  const fullArgs = [scriptPath, ...args];
  if (FORCE) fullArgs.push('--force');
  
  const proc = spawnSync(process.execPath, fullArgs, {
    encoding: 'utf8', maxBuffer: 1024 * 1024, windowsHide: true, timeout: 30000
  });
  
  try {
    const result = JSON.parse((proc.stdout || '').trim());
    return { ok: result.ok !== false, data: result };
  } catch {
    return { ok: false, data: { error: proc.stderr || 'no output' } };
  }
}

// G1: Framework check
const fw = runScript('framework-check.cjs');

// G2: Tavily probe
const tavily = runScript('tavily-probe.cjs');

// G3: Time
const timeProc = spawnSync('python', ['-c', 'from datetime import datetime; print(datetime.now().strftime("%Y-%m-%d %H:%M"))'], {
  encoding: 'utf8', windowsHide: true
});
const time = (timeProc.stdout || '').trim();
const tz = 'Asia/Shanghai';

// Summarize
const allOk = fw.ok && tavily.ok;
const issues = [];
if (!fw.ok) issues.push('framework');
if (!tavily.ok) issues.push('search');
if (!time) issues.push('time');

const result = {
  framework: { ok: fw.ok, version: fw.data?.localVersion || 'unknown' },
  search: { ok: tavily.ok, status: tavily.ok ? 'available' : 'degraded', reason: tavily.data?.reason || '' },
  time: { ok: !!time, value: time, tz },
  allOk,
  issues: issues.length > 0 ? issues : null,
  ready: allOk ? 'FULL' : issues.length > 0 ? 'DEGRADED' : 'UNKNOWN'
};

console.log(JSON.stringify(result, null, 2));
process.exit(issues.length > 0 ? 1 : 0);
