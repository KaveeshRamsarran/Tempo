const { spawn } = require("child_process");
const path = require("path");

const electronPath = require("electron");
const root = path.resolve(__dirname, "..");
const env = { ...process.env };

delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [root], {
  cwd: root,
  env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code || 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
