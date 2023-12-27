const express = require("express");
const router = express.Router();
const ResUser = require("../database/ResUserSchema");
const bcrypt = require("bcrypt");
const multer = require("multer");
const registerSchema = require("../validators/auth-validator");
const validate = require("../middleware/validate-middleware");
const authMiddleware = require("../middleware/auth-middleware");

require("../database/connection");

// Homepage route
router.get("/", (req, res) => {
  res.send("This is the homepage");
});


// Registration route
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;
    console.log(req.body);
    const existingUser = await ResUser.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or phone number already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new ResUser({
      name,
      phone,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = await newUser.generateToken();
    console.log("Generated token:", token);

    const userId = newUser._id.toString();
    console.log("User ID:", userId);

    res.status(201).json({
      message: "User registered successfully",
      token: token,
      userId: userId,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExist = await ResUser.findOne({ email });

    if (!userExist) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, userExist.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = await userExist.generateToken();
    const userId = userExist._id.toString();

    res.status(200).json({
      message: "Loged in successful",
      token: token,
      userId: userId,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

//sending user data to profile page
router.get("/account", authMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    console.log(userData);
    return res.status(200).json({ data: userData });
  } catch (error) {
    console.log(error);
  }
});



// Updating user profile
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id; 
    const { name, email, phone, address, profilePic } = req.body;

   
    const user = await ResUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userWithSameEmail = await ResUser.findOne({ email: email, _id: { $ne: userId } });
    const userWithSamePhone = await ResUser.findOne({ phone: phone, _id: { $ne: userId } });

    if (userWithSameEmail) {
      return res.status(401).json({ message: "Email already exists" });
    }

    if (userWithSamePhone) {
      return res.status(401).json({ message: "Mobile number already exists" });
    }

    // Update user data
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.profilePic = profilePic || user.profilePic;


    await user.save();

    res.status(200).json({ message: "User profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});


// Setting up multer storage and file upload settings
const storage = multer.memoryStorage(); // Storing images temporarily in memory as Buffers
const upload = multer({ storage: storage });

// Upload route
router.post("/upload", upload.single("profilePic"), authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await ResUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Access the uploaded file from req.file
    const profilePic = req.file;
    // console.log(profilePic)

    if (!profilePic) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Assuming profilePic field is set as { data: Buffer, contentType: String }
    user.profilePic.data = profilePic.buffer;
    user.profilePic.contentType = profilePic.mimetype;

    await user.save();

    res.status(200).json({ message: "Profile picture uploaded successfully", user });
    console.log("profilePic updated" )
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
});

// Fetch profile picture route
router.get("/profilePic", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await ResUser.findById(userId);

    if (!user || !user.profilePic) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    // Send the profile picture data to the frontend
    const { data, contentType } = user.profilePic;
    res.set("Content-Type", contentType); // Set the content type header
    res.status(200).send(data); // Send the image data to the frontend
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Failed to fetch profile picture" });
  }
});




module.exports = router;
