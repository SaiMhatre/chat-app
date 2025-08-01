import mongoose from "mongoose";

// Function to connect to MongoDB
export const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log("MongoDB connection established");
    });
    // Connect to MongoDB using the URI from environment variables
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}