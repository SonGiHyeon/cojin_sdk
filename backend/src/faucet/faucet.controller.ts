import { Body, Controller, Post } from '@nestjs/common';
import { FaucetService } from './faucet.service';

@Controller('faucet')
export class FaucetController {
    constructor(private readonly faucetService: FaucetService) { }

    /**
     * CJNT 100개 전송 - 프론트에서 POST /faucet/request-cjnt로 요청
     */
    @Post('request-cjnt')
    async requestCJNT(@Body('address') address: string) {
        const txHash = await this.faucetService.sendCJNT(address);
        return { txHash };
    }

    /**
     * Sepolia ETH 전송 요청 - CJNT 잔고 100 이상 필요
     */
    @Post('request-eth')
    async requestNative(@Body('address') address: string) {
        const balance = await this.faucetService.getCJNTBalance(address);
        if (balance < 100) {
            throw new Error('CJNT 잔고가 부족합니다. 최소 100 CJNT 필요');
        }
        const txHash = await this.faucetService.sendNativeToken(address);
        return { txHash };
    }

    /**
     * KAI 전송
     */
    @Post('request-kai')
    async requestKAI(@Body('address') address: string) {
        const txHash = await this.faucetService.sendKai(address);
        return { txHash };
    }
}
