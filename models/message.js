const mongoose = require("mongoose")

const Schema = mongoose.Schema

const MessageSchema = new Schema({
    timestamp: { type: Date, required: true, default: new Date().toISOString() },
    sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    payload: { type: String },
    recipient: [ { type: Schema.Types.ObjectId, ref: "User" } ],
    attachments: [ { type: Schema.Types.ObjectId, ref: "Attachment" } ]
})

MessageSchema.virtual("url").get(function () {
    return `/messages/${this._id}`
})

module.exports = mongoose.model("Message", MessageSchema)