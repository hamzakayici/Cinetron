import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Serve static files from public directory
    app.useStaticAssets(join(__dirname, '..', 'public'), {
        prefix: '/files/',
    });

    app.enableCors();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    
    // Increase payload size limit
    const bodyParser = require('body-parser');
    app.use(bodyParser.json({ limit: '500mb' }));
    app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

    const config = new DocumentBuilder()
        .setTitle('Cinetron API')
        .setDescription('Cinetron media server API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server listening on http://0.0.0.0:${port}`);
}
bootstrap();
