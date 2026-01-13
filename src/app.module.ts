import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MovieListModule } from './movie-list/movie-list.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from './ormconfig';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [MovieListModule, TypeOrmModule.forRoot(config)],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
