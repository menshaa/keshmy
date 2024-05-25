# ITEC404 Project - Team 4

### Team Members

- Aya Adel Mohamed Basher
- Abdulla F.A. Omar
- Habab Tarig Mohamed
- Hisham Husayn Alsadiq Aburaqibah
- Nasr Taher Nasr Swie

## Prerequisites

- NodeJs
- Yarn or Npm
- PostgresSQL
- PgAdmin (Optional)

## How to Run

- Copy content of `.env.example`
- Create a new file in the root directory called `.env` and paste content from the previous step
- Create a database using a name that corresponds with the `dbName` used in the `DATABASE_URL` env variable.
- Run `npm install` to install dependencies
- Run `npm run migrate` to run migrations. If prompted to enter a name for a new migration, exit by pressing `esc`
- Run `npm run seed` to seed default admin user to the database.
- Run `npm run dev` to start local server
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