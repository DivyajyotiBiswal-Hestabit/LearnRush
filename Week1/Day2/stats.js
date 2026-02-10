const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  const value = args[i + 1];
  if (!value) continue;
  if (key.startsWith('--')) options[key.slice(2)] = value;
}

const file = options.file;
if (!file) {
  console.error("Error: Please provide a file using --file <filename>");
  process.exit(1);
}

function countContent(content) {
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  return { lines, words, chars };
}

async function logPerformance(file, execTime, memoryMB) {
  const logData = {
    file,
    executionTimeMs: execTime,
    memoryMB
  };
  await fs.mkdir('logs', { recursive: true });
  const logPath = path.join('logs', `performance-${file}.json`);
  await fs.writeFile(logPath, JSON.stringify(logData, null, 2));
  console.log(`Performance log saved: ${logPath}`);
}

async function removeDuplicates(file) {
  const content = await fs.readFile(file, 'utf-8');
  const uniqueLines = [...new Set(content.split(/\r?\n/))].join('\n');
  await fs.mkdir('output', { recursive: true });
  const outPath = path.join('output', `unique-${path.basename(file)}`);
  await fs.writeFile(outPath, uniqueLines);
  console.log(`Unique file saved: ${outPath}`);
}

async function processFile(file) {
  const start = performance.now();
  const content = await fs.readFile(file, 'utf-8');
  const counts = countContent(content);
  const execTime = (performance.now() - start).toFixed(2);
  const memoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  console.log(`${file} →`, counts);
  await logPerformance(path.basename(file), execTime, memoryMB);

  if (options.unique === "true") {
    await removeDuplicates(file);
  }

  return counts;
}

async function main() {
  const files = file.split(',').map(f => f.trim());

  await Promise.all(
    files.map(f => processFile(f))
  );

  console.log('All files processed.');
}

main().catch(err => console.error(err));
