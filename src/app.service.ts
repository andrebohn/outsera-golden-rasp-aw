import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAvaliacao(): string {
    return 'Avaliação backend node JS!';
  }
}
