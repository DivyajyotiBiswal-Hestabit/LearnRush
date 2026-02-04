const fs = require("fs");
const path = require("path");

const metrics = {
    timestamp: new Date().toISOString(),
    pid: process.pid,
    cpuUsage: process.cpuUsage(),
    resourceUsage: process.resourceUsage()
};
const logDir = path.join(__dirname, "logs");
if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}
const logFile = path.join(logDir, "day1-sysmetrics.json");
fs.writeFileSync(logFile, JSON.stringify(metrics, null, 2));
console.log("Runtime metrics logged to:", logFile);

/* process.cpuUsage shows how much CPU time your Node process used (in microseconds) and is split into user and system */
/* process.resourceUsage shows OS level resource usage : memory, cpu time,page faults, context switches */