import {Sequelize, Op} from 'sequelize'
import dotenv from 'dotenv'
dotenv.config()

import {sequelize} from '../models/index.js' /*untuk db transaction*/
import {User, Category, Brand, Product, ProductImage, ProductHistory, Discount, DiscountItem, CartItem, Order, OrderItem, OrderShipping, OrderHistory} from '../models/index.js'
import BaseController from './BaseController.js'

import Response from '../helpers/Response.js'
import Utility from '../helpers/utility.js'

class OrderController extends BaseController {

	async getShippingCost(req, res) {
		try {
			let totalWeight = 0
			for (const cartItemId of req.body.cartItemIds) {
				const cartItem = await CartItem.findByPk(cartItemId, {
				    include: [Product]
				})

			  totalWeight += cartItem.Product.weight * cartItem.quantity;
			}
			
			const url = process.env.RAJAONGKIR_API_URL + "cost"
			const headers = {
				key: process.env.RAJAONGKIR_API_KEY,
				"Content-Type": "application/x-www-form-urlencoded"
			}
			let body = {
				origin: process.env.RAJAONGKIR_ORIGIN_CITY_ID,
				destination: req.body.destinationCityId,
				weight: totalWeight,
				courier: req.body.courierCode
			}

			const params = new URLSearchParams()

  			Object.keys(body).forEach((key) => params.append(key, body[key]))

			const data = await Utility.fetchData(url, "POST", headers, params)

			if (data.rajaongkir.status.code == 200) {
				Response.send(res, 200, "Opsi Pengiriman berhasil ditampilkan", data.rajaongkir)
			}
			else{
				let err = new Error('Gagal mendapatkan data')
				Response.serverError(req, res, err)
			}
		}
		catch(error) {
			Response.serverError(req, res, error)
		}
	}

	async checkout(req, res) {
		const transaction = await sequelize.transaction() 

		try {
			const today = new Date()

			let order = await Order.create({
				userId: req.userData.id,
				orderDate: today,
				status: Order.PENDING
			}, {
				transaction
			})

			let totalAmount = 0

			for (let cartItemId of req.body.cartItemIds) {
				const cartItem = await CartItem.findByPk(cartItemId, {
					include: [Product]
				})

				/* cek is this product has discount today */
				const discountItem = await DiscountItem.findOne({
					where: {
						productId: cartItem.productId
					},
					include: {
						model: Discount,
						where: {
							startDate: { [Op.lte]: today },
							endDate: { [Op.gte]: today }
						}
					}
				})

				let discountItemId = discountItem ? discountItem.id : null

				/* determine the price if the product is on discount */
				let price = cartItem.Product.price
				if (discountItem) {
					if (discountItem.Discount.type == Discount.PERCENTAGE) {
						price = cartItem.Product.price * (discountItem.discountPercentage / 100)
					}
					else if (discountItem.Discount.type == Discount.IDR) {
						price = cartItem.Product.price - discountItem.discountIdr
					}
				}
				totalAmount += (price * cartItem.quantity)

				/* store item to order*/
				const orderItem = await OrderItem.create({
					orderId: order.id,
					productId: cartItem.productId,
					discountItemId,
					quantity: cartItem.quantity,
					price,
					note: cartItem.note
				}, {
					transaction
				})

				/* delete item from cart */
				await cartItem.destroy({transaction})
			}

			order.totalAmount = totalAmount
        	await order.save({ transaction })

        	/* store order shipping */
        	const orderShippingData = req.body.orderShipping
        	await OrderShipping.create({
        		orderId: order.id,
        		provinceId: orderShippingData.provinceId,
		        cityId: orderShippingData.cityId,
		        address: orderShippingData.address,
		        weight: orderShippingData.weight,
		        courierCode: orderShippingData.courierCode,
		        serviceCode: orderShippingData.serviceCode,
		        cost: orderShippingData.cost,
		        estimatedInDay: orderShippingData.estimatedInDay,
        	}, {
				transaction
			})

        	/* store order history */
			await OrderHistory.record(order.id, Order.PENDING, req.userData.id, transaction)

			await transaction.commit()

			Response.send(res, 200, "Berhasil checkout Product", null)
		}
		catch (error) {
			await transaction.rollback()

			if (error instanceof Sequelize.ValidationError) {
			    Response.validationError(res, error.errors)
		    }
		    else {
		      	Response.serverError(req, res, error)
		    }
		}
	}
}


export default OrderController