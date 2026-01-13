## Description

Autor: André Bohn
Data: 12/01/2026

Projeto avaliação processo seleção outsera.

Desenvolva uma API RESTful para possibilitar a leitura da lista de indicados e vencedores da categoria Pior Filme do Golden Raspberry Awards.

Usado NestJS e TypeORM, sendo utilizado a sqlite em memória para registrar os dados.

## Project setup

```bash
$ npm install
```

## Compile and run the project

Para fazer o load inicial é necessário a presença do arquivo Movielist.csv na pasta files que se encontra na raiz do projeto.

files
 --- Movielist.csv

 ```bash
# watch mode
$ npm run start:dev
```

## Run tests

```bash
# e2e tests
$ npm run test:e2e
```

baseUrl = localhost:3000

### Buscar todos os filmes
GET {{baseUrl}}/movie-list

### Criar novo filme
POST {{baseUrl}}/movie-list
Content-Type: application/json

JSON Body:
{
  "title": "Can't Stop the Music",
  "year": 1980,
  "studios": "Associated Film Distribution",
  "producers": "Allan Carr",
  "winner": true
}

### Alterar dados de um filme
PATCH {{baseUrl}}/movie-list/:id
Content-Type: application/json

JSON Body:
{
  "title": "Can't Stop the Music - Update",
}

### Deletar dados de um filme
DELETE {{baseUrl}}/movie-list/:id

### Buscar os dados do escopo desta avaliação 

Buscar Obter o produtor com maior intervalo entre dois prêmios consecutivos, e o que obteve dois prêmios mais rápido

GET {{baseUrl}}/movie-list/min-max-intervals

Resultado retornado com os dados base enviados no arquivo Movielist.csv 
{
    "min": [
        {
            "producer": "Joel Silver",
            "previousWin": 1990,
            "followingWin": 1991,
            "interval": 1
        }
    ],
    "max": [
        {
            "producer": "Matthew Vaughn",
            "previousWin": 2002,
            "followingWin": 2015,
            "interval": 13
        }
    ]
}
