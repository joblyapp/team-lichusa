const app = require("express")()

// Middleware
const cors = require("cors")
const bodyParser = require("body-parser")
const errorHandlerMiddleware = require("./middleware/error-handler")
const { setUser, mustAuthenticate, onlyAdmin } = require("./middleware/auth")

// Routes
const auth = require("./routes/auth")

// MongoDB
const connectDB = require("./db/connect")

// Make sure .env data is loaded
if (!process.env.JWT_SECRET) {
  let envErr = require("dotenv").config().error
  if (envErr) {
    throw envErr
  }
}
const env = process.env

// Middleware to read JSON and form data from request body,
// so that they are available in req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}))
const sessKey = env.JWT_SECRET
if (!sessKey) {
  throw "Must provide JWT secret key"
}

app.use(setUser)

// Routes
app.use("/auth", auth)

app.get('/dashboard', mustAuthenticate, (req, res) => {
  res.send('Dashboard Page')
})
app.get('/admin', mustAuthenticate, onlyAdmin, (req, res) => {
  res.send('Admin Page')
})

app.use((_, res) => res.status(404).send("Route does not exist"))
app.use(errorHandlerMiddleware)

const PORT = env.PORT || 8080

const start = async () => {
  try {
    await connectDB(env.MONGO_URI)
    app.listen(PORT, () => console.log(`listening on port ${PORT}`))
  } catch (err) {
    console.log(err)
  }
}

start()
