import { Test, TestingModule } from '@nestjs/testing';
import { MovieListService } from './movie-list.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MovieList } from './entities/movie-list.entity';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';

jest.mock('fs');

// Mock csv-parser
jest.mock('csv-parser', () => {
    return () => {
        return new Readable({
            objectMode: true,
            read() { },
        });
    };
});

describe('MovieListService', () => {
    let service: MovieListService;
    let repositoryMock: any;

    const mockMovieListRepository = {
        save: jest.fn(),
        find: jest.fn(),
        findOneBy: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MovieListService,
                {
                    provide: getRepositoryToken(MovieList),
                    useValue: mockMovieListRepository,
                },
            ],
        }).compile();

        service = module.get<MovieListService>(MovieListService);
        repositoryMock = module.get(getRepositoryToken(MovieList));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('readFileData', () => {
        it('should read CSV and save movies correctly', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const csvParserMockStream = new Readable({
                objectMode: true,
                read() { },
            });

            const fsStream = {
                pipe: jest.fn().mockReturnValue(csvParserMockStream),
            };

            (fs.createReadStream as jest.Mock).mockReturnValue(fsStream);

            const promise = service.readFileData();

            const movieData1 = {
                year: '2020',
                title: 'Cant Stop the Music',
                studios: 'Hollywood Pictures',
                producers: 'Allan Carr',
                winner: 'yes',
            };
            const movieData2 = {
                year: '2021',
                title: 'Showgirls',
                studios: 'Cannon Films',
                producers: 'Bill Cosby',
                winner: 'no',
            };

            csvParserMockStream.emit('data', movieData1);
            csvParserMockStream.emit('data', movieData2);
            csvParserMockStream.emit('end');

            await promise;

            expect(repositoryMock.save).toHaveBeenCalledTimes(2);
            expect(repositoryMock.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    year: 2020,
                    title: 'Cant Stop the Music',
                    winner: true,
                }),
            );
            expect(repositoryMock.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    year: 2021,
                    title: 'Showgirls',
                    winner: false,
                }),
            );
        });

        it('should handle file not found', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            const loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

            await service.readFileData();

            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('CSV file not found'));
            expect(repositoryMock.save).not.toHaveBeenCalled();
        });
    });

    describe('getMinMaxIntervals', () => {
        it('should return correct min and max intervals', async () => {
            const dbWinners = [
                { producers: 'Allan Carr', year: 2000, winner: true },
                { producers: 'Allan Carr', year: 2002, winner: true },
                { producers: 'Bill Cosby', year: 2005, winner: true },
                { producers: 'Bill Cosby', year: 2020, winner: true },
                { producers: 'Bo Derek', year: 2001, winner: true },
                { producers: 'Buzz Feitshans', year: 2010, winner: true },
                { producers: 'Buzz Feitshans', year: 2011, winner: true },
                { producers: 'Gloria Katz, Joel Silver', year: 2015, winner: true },
                { producers: 'Gloria Katz', year: 2018, winner: true },
                { producers: 'Joel Silver', year: 2030, winner: true },
            ] as MovieList[];

            repositoryMock.find.mockResolvedValue(dbWinners);

            const result = await service.getMinMaxIntervals();

            expect(result.min).toHaveLength(1);
            expect(result.min[0].producer).toBe('Buzz Feitshans');
            expect(result.min[0].interval).toBe(1);

            expect(result.max).toHaveLength(2);
            expect(result.max).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ producer: 'Bill Cosby', interval: 15 }),
                    expect.objectContaining({ producer: 'Joel Silver', interval: 15 }),
                ])
            );
        });

        it('should returns empty lists if no intervals calculation possible', async () => {
            repositoryMock.find.mockResolvedValue([]);
            const result = await service.getMinMaxIntervals();
            expect(result.min).toEqual([]);
            expect(result.max).toEqual([]);
        })
    });
});
