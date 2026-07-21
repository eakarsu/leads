import { spawnSync } from 'node:child_process';

const includeDevelopment = process.argv.includes('--all');
const argumentsList = ['audit', '--json', ...(includeDevelopment ? [] : ['--omit=dev'])];
const result = spawnSync('npm', argumentsList, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch {
  console.error(result.stderr || 'npm audit did not return JSON');
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const allowedLeafAdvisories = new Set([1117015]);
const visited = new Set();

function leafSources(name) {
  if (visited.has(name)) return [];
  visited.add(name);
  const vulnerability = vulnerabilities[name];
  if (!vulnerability) return [];
  return (vulnerability.via ?? []).flatMap((entry) => (
    typeof entry === 'string' ? leafSources(entry) : [entry.source]
  ));
}

const rejected = [];
for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  visited.clear();
  const sources = leafSources(name);
  const allowed = vulnerability.severity === 'moderate'
    && sources.length > 0
    && sources.every((source) => allowedLeafAdvisories.has(source));
  if (!allowed) rejected.push({ name, severity: vulnerability.severity, sources });
}

if (rejected.length) {
  console.error(JSON.stringify({ rejected }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  dependencyScope: includeDevelopment ? 'all' : 'production',
  totalFindings: report.metadata?.vulnerabilities?.total ?? 0,
  exception: 'GHSA-qx2v-qp2m-jg93 in Next.js bundled PostCSS; no supported override or upstream fix',
}));
