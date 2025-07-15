// faucet.service.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable } from '@nestjs/common'
import { Contract, ethers } from 'ethers'; // ✅ Contract도 import
import { ConfigService } from '@nestjs/config';
import CJNTokenJson from '../../../sdk/contracts/CJNToken.json'
import FaucetTrackerAbi from '../../../sdk/contracts/FaucetTracker.json'
import { ERC20_ABI } from '../constants/erc20.abi'; // 경로 맞게 수정해줘

const FAUCET_TRACKER_ADDRESS = process.env.FAUCET_TRACKER_CONTRACT as string;
const CJNTOKEN_ADDRESS = process.env.CJNT_CONTRACT as string
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

@Injectable()
export class FaucetService {
    constructor(private configService: ConfigService) { } // ✅ 주입

    async sendTestToken(chain: string, address: string): Promise<string> {
        if (chain !== 'sepolia') throw new Error('Only sepolia is supported')

        console.log(`Send token to ${address} on ${chain}`)

        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, wallet)

        const tx = await contract.transfer(address, ethers.parseEther('0.1'))
        await tx.wait()

        console.log(`✅ Token sent! txHash: ${tx.hash}`)
        return tx.hash
    }

    async sendNativeToken(address: string): Promise<string> {
        const isEligible = await this.isEligibleForNative(address)
        if (!isEligible) {
            throw new Error('이미 토큰을 수령했거나, 아직 하루가 지나지 않았습니다.')
        }

        const wallet = new ethers.Wallet(PRIVATE_KEY, new ethers.JsonRpcProvider(SEPOLIA_RPC_URL))

        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther("0.01")
        })

        await tx.wait()

        // ✅ FaucetTracker에 수령 기록 남기기
        const tracker = new ethers.Contract(FAUCET_TRACKER_ADDRESS, FaucetTrackerAbi.abi, wallet)
        await tracker.updateLastReceive(address)

        return tx.hash
    }


    async isEligibleForNative(address: string): Promise<boolean> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
        const contract = new ethers.Contract(FAUCET_TRACKER_ADDRESS, FaucetTrackerAbi.abi, provider)
        console.log('🔍 Calling isEligible with address:', address)

        try {
            const eligible = await contract.isEligible(address)
            console.log('✅ Eligible result:', eligible)
            return eligible
        } catch (error: any) {
            console.error('❌ Error calling isEligible:', error.message || error)
            console.error('🔧 Full error object:', error)
            throw error
        }
    }


    async getCJNTBalance(address: string): Promise<number> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, provider);

        const balance = await contract.balanceOf(address);
        return Number(ethers.formatUnits(balance, 18));
    }

    async checkCJNTBalance(userAddress: string): Promise<bigint> {
        const cjntTokenAddress = this.configService.get<string>('CJNT_CONTRACT');
        if (!cjntTokenAddress) {
            throw new Error('CJNT_CONTRACT is not set in .env');
        }

        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(cjntTokenAddress, ERC20_ABI, provider);
        const balance: bigint = await contract.balanceOf(userAddress);

        return balance;
    }

    async sendCJNT(address: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
        const contract = new ethers.Contract(CJNTOKEN_ADDRESS, CJNTokenJson.abi, wallet)

        const tx = await contract.transfer(address, ethers.parseUnits('100', 18))
        await tx.wait()

        console.log(`✅ CJNT 100 전송 완료: ${tx.hash}`)
        return tx.hash
    }

    async sendKai(address: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(process.env.KLAYTN_RPC_URL!)
        const wallet = new ethers.Wallet(process.env.KLAYTN_PRIVATE_KEY!, provider)

        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther("0.01")  // 필요 시 변경 가능
        })

        const balance = await provider.getBalance(wallet.address)
        console.log(`🔍 Wallet balance: ${ethers.formatEther(balance)} KAI`)


        await tx.wait()
        console.log(`✅ KAI 전송 완료! txHash: ${tx.hash}`)
        return tx.hash
    }

}
