import User from "../models/User.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";   
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const users = await User.find({ _id: { $ne: userId } }).select("-password");

        // Count number of messages not seen
        const unseenMessages = {}
        const promises = users.map(async (user) => {
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false});
            if(messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        });
        await Promise.all(promises);
        res.json({ success: true, users, unseenMessages });
    } catch (error) {
        console.error("Error fetching users for sidebar:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const selectedUserId = req.params.id;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: userId }
            ]
        });

        await Message.updateMany({senderId: selectedUserId, receiverId: userId, seen: false}, {seen: true});

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Error fetching messages for user:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// api to mark messages as seen using message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findByIdAndUpdate(messageId, { seen: true });


        res.json({ success: true, message: "Message marked as seen" });
    } catch (error) {
        console.error("Error marking message as seen:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

//Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body.message;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            seen: false
        });

        
        // Emit the new message to the receiver's socket
        if(userSocketMap[receiverId]) {
            console.log("New message created:", receiverId, userSocketMap[receiverId]);
            io.to(userSocketMap[receiverId]).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
