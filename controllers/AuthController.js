import Sequelize from 'sequelize'
import bcrypt from 'bcrypt'
import {validationResult} from 'express-validator'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

import {Role, User} from '../models/index.js'
import BaseController from './BaseController.js'

import Response from '../helpers/Response.js'

class AuthController extends BaseController {

	async register(req, res) {
		try {
			const newUser = await User.create({
				name: req.body.name,
				username: req.body.username,
				password: await bcrypt.hash(req.body.password, 10),
				roleId: Role.CUSTOMER,
			}, {
				fields: ['name', 'username', 'password', 'roleId']
			})

			const user = await User.findByPk(newUser.id)

			const data = {
				user: user,
				token: AuthController.generateToken(user),
			}

			Response.send(res, 200, "Registrasi berhasil", data)
		}
		catch(error) {
			if (error instanceof Sequelize.ValidationError) {
			    Response.validationError(res, error.errors)
		    }
		    else {
		      	Response.serverError(req, res, error)
		    }
		}
	}

	async login(req, res) {
		try {
			const {username, password} = req.body

			const user = await User.findOne({ 
				where: {username},
				attributes: { include: ['password'] }
			})

			const isPasswordValid = await bcrypt.compare(password, user.password)

			if (!isPasswordValid) {
				Response.send(res, 401, "Kata Sandi salah!", null);
			}
			else{
				const userData = await User.findByPk(user.id)

				const data = {
					user: userData,
					token: AuthController.generateToken(userData),
				}

				Response.send(res, 200, "Login berhasil", data)
			}
		}
		catch(error) {
			if (error instanceof Sequelize.ValidationError) {
			    Response.validationError(res, error.errors)
		    }
		    else {
		      	Response.serverError(req, res, error)
		    }
		}
	
	}

	static generateToken(user) {
		const payload = { 
			id: user.id,
			name: user.name, 
			username: user.username, 
			roleId: user.roleId 
		}

		const data = {
			token: jwt.sign(payload, process.env.JWT_SECRET_KEY, { 
				expiresIn: '1d' 
			}),
			expiresIn: '1 day',
			tokenType: 'Bearer'
		}

		return data
	}

}

export default AuthController


