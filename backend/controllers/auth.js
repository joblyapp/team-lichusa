const bcrypt = require("bcryptjs")
const { nanoid } = require("nanoid")
const asyncWrapper = require("../middleware/async")
const { createCustomError } = require("../errors/custom-error")
const User = require("../models/User")
const { tokenSign } = require("../helpers/generateToken")

const saltRounds = 10

const indexAuth = (req, res) => {
  // Check whether the user is logged in
  const { user } = req
  const data = {
    session: user ? {...user} : null
  }
  return res.json(data)
}

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(createCustomError("Invalid credentials", 400))
  }
  // Get user credentials from mongo
  const user = await User.findOne({email})
  if (!user) {
    return next(createCustomError("User unregistered", 401))
  }
  // Compare hash and password
  bcrypt.compare(password, user.password).then(async equal => {
    if (!equal) return next(createCustomError("Invalid credentials", 401))
    // Sign user in JWT
    const userSession = {
      fullname: user.fullname,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      id: user._id
    }
    const tokenSession = await tokenSign(userSession)

    const data = {
      jwt: tokenSession
    }

    res.status(200).json(data)
  })
})

const signup = asyncWrapper(async (req, res, next) => {
  const { fullname, email, password } = req.body
  if (!fullname || !password || !email) {
    return next(createCustomError("Invalid credentials", 400))
  }
  // Check whether the email already exists
  let user = await User.findOne({email})
  if (user) {
    return next(createCustomError(`Email ${email} already taken`, 409))
  }

  const hash = await bcrypt.hash(password, saltRounds)
  const userID = nanoid()
  user = await User.create({
    email,
    fullname,
    password: hash,
    avatar: "avatar.jpg",
    _id: userID
  })

  // Save user in session
  const userSession = {
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    id: user._id
  }
  const tokenSession = await tokenSign(userSession)

  const data = {
    jwt: tokenSession
  }
  res.status(201).json(data)
})

const logout = asyncWrapper(async (req, res) => {
  res.status(200).end()
})

module.exports = {
  indexAuth,
  login,
  signup,
  logout
}