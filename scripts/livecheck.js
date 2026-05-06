const { spawnSync } = require("child_process");
const path = require("path");

const electronPath = require("electron");
const root = path.resolve(__dirname, "..");
const env = { ...process.env };

delete env.ELECTRON_RUN_AS_NODE;

const result = spawnSync(electronPath, [path.join(root, "scripts", "livecheck-electron.js")], {
  cwd: root,
  env,
  encoding: "utf8",
  stdio: "pipe"
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status || 0);
