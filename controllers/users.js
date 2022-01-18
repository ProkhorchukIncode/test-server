const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const Users = require("../repository/users");
const { HttpCode } = require("../config/constants.js")

require("dotenv").config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;


const signup = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await Users.findByEmail(email);
  if (user) {
    return res.status(HttpCode.CONFLICT).json({
      status: "error",
      code: HttpCode.CONFLICT,
      message: "Email in use",
    });
  }
  try {
    const newUser = await Users.create({ email, password });
    const emailService = new EmailService(
      process.env.NODE_ENV,
      new CreateSenderSendGrid()
    );
    const statusEmail = await emailService.sendVerifyEmail(
      newUser.email,
      newUser.name,
      newUser.verificationToken
    );
    return res.status(HttpCode.CREATED).json({
      status: "success",
      code: HttpCode.CREATED,
      user: {
        email: newUser.email,
        password: newUser.password,
        avatar: newUser.avatarURL,
        successEmail: statusEmail,
      },
    });
  } catch (error) {
    next(console.log(error.message));
  }
};

const login = async (req, res, _next) => {
  const { email, password } = req.body;
  const user = await Users.findByEmail(email);
  const isValidPassword = await user.isValidPassword(password);
  if (!user || !isValidPassword || !user?.isVerified) {
    return res.status(HttpCode.UNAUTHORIZED).json({
      status: "error",
      code: HttpCode.UNAUTHORIZED,
      message: "Email or password is wrong",
    });
  }
  const id = user._id;
  const payload = { id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
  await Users.updateToken(id, token);
  return res.status(HttpCode.OK).json({
    status: "success",
    code: HttpCode.OK,
    date: {
      token,
      user: {
        email: email,
        subscription: "starter",
      },
    },
  });
};

const logout = async (req, res, _next) => {
  const id = req.user._id;
  await Users.updateToken(id, null);
  return res.status(HttpCode.NO_CONTENT).json({ Status: "204 No Content" });
};

const uploadAvatar = async (req, res, _next) => {
  const { id, idUserCloud } = req.user;
  const file = req.file;
  console.log(req);

  const destination = "Avatars";
  const uploadService = new UploadService(destination);
  const { avatarUrl, returnIdUserCloud } = await uploadService.save(
    file.path,
    idUserCloud
  );

  await Users.updateAvatar(id, avatarUrl, returnIdUserCloud);
  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.log(error.message);
  }
  return res.status(HttpCode.OK).json({
    status: "success",
    code: HttpCode.OK,
    data: {
      avatarURL: avatarUrl,
    },
  });
};

const verifyUser = async (req, res, _next) => {
  const user = await Users.findUserByVerifyToken(req.params.verificationToken);
  if (user) {
    await Users.updateTokenVerify(user._id, true, null);
    return res.status(HttpCode.OK).json({
      status: "success",
      code: HttpCode.OK,
      data: {
        message: "Verification successful",
      },
    });
  }
  return res.status(HttpCode.NOT_FOUND).json({
    status: "error",
    code: HttpCode.NOT_FOUND,
    message: "User not found",
  });
};

const repeatEmailForVerifyUser = async (req, res, _next) => {
  const { email } = req.body;
  const user = await Users.findByEmail(email);
  if (user) {
    const { email, name, VerificationToken } = user;
    const emailService = new EmailService(
      process.env.NODE_ENV,
      new CreateSenderSendGrid()
    );
    const statusEmail = await emailService.sendVerifyEmail(
      email,
      name,
      VerificationToken
    );
    return res.status(HttpCode.OK).json({
      status: "success",
      code: HttpCode.OK,
      data: {
        message: "Verification email sent",
      },
    });
  }
  return res.status(HttpCode.BAD_REQUEST).json({
    status: "Bad Request",
    code: HttpCode.BAD_REQUEST,
    data: {
      message: "Verification has already been passed",
    },
  });
};

module.exports = {
  current,
  signup,
  login,
  logout,
  uploadAvatar,
  verifyUser,
  repeatEmailForVerifyUser,
};