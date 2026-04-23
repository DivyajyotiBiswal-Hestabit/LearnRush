const dotenv = require("dotenv");
const path = require("path");

const env = process.env.NODE_ENV || "local";

const envFileMap = {
  local: ".env.local",
  development: ".env.dev",
  production: ".env.prod"
};

const envFile = envFileMap[env] || ".env.local";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  debug: true, 
});

console.log("Loaded env file:", envFile);
console.log("MONGO_URI =", process.env.MONGO_URI);

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI
};