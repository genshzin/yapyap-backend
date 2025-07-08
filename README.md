# YapYap Backend API

A Node.js backend API for the YapYap chat application, built with Express.js, MongoDB, and Socket.IO for real-time communication.

## Features
- **Authentication**: Registration, login, and logout with JWT-based authentication.
- **User Management**: Search users, view profiles, and manage profile pictures.
- **Friendship System**: Send, accept, decline, and delete friend requests.
- **Real-Time Chat**: Direct and group messaging with Socket.IO.
- **Message Features**: Edit, delete, reply, and mark messages as read.
- **Typing Indicators**: Notify when users are typing.
- **Online Status**: Track user online/offline status and notify contacts.
- **Pagination**: Efficient data retrieval with pagination for chats and messages.
- **File Uploads**: Profile picture uploads with validation.
- **Health Check**: API and database health monitoring.

## Project Structure

```
yapyap-backend/
├── src/
│   ├── app.js                      # Main application entry point
│   ├── config/
│   │   └── index.js                # Configuration and database connection
│   ├── controllers/
│   │   ├── authController.js       # Authentication logic
│   │   ├── chatController.js       # Chat functionality
│   │   └── friendshipController.js # Friendship management
│   ├── middlewares/
│   │   ├── authMiddleware.js       # JWT authentication middleware
│   │   ├── uploadMiddleware.js     # File upload middleware
│   │   ├── validationMiddleware.js # Input validation middleware
│   │   └── socketMiddleware.js     # Socket.IO authentication
│   ├── models/
│   │   ├── User.js                 # User data model
│   │   ├── Chat.js                 # Chat room data model
│   │   ├── Message.js              # Message data model
│   │   └── Friendship.js           # Friendship data model
│   ├── routes/
│   │   ├── authRoutes.js           # Authentication routes
│   │   ├── chatRoutes.js           # Chat REST API routes
│   │   ├── friendshipRoutes.js     # Friendship routes
│   │   └── users.js                # User search and profile routes
│   ├── socket/
│   │   └── socketHandler.js        # WebSocket event handlers
│   └── utils/
│       └── jwt.js                  # JWT utilities
├── Dockerfile                      # Container build instructions
├── docker-compose.yml              # Docker services configuration
├── package.json                    # Dependencies and scripts
└── .env                            # Environment variables
```

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MongoDB (if running locally without Docker)

## Quick Start

### Using Docker

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

### Without Docker

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm run dev
   ```

3. **Access the API**
   Open `http://localhost:3000` in your browser or API client.

## API Endpoints

### Health Check
- `GET /` - API status and basic information
- `GET /health` - Health check with database connection status

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### User Management
- `GET /api/users/search` - Search users by username or email
- `GET /api/users/:id/profile` - Get user profile
- `GET /api/users/:id/profile-picture` - Get user profile picture

### Friendship API
- `POST /friendships/send` - Send a friend request
- `POST /friendships/accept` - Accept a friend request
- `POST /friendships/decline` - Decline a friend request
- `DELETE /friendships/delete/:friendId` - Delete a friendship
- `GET /friendships/friends` - List friends
- `GET /friendships/requests` - List pending friend requests

### Chat API
- `GET /chat/rooms` - Get user's chat rooms
- `POST /chat/rooms` - Create or get a direct chat
- `GET /chat/messages` - Get chat messages with pagination
- `POST /chat/messages` - Send a new message
- `PATCH /chat/messages/read` - Mark messages as read
- `PATCH /chat/messages/:messageId` - Edit a message
- `DELETE /chat/messages/:messageId` - Delete a message

## Socket.IO Events

### Client to Server Events
- `join_chats` - Join all user's chat rooms
- `send_message` - Send a real-time message
- `typing_start` - Notify others that user is typing
- `typing_stop` - Notify others that user stopped typing
- `mark_read` - Mark messages as read in real-time
- `join_chat_room` - Join a specific chat room
- `leave_chat_room` - Leave a specific chat room

### Server to Client Events
- `new_message` - Receive new messages
- `message_edited` - Notification for edited messages
- `message_deleted` - Notification for deleted messages
- `user_typing` - Someone started typing
- `user_stop_typing` - Someone stopped typing
- `messages_read` - Messages were read by someone
- `user_status_change` - User online/offline status changed
- `online_count` - Current online users count

## Configuration

Configuration is handled in [`src/config/index.js`](src/config/index.js), which includes:

- Server port configuration
- Environment settings
- MongoDB connection setup
- JWT secret and expiration

### Environment Variables

| Variable       | Description                     | 
|----------------|---------------------------------|
| `PORT`         | Server port                    | 
| `NODE_ENV`     | Environment mode               | 
| `MONGODB_URI`  | MongoDB connection string      | 
| `JWT_SECRET`   | JWT secret key                 |                
| `JWT_EXPIRATION` | JWT token expiration time    |                       

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload (nodemon)

## Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB object modeling
- `socket.io` - Real-time bidirectional communication
- `dotenv` - Environment variable loader
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `multer` - File upload handling
- `express-validator` - Input validation

### Development Dependencies
- `nodemon` - Development server with hot reload
