# YapYap Backend API

A Node.js backend API for the YapYap chat application, built with Express.js and MongoDB.

## 🚀 Features

- RESTful API with Express.js
- MongoDB database integration with Mongoose
- Docker containerization
- Development environment with hot reload
- Authentication system (ready for implementation)
- Real-time chat functionality (ready for implementation)

## 📁 Project Structure

```
yapyap-backend/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/
│   │   └── index.js          # Configuration and database connection
│   ├── controllers/
│   │   ├── authController.js # Authentication logic (pending)
│   │   └── chatController.js # Chat functionality (pending)
│   ├── middlewares/
│   │   └── authMiddleware.js # Authentication middleware (pending)
│   ├── models/
│   │   ├── User.js          # User data model (pending)
│   │   └── Message.js       # Message data model (pending)
│   ├── routes/
│   │   ├── authRoutes.js    # Authentication routes (pending)
│   │   └── chatRoutes.js    # Chat routes (pending)
│   └── utils/
│       └── jwt.js           # JWT utilities (pending)
├── docker-compose.yml        # Docker services configuration
├── Dockerfile               # Container build instructions
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

## 🛠 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MongoDB (if running locally without Docker)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/genshzin/yapyap-backend.git
   cd yapyap-backend
   ```

2. **Start the application with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - MongoDB container on port `27017`
   - API server on port `3000`

3. **Verify the application is running**
   ```bash
   curl http://localhost:3000
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if not using Docker)
   ```bash
   mongod
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload (nodemon)
- `npm test` - Run tests (not implemented yet)

## 🌐 API Endpoints

### Health Check
- `GET /` - API status and basic information
- `GET /health` - Health check with database connection status

### Authentication (Coming Soon)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Chat (Coming Soon)
- `GET /chat/messages` - Retrieve chat messages
- `POST /chat/messages` - Send a new message
- `GET /chat/rooms` - Get chat rooms

## 🐳 Docker Configuration

The application uses Docker Compose with two services:

- **MongoDB**: Database service with persistent volume
- **API Server**: Node.js application with hot reload in development

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongo:27017/yapyap_dev` |

## 🔧 Configuration

Configuration is handled in [`src/config/index.js`](src/config/index.js), which includes:

- Server port configuration
- Environment settings
- MongoDB connection setup
- Database connection function

## 📦 Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB object modeling
- `dotenv` - Environment variable loader
- `mongodb` - MongoDB driver

### Development Dependencies
- `nodemon` - Development server with hot reload

## 🚧 Development Status

This project is currently in development. The following components are ready for implementation:

- ✅ Basic server setup
- ✅ MongoDB connection
- ✅ Docker configuration
- ✅ Development environment
- ⏳ User authentication system
- ⏳ Chat functionality
- ⏳ JWT token management
- ⏳ API routes implementation
- ⏳ Data models


**Note**: This project is currently in active development. Many features are planned but not yet implemented. Check the project structure comments for current implementation status.