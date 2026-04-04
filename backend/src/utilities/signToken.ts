import jwt from 'jsonwebtoken';

module.exports = (userId: string) => {
    return jwt.sign(
        { userId: userId}, 
        process.env.SECRET_KEY!,
        { 
            expiresIn: parseInt(process.env.LOGIN_EXPIRES!)
        }
    );
}