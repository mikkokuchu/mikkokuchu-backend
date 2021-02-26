import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entity/user.entity';
import { MikkokuTransaction } from './entity/mikkokuTransaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/sqlite.db',
      entities: [User, MikkokuTransaction],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([MikkokuTransaction, User]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
