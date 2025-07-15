// faucet-tracker.service.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import FaucetTrackerAbi from '../contracts/FaucetTracker.json';

const FAUCET_TRACKER_ADDRESS = process.env.FAUCET_TRACKER_CONTRACT!;
const PROVIDER = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const SIGNER = new ethers.Wallet(process.env.PRIVATE_KEY!, PROVIDER);

@Injectable()
export class FaucetTrackerService {
    private contract = new ethers.Contract(
        FAUCET_TRACKER_ADDRESS,
        FaucetTrackerAbi.abi,
        SIGNER
    );

    async getStatus(address: string) {
        const [isAdminReceive, isReceive] = await this.contract.getStatus(address);
        return { isAdminReceive, isReceive };
    }

    async setUserReceived(address: string) {
        const tx = await this.contract.markReceived(address, false);
        await tx.wait();
        return tx.hash;
    }

    async setAdminReceived(address: string) {
        const tx = await this.contract.markReceived(address, true);
        await tx.wait();
        return tx.hash;
    }

    async reset(address: string) {
        const tx = await this.contract.reset(address);
        await tx.wait();
        return tx.hash;
    }
}

console.log('▶ FAUCET_TRACKER_ADDRESS:', process.env.FAUCET_TRACKER_CONTRACT);
