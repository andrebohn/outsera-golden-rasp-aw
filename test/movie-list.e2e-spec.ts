import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Ousera Golden Rasp Award API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /movie-list', () => {
    it('Teste da inclusão de filme', () => {
      const createMovieDto = {
        title: 'Godzilla',
        year: 1998,
        studios: 'TriStar Pictures',
        producers: 'Roland Emmerich and Dean Devlin',
        winner: false,
      };

      return request(app.getHttpServer())
        .post('/movie-list')
        .send(createMovieDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(createMovieDto.title);
          expect(res.body.year).toBe(createMovieDto.year);
        });
    });

    it('retorna 400 se dados inválidos forem fornecidos', () => {
      const invalidData = {
        title: 'Test Movie',
      };

      return request(app.getHttpServer())
        .post('/movie-list')
        .send(invalidData)
        .expect(400);
    });

    it('Testa gravação de multiplos filmes', async () => {
      const movies = [
        {
          title: 'Spice World',
          year: 1998,
          studios: 'Columbia Pictures',
          producers: 'Uri Fruchtan, Mark L. Rosen and Barnaby Thompson',
          winner: false,
        },
        {
          title: 'Wild Wild West',
          year: 1999,
          studios: 'Warner Bros.',
          producers: 'Jon Peters and Barry Sonnenfeld',
          winner: true,
        },
      ];

      for (const movie of movies) {
        await request(app.getHttpServer())
          .post('/movie-list')
          .send(movie)
          .expect(201);
      }
    });
  });

  describe('GET /movie-list', () => {
    it('Testa retorno de todos os filmes', () => {
      return request(app.getHttpServer())
        .get('/movie-list')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(0);
        });
    });

    it('Testa resultado dos dados fornecidos na proposta', async () => {
      const res = await request(app.getHttpServer())
        .get('/movie-list/min-max-intervals')
        .expect(200);
      expect(res.body).toHaveProperty('min');
      expect(res.body).toHaveProperty('max');
      expect(Array.isArray(res.body.min)).toBe(true);
      expect(Array.isArray(res.body.max)).toBe(true);
    });
  });

  describe('PATCH /movie-list/:id', () => {
    it('atualizacao parte dos campos do filme', async () => {
      const createMovieDto = {
        title: 'The Blair Witch Project',
        year: 1999,
        studios: 'Artisan Entertainment',
        producers: 'Robin Cowie and Gregg Hale',
        winner: false,
      };

      const createRes = await request(app.getHttpServer())
        .post('/movie-list')
        .send(createMovieDto)
        .expect(201);

      const movieId = createRes.body.id;

      const updateMovieDto = {
        title: 'The Blair Witch Project - Updated',
        winner: true,
      };

      return request(app.getHttpServer())
        .patch(`/movie-list/${movieId}`)
        .send(updateMovieDto)
        .expect(200);
    });

    it('atualizacao todos os campos do filme', async () => {
      const createMovieDto = {
        title: 'The Haunting',
        year: 1999,
        studios: 'DreamWorks',
        producers: 'Susan Arthur, Donna Roth and Colin Wilson',
        winner: false,
      };

      const createRes = await request(app.getHttpServer())
        .post('/movie-list')
        .send(createMovieDto)
        .expect(201);

      const movieId = createRes.body.id;

      const updateMovieDto = {
        title: 'The Haunting - Updated',
        year: 2000,
        studios: 'DreamWorks Updated',
        producers: 'Updated Producer',
        winner: true,
      };

      return request(app.getHttpServer())
        .patch(`/movie-list/${movieId}`)
        .send(updateMovieDto)
        .expect(200);
    });
  });

  describe('DELETE /movie-list/:id', () => {
    it('exclusão de um filme', async () => {
      const createMovieDto = {
        title: 'Star Wars: Episode I – The Phantom Menace',
        year: 1999,
        studios: '20th Century Fox',
        producers: 'Rick McCallum and George Lucas',
        winner: true,
      };

      const createRes = await request(app.getHttpServer())
        .post('/movie-list')
        .send(createMovieDto)
        .expect(201);

      const movieId = createRes.body.id;

      return request(app.getHttpServer())
        .delete(`/movie-list/${movieId}`)
        .expect(200);
    });

    it('excluindo filme inexistente', () => {
      return request(app.getHttpServer())
        .delete('/movie-list/999999')
        .expect(404);
    });
  });
});
