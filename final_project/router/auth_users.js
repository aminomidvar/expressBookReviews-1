const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

const regd_users = express.Router();
let users = [];

// Function to check if the username is valid
const isValid = (username) => users.some(user => user.username === username);

// Function to check if the username and password match
const authenticatedUser = (username, password) => users.some(user => user.username === username && user.password === password);

// Login route (for registered users)
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required!" });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid username or password!" });
    }

    const accessToken = jwt.sign({ username }, "fingerprint_customer", { expiresIn: "1h" });
    return res.status(200).json({ message: "Login successful!", accessToken });
});

// Adding or modifying a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const { review } = req.body;

    if (!review) {
        return res.status(400).json({ message: "Review text is required!" });
    }

    try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, "fingerprint_customer");
        const username = decoded.username;

        if (!books[isbn]) {
            return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
        }

        if (!books[isbn].reviews) {
            books[isbn].reviews = {};
        }

        books[isbn].reviews[username] = review;
        return res.status(200).json({ message: "Review added/updated successfully!", reviews: books[isbn].reviews });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token. Please log in again." });
    }
});

// Delete a review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;

    try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, "fingerprint_customer");
        const username = decoded.username;

        if (!books[isbn]) {
            return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
        }

        if (!books[isbn].reviews || !books[isbn].reviews[username]) {
            return res.status(404).json({ message: "No review found for this book by the logged-in user." });
        }

        delete books[isbn].reviews[username];
        return res.status(200).json({ message: "Review deleted successfully!", reviews: books[isbn].reviews });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token. Please log in again." });
    }
});

module.exports.authenticated = regd_users;