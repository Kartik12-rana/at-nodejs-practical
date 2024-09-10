const mongoose = require('mongoose'); // Import mongoose for MongoDB interactions
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Username: required and must be unique
  email: { type: String, required: true, unique: true },    // Email: required and must be unique
  password: { type: String, required: true }                // Password: required
});

// Pre-save middleware to hash the password before saving it to the database
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or it's a new user)
  if (this.isModified('password')) {
    // Hash the password with a salt factor of 10
    this.password = await bcrypt.hash(this.password, 10);
  }
  next(); // Call next to proceed with the save operation
});

// Method to compare the provided password with the stored hashed password
userSchema.methods.comparePassword = function(candidatePassword) {
  // bcrypt.compare returns a promise that resolves to true if passwords match
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the User model using the userSchema
module.exports = mongoose.model('User', userSchema);
