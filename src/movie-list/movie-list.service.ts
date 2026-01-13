import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { CreateMovieListDto } from './dto/create-movie-list.dto';
import { UpdateMovieListDto } from './dto/update-movie-list.dto';
import { MovieList } from './entities/movie-list.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';

type IntervalItem = {
  producer: string;
  interval: number | null;
  previousWin: number;
  followingWin: number | null;
};

type ProducerItem = {
  producer: string;
  year: number;
};

@Injectable()
export class MovieListService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MovieListService.name);

  constructor(
    @InjectRepository(MovieList)
    private movieListRepository: Repository<MovieList>,
  ) {}

  create(createMovieListDto: CreateMovieListDto) {
    return this.movieListRepository.save(createMovieListDto);
  }

  findAll() {
    return this.movieListRepository.find();
  }

  findOne(id: number) {
    return this.movieListRepository.findOneBy({ id });
  }

  update(id: number, updateMovieListDto: UpdateMovieListDto) {
    return this.movieListRepository.update(id, updateMovieListDto);
  }

  remove(id: number) {
    return this.movieListRepository.delete(id);
  }

  async onApplicationBootstrap() {
    this.logger.log('Iniciando carregamento de dados do CSV...');
    await this.readFileData();
  }

  // Carrega dados do arquivo CSV para o banco de dados
  async readFileData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const csvMovieFile = path.join(process.cwd(), 'files/Movielist.csv');

      if (!fs.existsSync(csvMovieFile)) {
        this.logger.warn(`Arquivo CSV não encontrado em: ${csvMovieFile}`);
        resolve();
        return;
      }

      let linhasProcessadas = 0;
      let qtdeErros = 0;

      const stream = fs
        .createReadStream(csvMovieFile)
        .pipe(csvParser({ separator: ';' }));

      const insertMovie = async (data: any) => {
        try {
          const movie = new MovieList();
          movie.year = parseInt(data.year.trim(), 10);
          movie.title = data.title?.trim() || '';
          movie.studios = data.studios?.trim() || '';
          movie.producers = data.producers?.trim() || '';
          movie.winner =
            data.winner && data.winner.toLowerCase().trim() === 'yes';

          await this.movieListRepository.save(movie);
          linhasProcessadas++;
        } catch (error) {
          qtdeErros++;
          this.logger.error(
            `Erro ao salvar filme: ${error.message} - Dados: ${JSON.stringify(data)}`,
          );
        }
      };

      const linhas: any[] = [];

      stream
        .on('data', (data) => {
          linhas.push(data);
        })
        .on('end', async () => {
          // Processar todas as linhas sequencialmente
          for (const row of linhas) {
            await insertMovie(row);
          }
          this.logger.log(
            `Leitura do arquivo CSV concluída. ${linhasProcessadas} filmes carregados, ${qtdeErros} erros.`,
          );
          resolve();
        })
        .on('error', (error) => {
          this.logger.error(`Erro ao ler arquivo CSV: ${error.message}`);
          reject(error);
        });
    });
  }

  // Analisa a string de produtores e retorna um array de nomes individuais
  parseProducers(producersStr: string): string[] {
    return (producersStr ?? "")
      .split(/\s*,\s*and\s+|\s*,\s*|\s+and\s+/i)
      .map(p => p.trim())
      .filter(Boolean);
  }

  // Monta lista ordena por ano de todos os produtores com respectivo ano de premiação
  async buildProducerWinList(): Promise<ProducerItem[]> {
    const producerWins: ProducerItem[] = [];
    const producerWinsList = await this.movieListRepository.find({
      where: { winner: true },
      order: { year: 'ASC' },
    });

    for (const producerWin of producerWinsList) {
      const year = producerWin.year;
      const produtores = this.parseProducers(producerWin.producers);
      for (const producer of produtores) {
        producerWins.push({ producer, year });
      }
    }

    return producerWins;
  }

  // Monta os intervalos de premiação para cada produtor
  async buildIntervals(): Promise<IntervalItem[]> {
    const intervalos: IntervalItem[] = [];

    const producerWins = await this.buildProducerWinList();

    producerWins.forEach((producerWin) => {
      const intervalo = intervalos.find(
        (prodWin) => prodWin.producer === producerWin.producer,
      );
      if (intervalo) {
        if (intervalo.followingWin !== null) {
          const open = intervalos.find(
            (prodInterval) =>
              prodInterval.producer === producerWin.producer &&
              prodInterval.followingWin === null,
          );
          if (open) {
            open.followingWin = producerWin.year;
            open.interval = producerWin.year - open.previousWin;
          }
        } else {
          intervalo.followingWin = producerWin.year;
          intervalo.interval = producerWin.year - intervalo.previousWin;
        }
      }
      intervalos.push({
        producer: producerWin.producer,
        previousWin: producerWin.year,
        followingWin: null,
        interval: null,
      });
    });

    return intervalos;
  }

  // Retorna os produtores com os menores e maiores intervalos de premiação
  async getMinMaxIntervals(): Promise<{
    min: IntervalItem[];
    max: IntervalItem[];
  }> {
    const intervals = await this.buildIntervals();
    const validIntervals = intervals
      .map((buildInterval) => buildInterval.interval)
      .filter(
        (typeInterval): typeInterval is number =>
          typeof typeInterval === 'number',
      );

    const minInterval = Math.min(...validIntervals);
    const maxInterval = Math.max(...validIntervals);

    const minIntervals = intervals.filter((i) => i.interval === minInterval);
    const maxIntervals = intervals.filter((i) => i.interval === maxInterval);

    return { min: minIntervals, max: maxIntervals };
  }
}
