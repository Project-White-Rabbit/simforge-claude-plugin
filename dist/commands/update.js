import { execSync } from "node:child_process";
import { checkForUpdate } from "../updates.js";
async function main() {
    const { current, latest, updateAvailable } = await checkForUpdate();
    if (!updateAvailable || !latest) {
        console.log(`Simforge plugin v${current} is already up to date.`);
        return;
    }
    console.log(`Update available: v${current} → v${latest}`);
    console.log("Updating marketplace...");
    try {
        execSync("claude plugin marketplace update simforge", {
            stdio: "inherit",
        });
    }
    catch {
        console.error("Failed to update marketplace. Is the 'simforge' marketplace registered?");
        console.error("You can add it with: claude plugin marketplace add Project-White-Rabbit/simforge-claude-plugin");
        process.exit(1);
    }
    console.log("Updating plugin...");
    try {
        execSync("claude plugin update simforge@simforge", {
            stdio: "inherit",
        });
    }
    catch {
        console.error("Failed to update plugin.");
        process.exit(1);
    }
    console.log(`\nSimforge plugin updated to v${latest}. Restart Claude Code to apply the update.`);
}
main().catch((err) => {
    console.error("Update failed:", err.message);
    process.exit(1);
});
