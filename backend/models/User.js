const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AddressSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const PreferencesSchema = new mongoose.Schema({
  newsletter: { type: Boolean, default: true },
  darkMode: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String, sparse: true },
    avatar: { type: String, default: "" },
    addresses: [AddressSchema],
    preferences: PreferencesSchema,
    lastUsernameChangeAt: { type: Date },
    resetToken: { type: String },
    tokenExpiry: { type: Date },

    role: { type: String, default: "customer" }
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  // Skip password hashing for OAuth users without a password
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Generate username from email if not provided (for OAuth users)
  if (this.isNew && !this.username && this.email) {
    const baseUsername = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Ensure username is unique
    while (await this.constructor.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    this.username = username;
  }
  
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema, "users");
