import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// Signup a new user
export const signup = async (req, res) => {
  const { email, fullName, password, profilePicture, bio } = req.body;

  try {
    if (!email || !fullName || !password) {
      return res.status(400).json({ success: false, message: "Email, full name, and password are required" });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = await User.create({
      email,
      fullName,
      password: hashedPassword,
      profilePicture,
      bio
    });

    const token = generateToken(newUser._id);
    // Remove password from user object before sending response
    const userObj = newUser.toObject();
    delete userObj.password;
    res.json({
      success: true,
      userData: userObj,
      token,
      message: "Account created successfully"
    });
  } catch (error) {
    console.error("Error during signup:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Controller to login a user
export const login = async (req, res) => {
    try {
       const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

    // Find user by email
    const userData = await User.findOne({ email });
    const isPasswordValid = userData && await bcrypt.compare(password, userData.password);
    if (!userData || !isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);
    res.json({
      success: true,
      userData: userData,
      token,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    if (req.user) {
        res.json({ success: true, user: req.user });
    } else {
        res.status(401).json({ success: false, message: "Unauthorized access" });
    }
}

// Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePicture, bio } = req.body;
    const userId = req.user._id;
    // Find the user and update their details
    let updatedUser;

    if (!profilePicture) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullName, bio },
        { new: true }
      );
    } else {
      // Upload the new profile picture to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(profilePicture);

      updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullName, profilePicture: uploadResult.secure_url, bio },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userObj = updatedUser.toObject();
    delete userObj.password;

    res.json({
      success: true,
      userData: userObj,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
