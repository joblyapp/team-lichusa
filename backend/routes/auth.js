const express = require("express")
const {
  indexAuth,
  login,
  signup,
  logout
} = require("../controllers/auth")

const router = express.Router()

router.get("/me", indexAuth)
router.post("/login", login)
router.post("/signup", signup)
router.post("/logout", logout)

module.exports = router
