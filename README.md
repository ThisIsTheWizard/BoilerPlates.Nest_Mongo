# BoilerPlates.Nest_Mongo

![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)
![Prisma](https://img.shields.io/badge/Prisma-6-blue?logo=prisma)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![Express.js](https://img.shields.io/badge/Express.js-4.18-lightgrey?logo=express)
![License](https://img.shields.io/badge/License-MIT-yellow)

A boilerplate setup for running a **NestJS** backend with **MongoDB** and **Prisma ORM** using Docker Compose.
This repository provides a ready-to-use **NestJS + Express API** connected to MongoDB for rapid backend development.

---

## 🚀 Features

- NestJS + Express.js REST API
- MongoDB database running in Docker
- Prisma ORM for type-safe database access
- Mongo Express UI for quick data inspection
- Environment-based configuration
- Fully Dockerized for easy setup and deployment

---

## 📂 Project Structure

```
BoilerPlates.Nest_Mongo/
├───prisma/
│   ├── schema.prisma        # Database schema with models
│   └── seed.ts              # Database seeding script
└───src/
   ├───main.ts               # NestJS entry point
   ├───app/                  # Application core
   │   ├── app.module.ts     # Root module
   │   ├── app.controller.ts # Root controller
   │   └── app.service.ts    # Root service
   ├───auth/                 # Authentication module
   │   ├── auth.controller.ts
   │   ├── auth.service.ts
   │   ├── auth.module.ts
   │   └── auth.dto.ts
   ├───user/                 # User management
   │   ├── user.controller.ts
   │   ├── user.service.ts
   │   ├── user.module.ts
   │   └── user.dto.ts
   ├───role/                 # Role management
   │   ├── role.controller.ts
   │   ├── role.service.ts
   │   ├── role.module.ts
   │   └── role.dto.ts
   ├───permission/           # Permission management
   │   ├── permission.controller.ts
   │   ├── permission.service.ts
   │   ├── permission.module.ts
   │   └── permission.dto.ts
   └───prisma/
       └── prisma.service.ts # Prisma database service
```

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/ThisIsTheWizard/BoilerPlates.Nest_Mongo.git
cd BoilerPlates.Nest_Mongo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy `.env.sample` to `.env` and update your configuration:

```bash
cp .env.sample .env
```

Example `.env` entries:

```
DATABASE_URL=mongodb://mongo_user:mongo_password@localhost:27017/nest_boiler?authSource=admin
PORT=8000
```

### 4. Start services with Docker

```bash
docker compose up -d --build
```

---

## 🌐 Access

- **NestJS API** → [http://localhost:8000](http://localhost:8000)
- **MongoDB** → [mongodb://localhost:27017](mongodb://localhost:27017) (credentials in `.env`)
- **Mongo Express** → [http://localhost:8081](http://localhost:8081) (basic auth from `.env`)

---

## 🛠️ Commands

- Start containers:

```bash
docker compose up -d --build
```

- Stop containers:

```bash
docker compose down
```

- View logs:

```bash
docker compose logs -f
```

- Run NestJS server locally (without Docker):

```bash
pnpm nest:dev
```

- Synchronize schema with MongoDB:

```bash
pnpm db:push
```

- Generate Prisma client:

```bash
pnpm db:generate
```

- Seed the database:

```bash
pnpm seed
```

---

## 📦 Volumes

Data is persisted via Docker volumes:

- `node_server_data` → Stores Node server build artifacts (production/test containers)
- `mongo_data` → Stores MongoDB database files

---

## 📝 License

This boilerplate is provided under the MIT License.
Feel free to use and modify it for your projects.

---

👋 Created by [Elias Shekh](https://eliasshekh.com)
If you find this useful, ⭐ the repo or reach out!
