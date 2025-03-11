import jwt from "jsonwebtoken";
const createToken = (id) => {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: "3d",
        });
};

export default createToken;