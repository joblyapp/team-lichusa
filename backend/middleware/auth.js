const { verifyToken } = require('../helpers/generateToken')

const { createCustomError } = require("../errors/custom-error")
const { ROLE } = require("../helpers/role")

const mustAuthenticate = async (req, res, next) => {
  if (req.user) {
    next()
  } else {
    return next(createCustomError("Unauthorized", 401))
  }
}

const onlyAdmin = (req, res, next) => {
  const { user } = req
  if (!user) {
    return next(createCustomError("No session", 401))
  }
  if (!(user.role === ROLE.ADMIN)) {
    return next(createCustomError("Access not allowed", 403))
  }
  next()
}

const setUser = async (req, res, next) => {
  if (!req.headers.authorization) {
    return next()
  }
  try {
    const token = req.headers.authorization.split(' ').pop()
    const tokenData = await verifyToken(token)
    req.user = tokenData ? tokenData.user : null

    next()
  } catch (e) {
    req.user = null
    console.log("Catch error setUser:", e)
    next()
  }
}

module.exports = {
  setUser,
  onlyAdmin,
  mustAuthenticate
}
