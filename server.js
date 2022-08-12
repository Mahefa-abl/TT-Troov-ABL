const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const models = require('./models/models');
const moment = require('moment');

const User = models.User;
const Object = models.Object;

const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk'

mongoose.connect('mongodb://localhost:27017/login-app-db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true
})

const app = express()
// app.use('/', express.pages(path.join(__dirname, 'pages')))
app.use(bodyParser.json())

app.set('view engine', 'ejs')
app.use(express.static("public"));

app.get('/register', (req, res) => {
	res.render('pages/register')
})

app.get('/', (req, res) => {
	res.render('pages/login')
})

app.get('/reset', (req, res) => {
	res.render('pages/change-password')
})

app.get('/object/list', (req, res) => {
	const query = Object.find({});
	query.populate('user');
	query.exec(function (err, objects) {
		if (err) {
			return res.json({ status: 'error', error: err })
		}
		res.render('pages/list', {
			'objects': objects,
			'moment': moment
		})
	})
})

app.get('/object/new', (req, res) => {
	res.render('pages/object_form')
})

app.post('/api/change-password', async (req, res) => {
	const { token, newpassword: plainTextPassword } = req.body

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	try {
		const user = jwt.verify(token, JWT_SECRET)

		const _id = user.id

		const password = await bcrypt.hash(plainTextPassword, 10)

		await User.updateOne(
			{ _id },
			{
				$set: { password }
			}
		)
		res.json({ status: 'ok' })
	} catch (error) {
		res.json({ status: 'error', error: error })
	}
})

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).lean()

	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the username, password combination is successful

		const token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)

		return res.json({ status: 'ok', data: token })
	}

	res.json({ status: 'error', error: 'Invalid username/password' })
})

app.post('/api/register', async (req, res) => {

	const { username, password: plainTextPassword, name, confirmPassword } = req.body

	if (!username || typeof username !== 'string') {
		return res.json({
			status: 'error',
			error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string' || plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	if (confirmPassword !== plainTextPassword) {
		return res.json({
			status: 'error',
			error: 'the two passwords do not match' })
	}

	const password = await bcrypt.hash(plainTextPassword, 10)

	try {
		await User.create({username, password, name})
	} catch (error) {
		if (error.code === 11000) {
			return res.json({
				status: 'error',
				error: 'Username already in use' })
		}
		throw error
	}

	return res.json({ status: 'ok' })
})

app.post('/api/object/new', async (req, res) => {

	const { name, place, date, description, username } = req.body

	if (!name || typeof name !== 'string') {
		return res.json({
			status: 'error',
			error: 'Invalid name' })
	}

	try {
		const user = await User.findOne({ username }).lean()

		if (!user) {
			return res.json({ status: 'error', error: 'No User' })
		}

		const object = new Object({ name, place, date, description, user: user._id })

		object.save(function (err) {
			if (err) return res.json({ status: 'error', error: err });
		})

		return res.json({ status: 'ok', data: object });

		// await Object.create({ name, place, date, description })
	} catch (error) {
		return res.json({ status: 'error', error: error })
	}
})

app.listen(9999, () => {
	console.log('Server up at 9999')
})
