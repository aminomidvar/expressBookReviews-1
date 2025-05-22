const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let { isValid, users } = require("./auth_users.js"); // Use object destructuring

const public_users = express.Router();

// Register a new user (to be implemented later)
public_users.post("/register", (req, res) => res.status(501).json({ message: "Not yet implemented" }));

// Get the book list using async-await
public_users.get('/async', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5000/books');
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching books", error: error.message });
    }
});

// Get the book list using Promise callbacks
public_users.get('/promise', (req, res) => {
    axios.get('http://localhost:5000/books')
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(500).json({ message: "Error fetching books", error: error.message }));
});

// Get book details based on ISBN using async-await
public_users.get('/async/isbn/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        const response = await axios.get(`http://localhost:5000/books/isbn/${isbn}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ message: `Book with ISBN '${isbn}' not found`, error: error.message });
    }
});

// Get book details based on ISBN using Promise callbacks
public_users.get('/promise/isbn/:isbn', (req, res) => {
    axios.get(`http://localhost:5000/books/isbn/${req.params.isbn}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: `Book with ISBN '${req.params.isbn}' not found`, error: error.message }));
});

// Get book details based on author using async-await
public_users.get('/async/author/:author', async (req, res) => {
    try {
        const { author } = req.params;
        const response = await axios.get(`http://localhost:5000/books/author/${author}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ message: `No books found for author '${author}'`, error: error.message });
    }
});

// Get book details based on author using Promise callbacks
public_users.get('/promise/author/:author', (req, res) => {
    axios.get(`http://localhost:5000/books/author/${req.params.author}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: `No books found for author '${req.params.author}'`, error: error.message }));
});

// Get book details based on title using async-await
public_users.get('/async/title/:title', async (req, res) => {
    try {
        const { title } = req.params;
        const response = await axios.get(`http://localhost:5000/books/title/${title}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ message: `No books found with title '${title}'`, error: error.message });
    }
});

// Get book details based on title using Promise callbacks
public_users.get('/promise/title/:title', (req, res) => {
    axios.get(`http://localhost:5000/books/title/${req.params.title}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: `No books found with title '${req.params.title}'`, error: error.message }));
});

// Get book reviews based on ISBN using async-await
public_users.get('/async/review/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        const response = await axios.get(`http://localhost:5000/books/review/${isbn}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ message: `No reviews found for book with ISBN '${isbn}'`, error: error.message });
    }
});

// Get book reviews based on ISBN using Promise callbacks
public_users.get('/promise/review/:isbn', (req, res) => {
    axios.get(`http://localhost:5000/books/review/${req.params.isbn}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: `No reviews found for book with ISBN '${req.params.isbn}'`, error: error.message }));
});

module.exports.general = public_users;