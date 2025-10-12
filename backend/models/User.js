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
    suspendedUntil: { type: Date },

    role: { type: String, default: "customer" }
  },
  { timestamps: true }
);

userSchema.pre("save", async function(next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);
