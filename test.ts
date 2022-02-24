import jwt from "jsonwebtoken";
import path from "path";
require("dotenv").config({ path: path.join(__dirname, ".env") });

const email = "test@email.com";
console.log(process.env.JWT_ACCESS_SECRET);
console.log(process.env.JWT_RESET_SECRET);
const token = jwt.sign(
    { email },
    process.env.JWT_RESET_SECRET as string,
    {
      expiresIn: process.env.JWT_RESET_EXPIRE_TIME,
    }
  );
const payload = jwt.verify(token, process.env.JWT_RESET_SECRET as string);

console.log(payload);