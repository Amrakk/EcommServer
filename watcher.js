import path from "path";
import { spawn } from "child_process";

let processInstance;
const delay = 5000; // 5 seconds delay

function startTsxProcess() {
    const isWindows = process.platform === "win32";

    processInstance = spawn(
        isWindows ? "cmd" : "npx",
        isWindows
            ? ["/c", "npx", "tsx", "--env-file=.env", "--watch", "src/index.ts"]
            : ["tsx", "--env-file=.env", "--watch", "src/index.ts"],
        {
            stdio: "inherit",
        }
    );

    processInstance.on("exit", (code) => {
        console.log(`Process exited with code ${code}`);
        console.log(`Restarting in ${delay / 1000} seconds...`);
        setTimeout(startTsxProcess, delay);
    });

    processInstance.on("error", (err) => {
        console.error("Failed to start process:", err);
    });
}

startTsxProcess();
