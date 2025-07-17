// faucet.service.ts
import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable } from '@nestjs/common';
import { Contract, ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import CJNTokenJson from '../../../sdk/contracts/CJNToken.json';
import FaucetTrackerAbi from '../../../sdk/contracts/FaucetTracker.json';
import { ERC20_ABI } from '../constants/erc20.abi';

const FAUCET_TRACKER_ADDRESS = process.env.FAUCET_TRACKER_CONTRACT as string;
const CJNTOKEN_ADDRESS = process.env.CJNT_CONTRACT as string;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

@Injectable()
export class FaucetService {
    constructor(private configService: ConfigService) { }

    async sendTestToken(chain: string, address: string): Promise<string> {
        if (chain !== 'sepolia') throw new Error('Only sepolia is supported');
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, wallet);

        const tx = await contract.transfer(address, ethers.parseEther('0.1'));
        await tx.wait();
        return tx.hash;
    }

    async sendNativeToken(address: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther('0.01'),
        });
        await tx.wait();

        const tracker = new ethers.Contract(FAUCET_TRACKER_ADDRESS, FaucetTrackerAbi.abi, wallet);
        try {
            await tracker.setAdminReceived(address); // ✅ 중요: 실패해도 서버 죽지 않게
        } catch (err: any) {
            console.error('❌ setAdminReceived 실패:', err.message);
        }

        return tx.hash;
    }

    async isEligibleForNative(address: string): Promise<boolean> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(FAUCET_TRACKER_ADDRESS, FaucetTrackerAbi.abi, provider);
        try {
            return await contract.isEligible(address);
        } catch (err: any) {
            console.error('❌ isEligible 실패:', err.message);
            throw err;
        }
    }

    async getCJNTBalance(address: string): Promise<number> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, provider);
        const balance = await contract.balanceOf(address);
        return Number(ethers.formatUnits(balance, 18));
    }

    async checkEligibility(address: string): Promise<{
        ethEligible: boolean;
        kaiEligible: boolean;
        lastReceivedAt: string | null;
        isAdminReceived: boolean;
    }> {
        const cjntBalance = await this.getCJNTBalance(address);
        const hasEnoughCJNT = cjntBalance >= 100;

        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const tracker = new ethers.Contract(FAUCET_TRACKER_ADDRESS, FaucetTrackerAbi.abi, provider);
        const faucetInfo = await tracker.records(address);
        const lastReceivedRaw = faucetInfo.lastReceivedAt;
        const lastReceivedAt =
            lastReceivedRaw === 0 || lastReceivedRaw.toString() === '0'
                ? null
                : new Date(Number(lastReceivedRaw.toString()) * 1000).toISOString();

        const isEligible = await this.isEligibleForNative(address);

        return {
            ethEligible: hasEnoughCJNT && isEligible,
            kaiEligible: hasEnoughCJNT && isEligible,
            lastReceivedAt,
            isAdminReceived: faucetInfo.isAdminReceive,
        };
    }

    async sendCJNT(address: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, wallet);

        const tx = await contract.transfer(address, ethers.parseUnits('100', 18));
        await tx.wait();
        return tx.hash;
    }

    async sendKai(address: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(process.env.KLAYTN_RPC_URL!);
        const wallet = new ethers.Wallet(process.env.KLAYTN_PRIVATE_KEY!, provider);
        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther('0.01'),
        });
        await tx.wait();
        return tx.hash;
    }
}
