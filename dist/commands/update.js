import { detectLegacyInstall, legacyMigrationMessage, runUpdate, } from "bitfab-plugin-lib";
import { platform } from "../platform.js";
import { getVersion } from "../version.js";
async function main() {
    if (detectLegacyInstall(platform)) {
        console.log(legacyMigrationMessage(platform));
        return;
    }
    await runUpdate(getVersion(), platform);
}
main().catch((err) => {
    console.error("Update failed:", err.message);
    process.exit(1);
});
