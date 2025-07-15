import { ethers } from "ethers";
import CJNTokenABI from "./contracts/CJNToken.json";

export class CojinClient {
    private token: ethers.Contract;

    constructor(
        provider: ethers.Provider,
        signer: ethers.Signer,
        cjntAddress: string
    ) {
        this.token = new ethers.Contract(cjntAddress, CJNTokenABI.abi, signer);
    }

    async getCJNTBalance(address: string): Promise<string> {
        const balance = await this.token.balanceOf(address);
        return ethers.formatUnits(balance, 18);
    }

    async approveCJNT(spender: string, amount: string): Promise<ethers.TransactionResponse> {
        const wei = ethers.parseUnits(amount, 18);
        return this.token.approve(spender, wei);
    }
}
