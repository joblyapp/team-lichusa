const express = require("express")
const {
  indexAuth,
  login,
  signup,
  logout
} = require("../controllers/auth")
const { mustAuthenticate } = require("../middleware/auth")

const router = express.Router()

router.get("/me", mustAuthenticate, indexAuth)
router.post("/login", login)
router.post("/signup", signup)
router.post("/logout", logout)

module.exports = router
