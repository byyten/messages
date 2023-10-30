const mongoose = require("mongoose")

const Schema = mongoose.Schema

const AttachmentSchema = new Schema({
    payload: { type: String, required: true },
    filename: { type: String, required: false },
    type: { type: String, required: false },
    size: { type: String, required: false },
    message: { type: Schema.Types.ObjectId, required: true, ref: "Message" }
})

AttachmentSchema.virtual("url").get(function () {
    return `/attachments/${this._id}`
})

module.exports = mongoose.model("Attachment", AttachmentSchema)