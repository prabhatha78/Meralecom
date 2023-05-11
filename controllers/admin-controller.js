var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const ObjectId = require('mongodb').ObjectId
const salesreport = require('../middleware/salesreport')


module.exports = {
    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {

            let loginStatus = false;
            let response = {};
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ username: adminData.username })
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        console.log('login successful');
                        response.status = true;
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }

                })
            } else {
                console.log('login failed');
                resolve({ status: false });

            }
        })
    },

    addCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            let testcategory = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category_name: category.category_name })
            if (testcategory) {
                resolve({ categoryExist: true })
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                    resolve({categoryExist:false})
                })
            }
        })
    },

    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },

    getCategoryById: (catId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:ObjectId(catId)}).then((response) => {
                resolve(response)
            })
        })
    },

    getCategory: (catname) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({category_name:catname}).then((response) => {
                resolve(response)
            })
        })
    },

    updateCategory: (catId, category) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: ObjectId(catId) }, {
                    $set: {
                        category_name: category.category_name,
                        cat_descrypt: category.cat_descrypt,
                        image: category.image
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    fetchCategoryImage: (catId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(catId) }).then((response) => {
                resolve(response.image)
            })
        })
    },

    addIngredient: (ingredient) => {
        return new Promise(async (resolve, reject) => {
            let testingredient = await db.get().collection(collection.INGREDIENT_COLLECTION).findOne({ingredient_name:ingredient.ingredient_name})
            if(testingredient){
                resolve({ingredientExist:true})
            } else {
                db.get().collection(collection.INGREDIENT_COLLECTION).insertOne(ingredient).then((data) => {
                    resolve({ingredientExist:false})
                }) 
            }
            
        })
    },

    getAllIngredient: () => {
        return new Promise(async (resolve, reject) => {
            let ingredient = await db.get().collection(collection.INGREDIENT_COLLECTION).find().toArray()
            resolve(ingredient)
        })
    },

    getIngredientById: (ingreId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.INGREDIENT_COLLECTION).findOne({ _id: ObjectId(ingreId) }).then((response) => {
                resolve(response)
            })
        })
    },

    getIngredient: (ingrename) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.INGREDIENT_COLLECTION).findOne({ ingredient_name:ingrename }).then((response) => {
                resolve(response)
            })
        })
    },

    updateIngredient: (ingId, ingredient) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.INGREDIENT_COLLECTION)
                .updateOne({ _id: ObjectId(ingId) }, {
                    $set: {
                        ingredient_name: ingredient.ingredient_name,
                        ingre_descrypt: ingredient.ingre_descrypt,
                        image: ingredient.image
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    fetchIngredientImage: (ingreId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.INGREDIENT_COLLECTION).findOne({ _id: ObjectId(ingreId) }).then((response) => {
                resolve(response.image)
            })
        })
    },

    addProduct: (product) => {
        let quantity = parseInt(product.quantity)
        product.quantity = quantity
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                resolve()
            })

        })
    },

    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },

    getProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(productId) }).then((response) => {
                resolve(response)
            })
        })
    },


    deleteProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: ObjectId(productId) }, { $set: { status: false } }).then((response) => {
                    resolve()
                })
        })
    },


    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: ObjectId(proId) }, {
                    $set: {
                        product_name: proDetails.product_name,
                        product_description: proDetails.product_description,
                        reg_price: proDetails.reg_price,
                        promo_price: proDetails.promo_price,
                        quantity: parseInt(proDetails.quantity),
                        volume: proDetails.volume,
                        category: proDetails.category,
                        ingredient: proDetails.ingredient,
                        images: proDetails.images
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    getProductImage: (proId, imgno) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) }).then((response) => {
                resolve(response.images[imgno])

            })
        })
    },


    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).find().toArray().then((user) => {
                resolve(user)
            })
        })
    },

    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectId(userId) }, { $set: { status: false } }).then((response) => {
                    resolve()
                })
        })
    },

    unblockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectId(userId) }, { $set: { status: true } }).then((response) => {
                    resolve()
                })
        })
    },

    addCoupon: (coupon) => {
        return new Promise(async (resolve, reject) => {
            coupon.status = true
            coupon.code = coupon.code.toUpperCase()
            coupon.discount = parseInt(coupon.discount)
            coupon.min_purchase = parseInt(coupon.min_purchase)
            coupon.max_purchase = parseInt(coupon.max_purchase)
            db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((data) => {
                resolve(data._id)
            })
        })
    },


    getAllCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },


    getCoupon: (couponId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: ObjectId(couponId) }).then((response) => {
                resolve(response)
            })
        })
    },


    updateCoupon: (couponId, coupon) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION)
                .updateOne({ _id: ObjectId(couponId) }, {
                    $set: {
                        code: coupon.code,
                        discount: coupon.discount,
                        expiry_date: coupon.expiry_date,
                        min_purchase: coupon.min_purchase,
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    deleteCoupon: (couponId) => {
        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.COUPON_COLLECTION)
                .updateOne({ _id: ObjectId(couponId) }, { $set: { status: false } }).then((response) => {
                    resolve()
                })
        })
    },

    getOrder: () => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(order)
        })
    },

    dashboardCount: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
            let order = await db.get().collection(collection.ORDER_COLLECTION).find().count()
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().count()
            resolve({ product, order, category })
        })
    },

    changeOrderstatus: (orderId, status) => {
        let date = new Date().toString().slice(0, 21)

        const obj = {
            status: true,
            lastUpdate: { date: date }
        }
        return new Promise((resolve, reject) => {
            if (status == 1) {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        'shipmentStatus.orderPlaced': obj,
                        'shipmentStatus.shipped.status': false,
                        'shipmentStatus.outForDelivery.status': false,
                        'shipmentStatus.delivered.status': false,
                    }
                }).then((response) => {
                    resolve(response)
                })
            } else if (status == 2) {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        'shipmentStatus.orderPlaced.status': true,
                        'shipmentStatus.shipped': obj,
                        'shipmentStatus.outForDelivery.status': false,
                        'shipmentStatus.delivered.status': false,
                    }
                }).then((response) => {
                    resolve(response)
                })
            } else if (status == 3) {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        'shipmentStatus.orderPlaced.status': true,
                        'shipmentStatus.shipped.status': true,
                        'shipmentStatus.outForDelivery': obj,
                        'shipmentStatus.delivered.status': false
                    }
                }).then((response) => { resolve(response) })
            } else if (status == 4) {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        'shipmentStatus.orderPlaced.status': true,
                        'shipmentStatus.shipped.status': true,
                        'shipmentStatus.outForDelivery.status': true,
                        'shipmentStatus.delivered': obj,
                        paymentStatus: 'Paid',
                        deliveryStatus: 'delivered'
                    }
                }).then((response) => {
                    resolve(response)
                })
            }
        })
    },


    getOrdersByMonth: () => {
        return new Promise(async (resolve) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { "shipmentStatus.delivered.status": true }
                },
                {
                    $group: {
                        _id: "$monthInNo",
                        total: { $sum: '$total' }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray()
            let details = [];
            orders.forEach(element => {
                details.push(element.total)
            });
            resolve(details)
        })
    },

    getOrdersQuantity: () => {
        return new Promise(async (resolve) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { "shipmentStatus.delivered.status": true }
                },
                {
                    $group: {
                        _id: "$monthInNo",
                        total: { $sum: '$totalquantity' }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray()
            let details = [];
            orders.forEach(element => {
                details.push(element.total)
            });
            resolve(details)
        })
    },

    getOrderTotal: () => {
        return new Promise(async (resolve) => {
            let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$total' }
                    }
                },
                {
                    $project: { _id: 0, total: 1 }
                }
            ]).toArray()
            resolve(orderTotal)
        })
    },

    


    gerSalesReportInfo: (details) => {      
        return new Promise( async (resolve,reject)=>{
            if (new Date(details.fromdate) < new Date() && new Date(details.todate) < new Date()) {
                let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{
                            $and:[
                                {'shipmentStatus.delivered.status':true},
                                {
                                    orderDate: {
                                        $gt: new Date(details.fromdate),
                                        $lte: new Date(details.todate)
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: "$month",
                            total: { $sum: '$total' },
                            orderCount: { $sum: 1 },
                            productQty: { $sum: "$totalquantity" }
                        }
                    },
                    {
                        $sort: { monthInNo: 1 }
                    }
                ]).toArray();
                salesreport(data).then(() => {
                    resolve({ status: true })
                })
            } 
            else {
                resolve({ status: false })
            }
        })
    }

}