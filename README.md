## Prerequisites

- NodeJs
- Yarn or Npm
- PostgresSQL
- PgAdmin (Optional)

## How to Run (Without Docker)

- Copy content of `.env.example`
- Create a new file in the root directory called `.env` and paste content from the previous step
- Run `npm install` to install dependencies
- Run `npm run migrate` to run migrations. If prompted to enter a name for a new migration, exit by pressing `esc`
- Run `npm run seed` to seed default admin user to the database.
- Run `npm run dev` to start local server
- Navigate to `http://localhost:3000` to view the application
- You can login as an admin using these credentials

## How to Run (With Docker)

- Copy content of `.env.example`
- Create a new file in the root directory called `.env` and paste content from the previous step
- Create a database using a name that corresponds with the `dbName` used in the `DATABASE_URL` env variable.
- Run `docker-compose build` to build the image
- Run `docker-compose up -d` to start the container
- Run `docker-compose exec app npm run migrate` to run migrations. If prompted to enter a name for a new migration, exit by pressing `esc`
- Run `docker-compose exec app npm run seed` to seed default admin user to the database.
- Navigate to `http://localhost:3000` to view the application
- You can login as an admin using these credentials

```
Email: admin_user@gmail.com
Password: admin_user
```

- Or login as an a normal user using these credentials

```
Email: test_user@gmail.com
Password: test_user
```

## Updating Schema

- Make changes to migrations file (if required)
- Add changes to `schema.prisma`
- Run `npx prisma generate`
- Re-run migrations

## Testing

- To run existing tests, run `npm run test` or `npm test`
- To add more tests, create test files under `__tests__` folder
