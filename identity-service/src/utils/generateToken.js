const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: expiresAt,
  });

  return {accessToken , refreshToken}
};

module.exports = generateToken;
