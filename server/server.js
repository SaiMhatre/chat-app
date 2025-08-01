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

// Store online users
export const userSocketMap = {};

// Initialize Socket.IO server
export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

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

// Manual CORS handling - this should work
app.use((req, res, next) => {
    console.log('Request received:', req.method, req.url, 'Origin:', req.headers.origin);
    
    const origin = req.headers.origin;
    
    // Allow all vercel.app domains and localhost
    if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // For requests without origin (like Postman, mobile apps)
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('Preflight request handled for:', req.url);
        return res.status(200).end();
    }
    
    next();
});

// Body parsing middleware
app.use(express.json({limit: '4mb'}));

// Test route to verify CORS is working
app.get('/api/test-cors', (req, res) => {
    console.log('Test CORS route hit');
    res.json({ 
        message: 'CORS is working!', 
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

app.use("/api/status", (req, res) => {
    console.log('Status route hit');
    res.send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.url);
    res.status(404).json({ error: 'Route not found' });
});

//connect to MongoDB
await connectDB();

if(process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

console.log('Server setup complete');

//Export the server for vercel
export default server;