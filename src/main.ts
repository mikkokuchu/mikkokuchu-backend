import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'X-Requested-With, Origin, X-Csrftoken, Content-Type, Accept,Referer,User-Agent',
    );
    res.header('Access-Control-Allow-Credentials', true);
    if ('OPTIONS' == req.method) {
      res.send(204); // 204: No Content
    } else {
      next();
    }
  });
  await app.listen(80);
}

bootstrap();
