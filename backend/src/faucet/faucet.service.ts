import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import CJNTokenJson from '../../../sdk/contracts/CJNToken.json';
import FaucetTrackerAbi from '../../src/contracts/FaucetTracker.json';

const CJNTOKEN_ADDRESS = process.env.CJNT_CONTRACT!;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const KAIROS_RPC_URL = process.env.KAIROS_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const KAIROS_PRIVATE_KEY = process.env.KAIROS_PRIVATE_KEY!;
const FAUCET_TRACKER_CONTRACT_SEPOLIA = process.env.FAUCET_TRACKER_CONTRACT_SEPOLIA!;
const FAUCET_TRACKER_CONTRACT_KAIROS = process.env.FAUCET_TRACKER_CONTRACT_KAIROS!;
const COOLDOWN_SECONDS = 60 * 60 * 24;

@Injectable()
export class FaucetService {
    constructor(private configService: ConfigService) { }

    async sendCJNT(address: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, wallet);
        const tracker = new ethers.Contract(FAUCET_TRACKER_CONTRACT_SEPOLIA, FaucetTrackerAbi.abi, wallet);

        const tx = await contract.transfer(address, ethers.parseUnits('100', 18));
        await tx.wait();

        try {
            await tracker.setUserReceived(address, 'sepolia');
        } catch (e: any) {
            console.error('❌ setUserReceived 실패:', e.message);
        }

        return tx.hash;
    }

    async sendNativeToken(address: string): Promise<string> {
        await this.assertEligibility(address, 'sepolia');

        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        const tx = await wallet.sendTransaction({ to: address, value: ethers.parseEther('0.01') });
        await tx.wait();

        const tracker = new ethers.Contract(FAUCET_TRACKER_CONTRACT_SEPOLIA, FaucetTrackerAbi.abi, wallet);
        await tracker.setAdminReceived(address, 'sepolia');

        return tx.hash;
    }

    async sendKai(address: string): Promise<string> {
        await this.assertEligibility(address, 'kai');

        const provider = new ethers.JsonRpcProvider(KAIROS_RPC_URL);
        const wallet = new ethers.Wallet(KAIROS_PRIVATE_KEY, provider);

        const tx = await wallet.sendTransaction({ to: address, value: ethers.parseEther('0.01') });
        await tx.wait();

        const tracker = new ethers.Contract(FAUCET_TRACKER_CONTRACT_KAIROS, FaucetTrackerAbi.abi, wallet);
        await tracker.setAdminReceived(address, 'kai');

        return tx.hash;
    }

    private async assertEligibility(address: string, chain: 'sepolia' | 'kai') {
        const cjntBalance = await this.getCJNTBalance(address);
        if (cjntBalance < 100) {
            throw new Error(`${chain.toUpperCase()}: CJNT 보유량 부족.`);
        }

        const now = Math.floor(Date.now() / 1000);
        const last = await this.getLastReceivedAt(address, chain);
        const remaining = last ? COOLDOWN_SECONDS - (now - last) : 0;

        if (remaining > 0) {
            throw new Error(`${chain.toUpperCase()}: 쿨다운 중입니다.`);
        }
    }

    async getCJNTBalance(address: string): Promise<number> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, provider);
        const balance = await contract.balanceOf(address);
        return Number(ethers.formatUnits(balance, 18));
    }

    async getLastReceivedAt(address: string, chain: string): Promise<number | null> {
        const isKai = chain === 'kai';
        const rpcUrl = isKai ? KAIROS_RPC_URL : SEPOLIA_RPC_URL;
        const contractAddress = isKai ? FAUCET_TRACKER_CONTRACT_KAIROS : FAUCET_TRACKER_CONTRACT_SEPOLIA;

        console.log(`🔍 [getLastReceivedAt] chain: ${chain}`);
        console.log(`   → Using RPC: ${rpcUrl}`);
        console.log(`   → Using Tracker Address: ${contractAddress}`);

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const tracker = new ethers.Contract(contractAddress, FaucetTrackerAbi.abi, provider);

        try {
            const timestamp: bigint = await tracker.getLastReceivedAt(address, chain);
            console.log(`✅ [getLastReceivedAt] result for ${address} on ${chain}: ${timestamp.toString()}`);
            return timestamp === 0n ? null : Number(timestamp);
        } catch (err) {
            console.error(`❌ [getLastReceivedAt] ${chain} 호출 실패:`, err);
            return null;
        }
    }

    async checkEligibility(address: string): Promise<{
        ethEligible: boolean;
        kaiEligible: boolean;
        lastReceivedAt: { eth: number | null; kai: number | null };
        remainingTime: { eth: number | null; kai: number | null };
        cjntBalance: number;
    }> {
        const now = Math.floor(Date.now() / 1000);
        const [ethLast, kaiLast, cjntBalance] = await Promise.all([
            this.getLastReceivedAt(address, 'sepolia'),
            this.getLastReceivedAt(address, 'kai'),
            this.getCJNTBalance(address),
        ]);

        const calcRemaining = (last: number | null) => (last ? Math.max(COOLDOWN_SECONDS - (now - last), 0) : null);

        const ethRemaining = calcRemaining(ethLast);
        const kaiRemaining = calcRemaining(kaiLast);

        const ethEligible = (ethRemaining === null || ethRemaining <= 0) && cjntBalance >= 100;
        const kaiEligible = (kaiRemaining === null || kaiRemaining <= 0) && cjntBalance >= 100;

        return {
            ethEligible,
            kaiEligible,
            lastReceivedAt: {
                eth: ethLast ?? null,
                kai: kaiLast ?? null,
            },
            remainingTime: {
                eth: ethRemaining && ethRemaining > 0 ? ethRemaining : null,
                kai: kaiRemaining && kaiRemaining > 0 ? kaiRemaining : null,
            },
            cjntBalance,
        };
    }
}
