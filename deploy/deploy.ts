// deploy.ts

import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying CJNToken with account:", deployer.address);

    const CJNTToken = await ethers.getContractFactory("CJNToken");
    const cjnt = await CJNTToken.deploy(1000000);
    await cjnt.waitForDeployment();

    const deployedAddress = await cjnt.getAddress();
    console.log("CJNTToken deployed to:", deployedAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
