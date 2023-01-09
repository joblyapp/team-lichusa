const jwt = require('jsonwebtoken')

const tokenSign = async (user) => {
  return jwt.sign(
    {
      user
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
}

const verifyToken = async (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (e) {
    return null
  }
}

const decodeSign = (token) => { //TODO: Verificar que el token sea valido y correcto
  return jwt.decode(token, null)
}

module.exports = { tokenSign, decodeSign, verifyToken }