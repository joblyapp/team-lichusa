const { Schema, model } = require("mongoose")
const { ROLE } = require("../helpers/role")

const UserSchema = new Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: ROLE.USER
  },
  _id: {
    type: String,
    required: true
  }
})

module.exports = model("User", UserSchema)
