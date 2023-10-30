const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    anom: { type: String, required: true, unique: true  },
    email: { type: String, required: true, unique: true  },
    forename: { type: String },
    surname:  { type: String },
    password:  { type: String, required: true },
    avatar: { type: String },
    active: { type: Boolean, default: true }
})

UserSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/users/${this._id}`;
});

module.exports = mongoose.model("User", UserSchema)