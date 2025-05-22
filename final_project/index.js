// Import required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');
const axios = require('axios'); // Ensure Axios is imported

// Import books database
const books = require('./router/booksdb.js');

// Import routes for authentication and general user functions
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

// Debugging: Ensure imported routes are valid
console.log("customer_routes:", customer_routes ? "Loaded" : "Undefined");
console.log("genl_routes:", genl_routes ? "Loaded" : "Undefined");

// Initialize Express app
const app = express();
app.use(express.json());

// Session management for customer authentication
app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: false,
    saveUninitialized: true
}));

// Authentication middleware
const SECRET_KEY = "fingerprint_customer";
app.use("/customer/auth/*", (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized: No access token found" });
    }
    try {
        const token = req.headers.authorization.replace("Bearer ", "");
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (err) {
        return res.status(403).json({ message: "Forbidden: Invalid access token" });
    }
});

// Public routes for book operations
const public_users = express.Router();
public_users.get('/', (req, res) => res.status(200).json(books));

public_users.get('/isbn/:isbn', (req, res) => {
    const book = books[req.params.isbn];
    return book ? res.status(200).json(book) : res.status(404).json({ message: "Book not found" });
});

public_users.get('/author/:author', (req, res) => {
    const author = req.params.author.toLowerCase();
    const filteredBooks = Object.values(books).filter(book => book.author.toLowerCase() === author);
    return filteredBooks.length ? res.status(200).json(filteredBooks) : res.status(404).json({ message: "No books found" });
});

public_users.get('/title/:title', (req, res) => {
    const title = req.params.title.toLowerCase();
    const filteredBooks = Object.values(books).filter(book => book.title.toLowerCase() === title);
    return filteredBooks.length ? res.status(200).json(filteredBooks) : res.status(404).json({ message: "No books found" });
});

// Fetch book details based on Title using async-await
public_users.get('/async/title/:title', async (req, res) => {
    try {
        const { title } = req.params;
        const response = await axios.get(`http://localhost:5000/books/title/${title}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ message: `No books found with title '${title}'`, error: error.message });
    }
});

// Fetch book details based on Title using Promise callbacks
public_users.get('/promise/title/:title', (req, res) => {
    axios.get(`http://localhost:5000/books/title/${req.params.title}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: `No books found with title '${req.params.title}'`, error: error.message }));
});

// Fetch book details using async-await
public_users.get('/async/isbn/:isbn', async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:5000/books/isbn/${req.params.isbn}`);
        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching book details", error });
    }
});

// Fetch book details using Promise callbacks
public_users.get('/promise/isbn/:isbn', (req, res) => {
    axios.get(`http://localhost:5000/books/isbn/${req.params.isbn}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(500).json({ message: "Error fetching book details", error }));
});

// Register routes
app.use("/books", public_users);
if (customer_routes && genl_routes) {
    app.use("/customer", customer_routes);
    app.use("/", genl_routes);
} else {
    console.error("Error: One or more route modules failed to load.");
}

// Start the server **only** on port 5000
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));