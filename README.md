# YapYap Backend API

A Node.js backend API for the YapYap chat application, built with Express.js, MongoDB, and Socket.IO for real-time communication.

## 🚀 Features

- RESTful API with Express.js
- MongoDB database integration with Mongoose
- Real-time messaging with Socket.IO
- Docker containerization
- Development environment with hot reload
- Complete authentication system with JWT
- File upload functionality
- Input validation and sanitization
- User search functionality
- Chat rooms and direct messaging
- Message read receipts and typing indicators
- Online status tracking

## 📁 Project Structure

```
yapyap-backend/
├── src/
│   ├── app.js                      # Main application entry point with Socket.IO
│   ├── config/
│   │   └── index.js               # Configuration and database connection
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   └── chatController.js      # Chat functionality
│   ├── middlewares/
│   │   ├── authMiddleware.js      # Authentication middleware
│   │   ├── uploadMiddleware.js    # File upload middleware
│   │   ├── validationMiddleware.js # Input validation middleware
│   │   └── socketMiddleware.js    # Socket.IO authentication
│   ├── models/
│   │   ├── User.js               # User data model
│   │   ├── Chat.js               # Chat room data model
│   │   └── Message.js            # Message data model
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── chatRoutes.js         # Chat REST API routes
│   │   └── users.js              # User search routes
│   ├── socket/
│   │   └── socketHandler.js      # WebSocket event handlers
│   └── utils/
│       └── jwt.js                # JWT utilities
├── docker-compose.yml             # Docker services configuration
├── Dockerfile                    # Container build instructions
├── package.json                  # Dependencies and scripts
└── .env                         # Environment variables
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
   - WebSocket server on port `3000`

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

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile (protected)
- `PUT /auth/profile` - Update user profile (protected)

### User Management
- `GET /api/users/search` - Search users by username or email (protected)

### Chat API
- `GET /chat/rooms` - Get user's chat rooms with unread counts (protected)
- `POST /chat/rooms` - Create or get existing direct chat (protected)
- `GET /chat/messages?chatId=<id>&page=<num>&limit=<num>` - Get chat messages with pagination (protected)
- `POST /chat/messages` - Send a new message (protected)
- `PATCH /chat/messages/read` - Mark messages as read (protected)
- `PATCH /chat/messages/:messageId` - Edit a message (protected)
- `DELETE /chat/messages/:messageId` - Delete a message (protected)

## 🔌 Socket.IO Events

### Client to Server Events
- `join_chats` - Join all user's chat rooms
- `send_message` - Send a real-time message
  ```json
  {
    "chatId": "chat_id",
    "content": "message content",
    "type": "text"
  }
  ```
- `typing_start` - Notify others that user is typing
- `typing_stop` - Notify others that user stopped typing
- `mark_read` - Mark messages as read in real-time

### Server to Client Events
- `new_message` - Receive new messages
- `user_typing` - Someone started typing
- `user_stop_typing` - Someone stopped typing
- `messages_read` - Messages were read by someone
- `user_status_change` - User online/offline status changed
- `online_count` - Current online users count
- `chats_joined` - Confirmation of joining chats
- `error` - Error notifications

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
- `socket.io` - Real-time bidirectional communication
- `dotenv` - Environment variable loader
- `mongodb` - MongoDB driver
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `multer` - File upload handling
- `express-validator` - Input validation


### Development Dependencies
- `nodemon` - Development server with hot reload

## 🚧 Development Status

This project is **production-ready** with complete chat functionality. All core features have been implemented:

- ✅ Basic server setup
- ✅ MongoDB connection
- ✅ Docker configuration
- ✅ Development environment
- ✅ User authentication system
- ✅ JWT token management
- ✅ User data models
- ✅ Authentication routes
- ✅ Authentication middleware
- ✅ File upload middleware
- ✅ Input validation middleware
- ✅ Chat functionality
- ✅ Message data models
- ✅ Chat routes implementation
- ✅ Real-time messaging with Socket.io
- ✅ User search functionality
- ✅ Online status tracking
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ WebSocket authentication

**Current Features:**
- Complete authentication system with registration, login, and profile management
- Real-time chat with direct messaging
- User search and discovery
- Message history with pagination
- Read receipts and typing indicators
- Online/offline status tracking
- Secure WebSocket connections with JWT authentication
- RESTful API for all chat operations
