const express = require('express');
const { check, validationResult } = require('express-validator'); // Import express-validator for input validation
const router = express.Router();
const User = require('../Models/User'); // Import the User model

// Registration route (GET) - Display the registration form
router.get('/', (req, res) => {
  res.render('register', { error: null }); // Render the registration form with no error initially
});

// Registration route (POST) - Handle user registration
router.post(
  '/register',
  [
    // Validation rules
    check('username', 'Username is required').not().isEmpty(), // Username cannot be empty
    check('email', 'Please include a valid email').isEmail(),  // Must be a valid email
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }), // Password must be at least 6 characters
    check('confirmPassword', 'Confirm password field must match password').custom(
      (value, { req }) => value === req.body.password // Password confirmation must match password
    )
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req); // Collect any validation errors
    if (!errors.isEmpty()) {
      // If errors exist, render the form with the first error
      return res.render('register', { error: errors.array()[0].msg });
    }

    // Extract validated data
    const { username, email, password } = req.body;

    try {
      // Create a new user instance
      const user = new User({ username, email, password });
      // Save the user to the database
      await user.save();
      // Redirect to login page after successful registration
      res.redirect('/login');
    } catch (error) {
      // If an error occurs (e.g., user already exists), render the form with an error message
      res.render('register', { error: 'User registration failed' });
    }
  }
);

// Login route (GET) - Display the login form
router.get('/login', (req, res) => {
  res.render('login', { error: null }); // Render the login form with no error initially
});

// Login route (POST) - Handle user login
router.post(
  '/login',
  [
    // Validation rules
    check('email', 'Please include a valid email').isEmail(), // Must be a valid email
    check('password', 'Password is required').not().isEmpty() // Password cannot be empty
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req); // Collect any validation errors
    if (!errors.isEmpty()) {
      // If errors exist, render the form with the first error
      return res.render('login', { error: errors.array()[0].msg });
    }

    // Extract login data
    const { email, password } = req.body;

    try {
      // Find the user by email
      const user = await User.findOne({ email });
      // Check if user exists and if the provided password matches the stored password
      if (!user || !(await user.comparePassword(password))) {
        // If user does not exist or password is incorrect, render the form with an error message
        return res.render('login', { error: 'Invalid credentials' });
      }
      // If successful, store user ID in session and redirect to dashboard
      req.session.userId = user._id;
      res.redirect('/dashboard');
    } catch (error) {
      // If an error occurs, render the form with a generic error message
      res.render('login', { error: 'Login failed' });
    }
  }
);

// Dashboard route (GET) - Display the dashboard if the user is authenticated
router.get('/dashboard', async (req, res) => {
  // Check if user is logged in (session contains userId)
  if (!req.session.userId) {
    // If not logged in, redirect to login page
    return res.redirect('/login');
  }
  try {
    // Find the logged-in user by ID
    const user = await User.findById(req.session.userId);
    // Render the dashboard with user data
    res.render('dashboard', { user, error: null });
  } catch (error) {
    // If an error occurs, redirect to login
    res.redirect('/login');
  }
});

// Change password route (POST) - Handle password change
router.post(
  '/change-password',
  [
    // Validation rules
    check('oldPassword', 'Old password is required').not().isEmpty(), // Old password must be provided
    check('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 }) // New password must be at least 6 characters
  ],
  async (req, res) => {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.redirect('/login');
    }

    // Extract password data
    const { oldPassword, newPassword } = req.body;

    // Handle validation errors
    const errors = validationResult(req); // Collect validation errors
    if (!errors.isEmpty()) {
      // If errors exist, render the dashboard with the first error
      const user = await User.findById(req.session.userId);
      return res.render('dashboard', { user, error: errors.array()[0].msg });
    }

    try {
      // Find the logged-in user by ID
      const user = await User.findById(req.session.userId);
      // Check if the old password is correct
      if (!(await user.comparePassword(oldPassword))) {
        // If old password is incorrect, render the dashboard with an error message
        return res.render('dashboard', { user, error: 'Old password is incorrect' });
      }
      // Set the new password and save the user
      user.password = newPassword;
      await user.save();
      // Redirect to dashboard after successful password change
      res.redirect('/dashboard');
    } catch (error) {
      // If an error occurs, render the dashboard with an error message
      res.render('dashboard', { user, error: 'Failed to change password' });
    }
  }
);

// Logout route (GET) - Handle user logout
router.get('/logout', (req, res) => {
  // Destroy the session and redirect to login
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router; // Export the router so it can be used in other parts of the app
