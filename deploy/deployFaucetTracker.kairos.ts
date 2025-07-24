// scripts/deployFaucetTracker.kairos.ts

import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import FaucetTrackerJson from '../artifacts/contracts/FaucetTracker.sol/FaucetTracker.json';

dotenv.config();

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.KAIROS_RPC_URL);
    const wallet = new ethers.Wallet(process.env.KAIROS_PRIVATE_KEY as string, provider);

    const factory = new ethers.ContractFactory(FaucetTrackerJson.abi, FaucetTrackerJson.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const addr = await contract.getAddress();
    console.log("✅ FaucetTracker deployed on KAIROS at:", addr);

    // ✅ Save ABI to backend
    const target = path.join(__dirname, '../backend/src/contracts/FaucetTracker_kairos.json');
    fs.writeFileSync(target, JSON.stringify(FaucetTrackerJson, null, 2));
}

main().catch(console.error);
