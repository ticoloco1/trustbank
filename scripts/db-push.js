require("dotenv").config({ path: ".env.local" });
const { execSync } = require("child_process");
execSync("npx prisma db push", { stdio: "inherit", env: process.env });
