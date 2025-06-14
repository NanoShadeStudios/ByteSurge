// ByteSurge: Infinite Loop - Debug Commands
// Quick reference for testing the upgrade system

console.log("🔧 Debug Commands Available:");
console.log("addTestEnergy(1000) - Add 1000 energy for testing");
console.log("toggleUpgradeMenu() - Open/close upgrade menu (or press U)");
console.log("window.upgradeSystem.getAllUpgradeProgress() - See all upgrade progress");
console.log("forceUpgradeLevel('droneSpeed', 5) - Set drone speed to level 5");
console.log("exportUpgradeData() - Export save data");
console.log("importUpgradeData(data) - Import save data");

// Auto-add some energy for testing
if (window.gameState) {
    window.gameState.energy += 500;
    console.log("💰 Added 500 energy for testing!");
    console.log("🎮 Press U to open the upgrade menu!");
}
