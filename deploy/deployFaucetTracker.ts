// deployFaucetTracker.ts

import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying FaucetTracker with account:", deployer.address);

    const FaucetTracker = await ethers.getContractFactory("FaucetTracker");
    const tracker = await FaucetTracker.deploy();
    await tracker.waitForDeployment();

    const deployedAddress = await tracker.getAddress();
    console.log("FaucetTracker deployed to:", deployedAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
