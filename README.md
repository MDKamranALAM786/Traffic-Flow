# 🗺️ BestRoute

BestRoute is a microservices-based web application designed to handle routing, authentication, and traffic data processing. It utilizes a modern tech stack featuring a React frontend, a Node.js API Gateway, and multiple specialized Node.js backend services connecting to MongoDB and Neo4j databases.

## 🏗️ Architecture

The project follows a microservices architecture, separated into the following main components:

- 🎨 **Frontend**: A React application built with Vite.
- 🚪 **API Gateway**: A central entry point for all client requests, routing them to the appropriate backend services.
- ⚙️ **Services**: Independent microservices handling specific domains (Auth, Route, Traffic).

---

## 💻 Tech Stack

### 🎨 Frontend
- **Framework**: ⚛️ React 19
- **Build Tool**: ⚡ Vite
- **Styling**: 💅 Material UI (`@mui/material`), Emotion
- **Routing**: 🧭 React Router DOM
- **HTTP Client**: 📡 Axios

### 🚪 API Gateway
- **Runtime**: 🟢 Node.js
- **Framework**: 🚂 Express
- **Proxy**: 🔄 `http-proxy-middleware`
- **Security/Auth**: 🛡️ CORS, 🔑 JWT

### ⚙️ Microservices (`/Services`)
1. 🔐 **Auth Service**
   - **Framework**: 🚂 Express (Node.js)
   - **Database**: 🍃 MongoDB (via Mongoose)
   - **Security**: 🔒 `bcrypt` (password hashing), 🎟️ `jsonwebtoken` (JWT)

2. 🗺️ **Route Service**
   - **Framework**: 🚂 Express (Node.js)
   - **Database**: 🕸️ Neo4j Graph Database (via `neo4j-driver`)
   - **Purpose**: Handles graph-based route calculations and management.

3. 🚦 **Traffic Service**
   - **Framework**: 🚂 Express (Node.js)
   - **Database**: 🕸️ Neo4j Graph Database (via `neo4j-driver`)
   - **HTTP Client**: 📡 Axios (for fetching external traffic data)
   - **Purpose**: Manages and processes traffic-related data.

---

## 🚀 Getting Started

### 📋 Prerequisites
- 🟢 Node.js (v18 or higher recommended)
- 🍃 MongoDB (Local or Atlas)
- 🕸️ Neo4j Database

### 🛠️ Installation & Setup

You will need to install dependencies for each service individually.

#### 1. 🚪 API Gateway
```bash
cd APIGateway
npm install
npm run dev
```

#### 2. 🔐 Auth Service
```bash
cd Services/Auth
npm install
npm run dev
```

#### 3. 🗺️ Route Service
```bash
cd Services/Route
npm install
npm run dev
```

#### 4. 🚦 Traffic Service
```bash
cd Services/Traffic
npm install
npm run dev
```

#### 5. 🎨 Frontend
```bash
cd Frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
BestRoute/
├── APIGateway/         # 🚪 Express API Gateway routing requests to services
│   ├── routes/
│   ├── server.js
│   └── package.json
├── Frontend/           # 🎨 React + Vite Frontend application
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── package.json
└── Services/           # ⚙️ Backend Microservices
    ├── Auth/           # 🔐 Handles user authentication (MongoDB)
    ├── Route/          # 🗺️ Handles routing logic (Neo4j)
    └── Traffic/        # 🚦 Handles traffic data (Neo4j)
```

## 📝 License
ISC
