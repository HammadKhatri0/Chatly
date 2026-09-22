import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true, maxlength: 80 },
    avatar: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    /** Sorted "idA:idB" key; unique for direct chats so a pair never gets duplicates. */
    pairKey: { type: String, default: null },
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1, lastMessageAt: -1 });
conversationSchema.index(
  { pairKey: 1 },
  { unique: true, partialFilterExpression: { pairKey: { $type: 'string' } } }
);

conversationSchema.statics.buildPairKey = (a, b) => [String(a), String(b)].sort().join(':');

export default mongoose.model('Conversation', conversationSchema);
