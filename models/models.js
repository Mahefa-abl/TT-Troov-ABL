const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const UserSchema = Schema(
	{
		name: { type: String, required: false },
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		object: [{ type: Schema.Types.ObjectId, ref: 'Object' }]
	},
	{ collection: 'users' }
)

const ObjectSchema = new mongoose.Schema(
	{
		place: { type: String },
		date: { type: Date, default: Date.now() },
		name: { type: String, required: true },
		description: { type: String, required: false },
		user: { type: Schema.Types.ObjectId, ref: 'User' }
	},
	{ collection: 'objects' }
)

const User = mongoose.model('User', UserSchema)
const Object = mongoose.model('Object', ObjectSchema)

module.exports = {
	User,
	Object
}
