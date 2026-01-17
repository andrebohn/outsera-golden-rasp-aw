## Description

API RESTful para possibilitar a leitura da lista de indicados e vencedores da categoria Pior Filme do Golden Raspberry Awards. Usado NestJS e TypeORM, sendo utilizado a sqlite em memória para registrar os dados.

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
# Integration tests
$ npm run test:e2e

# unit tests
$ npm run test
```