const jwt = require('jsonwebtoken');
const Users = require('../Models/user');

// Dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const requirelogin = async (req, res, next) => {
  try {
    const { authorization = '' } = req.headers;
    const [bearer, token] = authorization?.split(' ');
    if (!authorization || !token) {
      return res.status(401).send('Invalid token')
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    const verifyToken = jwt.verify(token, JWT_SECRET);
    const user = await Users.findOne({ _id: verifyToken.id })
    if (!user) {
      return res.status(404).send('user not found')
    }

    req.user = user;
    next()
  } catch (error) {
    res.status(440).send(error);
  }
}

module.exports = requirelogin;