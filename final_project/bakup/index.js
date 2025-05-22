// Import required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');

// Import routes for authentication and general user functions
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

// Import books database
const books = require('./router/booksdb.js');

// Initialize Express app
const app = express();

// Enable JSON parsing for incoming requests
app.use(express.json());

// Set up session management for customer routes
app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: false,
    saveUninitialized: true // Ensures session data is stored properly
}));

// Authentication middleware for protected routes
const SECRET_KEY = "fingerprint_customer";

app.use("/customer/auth/*", (req, res, next) => {
    console.log("Authenticating request...");

    if (!req.headers.authorization) {
        console.log("Access token missing");
        return res.status(401).json({ message: "Unauthorized: No access token found" });
    }

    try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Store the decoded user data
        console.log("User authenticated:", decoded);
        next();
    } catch (err) {
        console.log("Invalid access token:", err);
        return res.status(403).json({ message: "Forbidden: Invalid access token" });
    }
});

// Create a public route for book-related operations
const public_users = express.Router();

// Retrieve all books from the database
public_users.get('/', (req, res) => {
    console.log("Fetching all books...");
    return res.status(200).json(books);
});

// Retrieve book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const { isbn } = req.params;
    console.log(`Fetching book details for ISBN: ${isbn}`);

    const book = books[isbn];
    return book
        ? res.status(200).json(book)
        : res.status(404).json({ message: `Book not found with ISBN: ${isbn}` });
});

// Retrieve book details based on author
public_users.get('/author/:author', (req, res) => {
    const author = req.params.author.toLowerCase();
    console.log(`Searching for books by author: ${author}`);

    const filteredBooks = Object.values(books).filter(book => book.author.toLowerCase() === author);
    return filteredBooks.length > 0
        ? res.status(200).json(filteredBooks)
        : res.status(404).json({ message: `No books found for author: ${author}` });
});

// Retrieve book details based on title
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title.toLowerCase();
    console.log(`Searching for book with title: ${title}`);

    const filteredBooks = Object.values(books).filter(book => book.title.toLowerCase() === title);
    return filteredBooks.length > 0
        ? res.status(200).json(filteredBooks)
        : res.status(404).json({ message: `No books found with title: ${title}` });
});

// Retrieve book reviews based on ISBN
public_users.get('/review/:isbn', (req, res) => {
    const { isbn } = req.params;
    console.log(`Fetching reviews for ISBN: ${isbn}`);

    const book = books[isbn];
    return book && Object.keys(book.reviews).length > 0
        ? res.status(200).json(book.reviews)
        : res.status(404).json({ message: `No reviews found for ISBN: ${isbn}` });
});

// Sample user database (Using JSON storage for persistence)
const USERS_FILE = './users.json';
let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) : {};

const saveUsers = () => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// Register a new user
app.post('/customer/register', (req, res) => {
    const { username, password } = req.body;
    console.log(`Registration attempt: Username=${username}`);

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required!" });
    }

    if (users[username]) {
        return res.status(409).json({ message: `Username '${username}' is already taken.` });
    }

    users[username] = { password };
    saveUsers();
    console.log(`User registered successfully: ${username}`);

    return res.status(201).json({ message: "User registered successfully!", username });
});

// Customer login
app.post("/customer/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: Username=${username}`);

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required!" });
    }

    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ message: "Invalid username or password!" });
    }

    const accessToken = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });

    console.log(`User '${username}' logged in successfully.`);
    return res.status(200).json({ message: "Login successful!", accessToken });
});

// Register public routes under `/books`
app.use("/books", public_users);

// Set the server port
const PORT = 5000;

// Register customer and general routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Start the server
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));