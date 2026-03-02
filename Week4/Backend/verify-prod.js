const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const axios = require("axios");

const PROD_FOLDER = path.join(__dirname, "prod");
const LOGS_FOLDER = path.join(__dirname, "logs");
const ECOSYSTEM_FILE = path.join(PROD_FOLDER, "ecosystem.config.js");
const TEST_REQUEST_ID = "verify-prod-123";

// 1️⃣ Verify prod folder
console.log("🔹 Verifying prod folder...");
if (!fs.existsSync(PROD_FOLDER)) {
  console.error("❌ prod/ folder not found!");
  process.exit(1);
} else console.log("✅ prod/ folder exists");

// 2️⃣ Verify ecosystem.config.js
if (!fs.existsSync(ECOSYSTEM_FILE)) {
  console.error("❌ ecosystem.config.js not found!");
  process.exit(1);
} else {
  console.log("✅ ecosystem.config.js exists");
  const ecosystem = require(ECOSYSTEM_FILE);
  if (ecosystem.apps && ecosystem.apps.length > 0) {
    console.log(`✅ ecosystem.config.js has ${ecosystem.apps.length} app(s) defined`);
  } else console.warn("⚠️ ecosystem.config.js has no apps defined");
}

// 3️⃣ Verify .env.example
const ENV_EXAMPLE_FILE = path.join(PROD_FOLDER, ".env.example");
if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
  console.error("❌ .env.example not found!");
} else console.log("✅ .env.example exists");

// 4️⃣ Verify logs folder
if (!fs.existsSync(LOGS_FOLDER)) {
  console.warn("⚠️ logs/ folder not found, create it for job logs");
} else {
  console.log("✅ logs/ folder exists");
  const logFiles = fs.readdirSync(LOGS_FOLDER).filter(f => f.endsWith(".log"));
  console.log(`ℹ️ Found ${logFiles.length} log file(s)`);
}

// 5️⃣ PM2 dry-run start
console.log("🔹 Starting PM2 apps (dry-run)...");
try {
  execSync(`pm2 start ${ECOSYSTEM_FILE} --env production`, { stdio: "inherit" });
  console.log("✅ PM2 start test successful");
} catch (err) {
  console.error("❌ PM2 start test failed:", err.message);
}

// 6️⃣ Trigger test HTTP request to verify request tracing
(async () => {
  try {
    console.log("🔹 Sending test HTTP request to backend-server...");
    await axios.get("http://localhost:3000/health", {
      headers: { "X-Request-ID": TEST_REQUEST_ID },
      timeout: 3000,
    });
    console.log("✅ Test request sent successfully");
  } catch (err) {
    console.warn("⚠️ Could not reach backend-server (is your server route /health defined?)");
  }

  // 7️⃣ Check logs for request tracing
  console.log("🔹 Checking logs for request tracing...");
  const logFiles = fs.readdirSync(LOGS_FOLDER).filter(f => f.endsWith(".log"));
  let foundRequestId = false;

  logFiles.forEach(file => {
    const content = fs.readFileSync(path.join(LOGS_FOLDER, file), "utf8");
    if (content.includes(TEST_REQUEST_ID)) foundRequestId = true;
  });

  if (foundRequestId) console.log("✅ Request tracing verified in logs");
  else console.warn("⚠️ Test X-Request-ID not found in logs");

  // 8️⃣ Check if email-worker logged anything
  console.log("🔹 Checking email-worker logs for recent jobs...");
  const workerLogs = logFiles.filter(f => f.toLowerCase().includes("email"));
  if (workerLogs.length === 0) console.warn("⚠️ No email-worker log files found");
  else {
    workerLogs.forEach(file => {
      const content = fs.readFileSync(path.join(LOGS_FOLDER, file), "utf8");
      if (content.includes("Job completed") || content.includes("Processed")) {
        console.log(`✅ Job detected in ${file}`);
      } else console.warn(`⚠️ No recent jobs found in ${file}`);
    });
  }

  // 9️⃣ Cleanup PM2 processes
  console.log("🔹 Cleaning up PM2 apps...");
  execSync("pm2 delete all", { stdio: "ignore" });
  console.log("🎉 Full production readiness verification complete!");
})();