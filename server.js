// server.js
require('dotenv').config();
const express = require('express');
const cors = require ('cors');
const app = express();
const authRoutes = require('./authentication/auth');
const contactRoute = require('./authentication/contactRouter');
const connectDB = require('./database/connection'); 
const errorMiddleware = require('./middleware/error-middleware')

const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET, POST, PUT, DELETE, HEAD, FETCH",
  credentials: true,
};
app.use(cors (corsOptions));

// Middleware to parse incoming JSON data
app.use(express.json());

app.use(errorMiddleware);
// Establish database connection
connectDB()
  .then(() => {
    // Mount the auth routes at /auth after successful database connection
    app.use('/auth', authRoutes);
    app.use('/form', contactRoute);

    // Start the server after successfully connecting to the database
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => { 
    console.error('Error connecting to the database:', error);
    // Handle the error, e.g., gracefully exit the application
    process.exit(1);
  });
