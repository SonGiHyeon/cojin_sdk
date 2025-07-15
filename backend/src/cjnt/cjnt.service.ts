// backend/src/cjnt/cjnt.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class CjntService {
    async getBalance(address: string): Promise<number> {
        console.log(`Checking CJNT balance for ${address}`);
        return 100; // 예시용으로 충분한 잔액이라고 가정
    }
}
