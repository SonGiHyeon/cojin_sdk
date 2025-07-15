// backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // ✅ CORS 허용
    app.enableCors({
        origin: 'http://localhost:3000', // 프론트 주소
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    await app.listen(3001);
}
bootstrap();
