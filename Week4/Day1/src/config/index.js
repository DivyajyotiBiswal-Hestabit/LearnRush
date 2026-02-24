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
  path: path.resolve(process.cwd(), envFile)
});

module.exports = {
  env,
  port: process.env.PORT || 3000,
  dbUri: process.env.DB_URI
};