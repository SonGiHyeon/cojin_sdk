// src/faucet-tracker/faucet-tracker.service.ts
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import FaucetTrackerAbiSepolia from '../contracts/FaucetTracker_sepolia.json';
import FaucetTrackerAbiKairos from '../contracts/FaucetTracker_kairos.json';

@Injectable()
export class FaucetTrackerService {
    getContract(chain: string): ethers.Contract {
        const abi = chain === 'kairos' ? FaucetTrackerAbiKairos.abi : FaucetTrackerAbiSepolia.abi;
        const address = chain === 'kairos'
            ? process.env.FAUCET_TRACKER_ADDRESS_KAIROS
            : process.env.FAUCET_TRACKER_ADDRESS_SEPOLIA;
        const providerUrl = chain === 'kairos'
            ? process.env.KAIROS_RPC_URL
            : process.env.SEPOLIA_RPC_URL;

        const provider = new ethers.JsonRpcProvider(providerUrl!);
        return new ethers.Contract(address!, abi, provider);
    }

    async getLastReceivedAt(address: string, chain: string): Promise<number> {
        const contract = this.getContract(chain);
        return await contract.getLastReceivedAt(address, chain);
    }

    async isEligible(address: string, chain: string): Promise<boolean> {
        const contract = this.getContract(chain);
        return await contract.isEligible(address, chain);
    }

    async markReceived(address: string, chain: string, isAdmin: boolean): Promise<string> {
        const abi = chain === 'kairos' ? FaucetTrackerAbiKairos.abi : FaucetTrackerAbiSepolia.abi;
        const addressContract = chain === 'kairos'
            ? process.env.FAUCET_TRACKER_ADDRESS_KAIROS
            : process.env.FAUCET_TRACKER_ADDRESS_SEPOLIA;
        const providerUrl = chain === 'kairos'
            ? process.env.KAIROS_RPC_URL
            : process.env.SEPOLIA_RPC_URL;
        const privateKey = chain === 'kairos'
            ? process.env.KAIROS_PRIVATE_KEY
            : process.env.PRIVATE_KEY;

        const provider = new ethers.JsonRpcProvider(providerUrl!);
        const signer = new ethers.Wallet(privateKey!, provider);
        const contract = new ethers.Contract(addressContract!, abi, signer);

        const tx = await contract.markReceived(address, isAdmin);
        console.log(`🚀 [markReceived] address: ${address}`);
        console.log(`→ chain: ${chain}`);
        console.log(`→ isAdmin: ${isAdmin}`);
        console.log(`→ contract address: ${addressContract}`);
        console.log(`→ provider: ${providerUrl}`);

        await tx.wait();
        return tx.hash;
    }
}
