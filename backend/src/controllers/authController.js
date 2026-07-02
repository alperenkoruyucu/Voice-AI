const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try{
        const { email, password } = req.body;

        if ( email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({error: "Geçersiz email veya şifre"});
        }

        const token = jwt.sign(
            {role: "admin", email: email},
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
        );

        res.status(200).json({
            message: "Giriş başarılı, sisteme hoş geldiniz.",
            token: token
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { login };