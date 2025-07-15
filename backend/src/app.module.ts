import { Module } from '@nestjs/common';
import { FaucetController } from './faucet/faucet.controller';
import { FaucetService } from './faucet/faucet.service'
import { CjntService } from './cjnt/cjnt.service'
import { FaucetTrackerService } from './faucet-tracker/faucet-tracker.service'; // ✅ 추가
import { ConfigModule } from '@nestjs/config';


@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [FaucetController],
    providers: [FaucetService, CjntService, FaucetTrackerService], // ✅ 여기도 추가
})
export class AppModule { }
