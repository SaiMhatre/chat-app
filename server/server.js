import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

//create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// CORS configuration - Allow all Vercel deployments for now
const corsOptions = {
    origin: (origin, callback) => {
        console.log('CORS Origin:', origin); // Debug log
        
        // Always allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            console.log('No origin, allowing request');
            return callback(null, true);
        }
        
        // Allow all vercel.app domains
        if (origin.includes('vercel.app')) {
            console.log('Vercel domain detected, allowing:', origin);
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (origin.includes('localhost')) {
            console.log('Localhost detected, allowing:', origin);
            return callback(null, true);
        }
        
        console.log('Origin not allowed:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'x-requested-with',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Origin',
        'Accept',
        'X-Requested-With',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Access-Control-Allow-Origin'],
    optionsSuccessStatus: 200,
    preflightContinue: false
};

// Initialize Socket.IO server with proper CORS
export const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            console.log('Socket.IO CORS Origin:', origin);
            
            if (!origin) return callback(null, true);
            
            if (origin.includes('vercel.app') || origin.includes('localhost')) {
                return callback(null, true);
            }
            
            return callback(null, false);
        },
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["*"]
    }
});

// Store online users
export const userSocketMap = {};

// Socket.IO connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Middleware setup - ORDER MATTERS!
// Apply CORS first, before any other middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} from origin: ${req.headers.origin}`);
    next();
});

app.use(cors(corsOptions)); 
app.use(express.json({limit: '4mb'}));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
    console.log('Preflight request for:', req.path, 'from:', req.headers.origin);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//connect to MongoDB
await connectDB();

if(process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

//Export the server for vercel
export default server;