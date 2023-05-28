import Sequelize from 'sequelize'
import {validationResult} from 'express-validator'

import {Category} from '../models/index.js'
import BaseController from './BaseController.js'

class CategoryController extends BaseController {
	
	async getAllCategories(req, res) {
		try {
			let Categories = await Category.findAll()

			super.sendResponse(res, 200, "Data Category berhasil ditampilkan", Categories)
		} 
		catch(error) {
			super.handleServerError(req, res, error)
		}
	}

	async getCategoryById(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.sendErrorValidationResponse(res, errors.array())
		}
		else {
			try {
				const id = req.params.id

				let category = await Category.findByPk(id)

				super.sendResponse(res, 200, "Data Category berhasil ditampilkan", category)
			}
			catch(error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.sendErrorValidationResponse(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}

	async createCategory(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.sendErrorValidationResponse(res, errors.array())
		}
		else{
			try {
				const category = await Category.create({
					name: req.body.name,
				}, {
					fields: ['name']
				})

				super.sendResponse(res, 200, "Data Category berhasil disimpan", category)
			}
			catch (error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.sendErrorValidationResponse(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}

	async updateCategory(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.sendErrorValidationResponse(res, errors.array())
		}
		else{
			try {
				const id = req.params.id

				await Category.update({
					name: req.body.name
				}, {
					where: {
						id: id
					}
				})

				const updatedCategory = await Category.findByPk(id)

				super.sendResponse(res, 200, "Data Category berhasil diubah", updatedCategory)
			}
			catch (error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.sendErrorValidationResponse(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}

	async changeStatusCategory(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.sendErrorValidationResponse(res, errors.array())
		}
		else{
			try {
				const id = req.params.id
				const category = await Category.findByPk(id)
				const newStatus = !category.isActive

				await Category.update({
					isActive: newStatus,
				}, {
					where: {
						id: id
					}
				})

				const updatedCategory = await Category.findByPk(id)

				super.sendResponse(res, 200, "Status Category berhasil diubah", updatedCategory)
			}
			catch (error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.sendErrorValidationResponse(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}
}

export default CategoryController