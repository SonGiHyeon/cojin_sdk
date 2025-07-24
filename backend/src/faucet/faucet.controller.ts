import {
    Body,
    Controller,
    Get,
    Post,
    Param,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { FaucetService } from './faucet.service';

@Controller('faucet')
export class FaucetController {
    constructor(private readonly faucetService: FaucetService) { }

    @Get('is-eligible/:address')
    async isEligible(@Param('address') address: string) {
        try {
            const result = await this.faucetService.checkEligibility(address);
            console.log('[GET /faucet/is-eligible] result:', result);
            return result;
        } catch (err: any) {
            console.error('[GET /faucet/is-eligible] Error:', err);
            throw new InternalServerErrorException(err.message || '쿨다운 정보 조회 실패');
        }
    }

    @Post('request-cjnt')
    async requestCJNT(@Body('address') address: string) {
        try {
            const txHash = await this.faucetService.sendCJNT(address);
            return { txHash };
        } catch (err: any) {
            console.error('[POST /faucet/request-cjnt] Error:', err);
            throw new InternalServerErrorException(err.message || 'CJNT 전송 실패');
        }
    }

    @Post('request-eth')
    async requestETH(@Body('address') address: string) {
        try {
            const { ethEligible } = await this.faucetService.checkEligibility(address);

            if (!ethEligible) {
                console.warn(`[POST /faucet/request-eth] ❌ ETH eligibility false for ${address}`);
                throw new BadRequestException('ETH는 이미 수령했거나, 아직 쿨다운 중입니다.');
            }

            const txHash = await this.faucetService.sendNativeToken(address);
            return { txHash };
        } catch (err: any) {
            console.error('[POST /faucet/request-eth] Error:', err);
            throw err instanceof BadRequestException
                ? err
                : new InternalServerErrorException(err.message || 'ETH 전송 실패');
        }
    }

    @Post('request-kai')
    async requestKAI(@Body('address') address: string) {
        try {
            const { kaiEligible } = await this.faucetService.checkEligibility(address);

            if (!kaiEligible) {
                console.warn(`[POST /faucet/request-kai] ❌ KAI eligibility false for ${address}`);
                throw new BadRequestException('KAI는 이미 수령했거나, 아직 쿨다운 중입니다.');
            }

            const txHash = await this.faucetService.sendKai(address);
            return { txHash };
        } catch (err: any) {
            console.error('[POST /faucet/request-kai] Error:', err);
            throw err instanceof BadRequestException
                ? err
                : new InternalServerErrorException(err.message || 'KAI 전송 실패');
        }
    }
}
