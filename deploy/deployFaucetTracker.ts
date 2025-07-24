// scripts/deployFaucetTracker.ts

import { ethers, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying FaucetTracker with account:", deployer.address);

    const FaucetTracker = await ethers.getContractFactory("FaucetTracker");
    const tracker = await FaucetTracker.deploy();
    await tracker.waitForDeployment();

    const deployedAddress = await tracker.getAddress();
    console.log("FaucetTracker deployed to:", deployedAddress);

    // ✅ Save ABI to backend
    const artifact = await artifacts.readArtifact("FaucetTracker");
    const target = path.join(__dirname, '../backend/src/contracts/FaucetTracker_sepolia.json');
    fs.writeFileSync(target, JSON.stringify(artifact, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
