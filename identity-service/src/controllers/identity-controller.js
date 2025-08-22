const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegistration } = require("../utils/validation");

// user registration

const registerUser = async (req, res) => {
  logger.info("User registration attempt", { body: req.body });

  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", { message: error.details[0].message });
      return res.status(400).json({
        success: false,
        status: "error",
        message: error.details[0].message,
      });
    }

    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        status: "error",
        message: "Username or email already exists",
      });
    }

    user = new User({ username, email, password });
    await user.save();

    logger.info("User registered successfully", { userId: user._id });
    const { accessToken, refreshToken } = await generateToken(user);

    return res.status(201).json({
      success: true,
      status: "success",
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      status: "error",
      message: "Internal Server Error",
    });
  }
};

// user login

// refresh token

// logout



module.exports = {
  registerUser, 
};