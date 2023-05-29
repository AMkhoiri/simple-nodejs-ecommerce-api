import {Sequelize, Op} from 'sequelize'
import {validationResult} from 'express-validator'

import {Brand} from '../models/index.js'
import BaseController from './BaseController.js'

class BrandController extends BaseController {
	
	async getAllBrands(req, res) {
		try {
			const {page, perPage, search} = req.query

			let whereCondition = {}

			if (search) {
				whereCondition['name'] = {
		          	[Op.iLike]: `%${search}%`
		        }
			}

			const limit = perPage ? perPage : 10
			const offset = page ? (page - 1) * limit : 0

			let brands = await Brand.findAll({
				where: whereCondition,
  				limit,
  				offset
			})

			super.sendResponse(res, 200, "Data Brand berhasil ditampilkan", brands)
		} 
		catch(error) {
			super.handleServerError(req, res, error)
		}
	}

	async getBrandById(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.handleValidationError(res, errors.array())
		}
		else {
			try {
				const id = req.params.id

				let brand = await Brand.findByPk(id)

				super.sendResponse(res, 200, "Data Brand berhasil ditampilkan", brand)
			}
			catch(error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.handleValidationError(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}

	async createBrand(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.handleValidationError(res, errors.array())
		}
		else{
			try {
				const brand = await Brand.create({
					name: req.body.name,
				}, {
					fields: ['name']
				})

				super.sendResponse(res, 200, "Data Brand berhasil disimpan", brand)
			}
			catch (error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.handleValidationError(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}

	async updateBrand(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.handleValidationError(res, errors.array())
		}
		else{
			try {
				const id = req.params.id

				await Brand.update({
					name: req.body.name
				}, {
					where: {
						id: id
					}
				})

				const updatedBrand = await Brand.findByPk(id)

				super.sendResponse(res, 200, "Data Brand berhasil diubah", updatedBrand)
			}
			catch (error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.handleValidationError(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}

	async changeStatusBrand(req, res) {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			super.handleValidationError(res, errors.array())
		}
		else{
			try {
				const id = req.params.id
				const brand = await Brand.findByPk(id)
				const newStatus = !brand.isActive

				await Brand.update({
					isActive: newStatus,
				}, {
					where: {
						id: id
					}
				})

				const updatedBrand = await Brand.findByPk(id)

				super.sendResponse(res, 200, "Status Brand berhasil diubah", updatedBrand)
			}
			catch (error) {
				if (error instanceof Sequelize.ValidationError) {
				    super.handleValidationError(res, error.errors)
			    }
			    else {
			      	super.handleServerError(req, res, error)
			    }
			}
		}
	}
}

export default BrandController