var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('bson')
const { resolve } = require('express-hbs/lib/resolver')
const dotenv = require('dotenv');
dotenv.config()
const Razorpay = require('razorpay');
secret = process.env.RAZORPAY_SECRET_KEY
var instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});
const crypto = require('crypto')
const { response } = require('express')

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            testUser = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            testContact = await db.get().collection(collection.USER_COLLECTION).findOne({ contact: userData.contact })
            userData.password = await bcrypt.hash(userData.password, 10)
            userData.password2 = await bcrypt.hash(userData.password2, 10)
            if (testUser) {
                resolve({ emailExist: true })
            }
            else if (testContact) {
                resolve({ contactExist: true })
            } else {
                resolve({ email: userData.email })
            }
        })

    },

    addUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },

    getUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) }).then((response) => {
                resolve(response)
            })
        })
    },

    addAddress: (data, userId) => {
        return new Promise(async (resolve, reject) => {
            let addressObj = {
                id: new ObjectId(),
                fname: data.fname,
                lname: data.lname,
                line1: data.line1,
                line2: data.line2,
                landmark: data.landmark,
                citystate: data.citystate,
                zip: data.zip,
                country: data.country
            }

            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectId(userId) },
                    {
                        $push: { address: addressObj }
                    }).then((response) => {
                        resolve(response)
                    })
        })
    },

    getAddress: (addressId, userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $unwind: "$address"
                }, {
                    $match: { "address.id": ObjectId(addressId) }
                }
            ]).toArray();
            if (user[0]) {
                resolve(user[0])
            } else {
                resolve(false)
            }
        })
    },


    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {};
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user.status) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }

                })
            } else {
                resolve({ status: false });

            }
        })
    },


    productCategory: (catname) => {
        console.log(catname);
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category_name: catname })
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category.category_name }).toArray();
            console.log(product);
            resolve(product)

        })

    },



    productIngredient: (ingrename) => {
        return new Promise(async (resolve, reject) => {
            let ingredient = await db.get().collection(collection.INGREDIENT_COLLECTION).findOne({ ingredient_name: ingrename })
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ ingredient: ingredient.ingredient_name }).toArray();
            resolve(product)

        })

    },

    displayProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },

    addToCart: (prod, userId) => {
        let price = parseInt(prod.price)
        let proObj = {
            item: ObjectId(prod.proId),
            price: price,
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(prod.proId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prod.proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(prod.proId) },
                            {
                                $inc: {
                                    'products.$.quantity': 1,
                                    'products.$.price': price,
                                    'totalquantity' : 1,
                                    'total': price,
                                    'finalTotal': price

                                }
                            }).then((response) => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId) },
                            {
                                $push: { products: proObj },
                                $inc: {
                                    'totalquantity': 1,
                                    'total': price,
                                    'finalTotal': price
                                }

                            }).then((response) => {
                                resolve(response)
                            })
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj],
                    totalquantity: 1,
                    total: price,
                    finalTotal: price
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    addToInvoice: async (prod, userId) => {
        let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(prod.proId) })
        let price = parseInt(prod.price)
        let proObj = {
            description: product.product_name,
            price: price,
            quantity: 1,
            "tax-rate": 0
        }
        return new Promise(async (resolve, reject) => {
            let invoice = await db.get().collection(collection.INVOICE_COLLECTION).findOne({ cart: ObjectId(userCart._id) })
            if (invoice) {
                let proExist = invoice.products.findIndex(product => product.description === prod.product_name)
                if (proExist != -1) {
                    db.get().collection(collection.INVOICE_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.description': prod.product_name },
                            {
                                $inc: {
                                    'products.$.quantity': 1,
                                    'subtotal': price,
                                    'total': price
                                }
                            }).then((response) => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.INVOICE_COLLECTION)
                        .updateOne({ cart: ObjectId(userCart._id) },
                            {
                                $push: { products: proObj },
                                $inc: {
                                    'subtotal': price,
                                    'total': price
                                }

                            }).then((response) => {
                                resolve(response)
                            })
                }
            } else {
                let invoiceObj = {
                    user: ObjectId(userId),
                    cart: ObjectId(userCart._id),
                    products: [proObj],
                    subtotal: price,
                    total: price
                }
                db.get().collection(collection.INVOICE_COLLECTION).insertOne(invoiceObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        price: '$products.price'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        price: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)


        })
    },

    getCart: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) }).then((data) => {
                resolve(data)
            })
        })

    },


    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },


    changeProductQuantity: async (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(details.product) })
        let price = parseInt(product.promo_price)
        console.log(product.quantity);
        return new Promise((resolve, reject) => {
                if(details.quantity<product.quantity || details.count == -1){
                    if (details.count == -1 && details.quantity == 1) {
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ _id: ObjectId(details.cart) },
                                {
                                    $inc: {'totalquantity':-1, 'total': -price, 'finalTotal': -price },
                                    $pull: { products: { item: ObjectId(details.product) } }
                                }
                            ).then(() => {
                                resolve({ removeProduct: true })
                            })
    
                    } else {
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                                {
                                    $inc: {
                                        'products.$.quantity': details.count,
                                        'products.$.price': price * details.count,
                                        'totalquantity':details.count,
                                        'total': price * details.count,
                                        'finalTotal': price * details.count
    
                                    }
                                }).then((response) => {
                                    resolve(true)
                                })
                    }
                } else {
                    resolve({warning:true})
                }

        })
    },

    changeInvoiceQuantity: async (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(details.product) })
        let price = parseInt(product.promo_price)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.INVOICE_COLLECTION)
                    .updateOne({ cart: ObjectId(details.cart) },
                        {
                            $inc: { 'subtotal': -price, 'total': -price },
                            $pull: { products: { description: product.product_name } }
                        }
                    ).then((response) => {
                        resolve(response)
                    })

            } else {
                db.get().collection(collection.INVOICE_COLLECTION)
                    .updateOne({ cart: ObjectId(details.cart), 'products.description': product.product_name },
                        {
                            $inc: {
                                'products.$.quantity': details.count,
                                'subtotal': price * details.count,
                                'total': price * details.count

                            }
                        }).then((response) => {
                            resolve(true)
                        })
            }

        })
    },

    removeFromCart: async (data) => {
        let price = parseInt(data.price)
        let quantity = parseInt(data.quantity)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: ObjectId(data.cartId) },
                    {
                        $inc: { 'totalquantity':-quantity, 'total': -price, 'finalTotal': -price },
                        $pull: { products: { item: ObjectId(data.proId) } },
                        $unset: { discount: "", savings: "", coupon: "" }
                    }
                ).then(() => {
                    resolve({ removeProduct: true })
                })
        })
    },

    placeOrder: (order, user, products, cart) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(user._id) })
            let name = user.firstname + " " + user.lastname
            let today = new Date()
            let expectedDeliveryDate = new Date(today)
            expectedDeliveryDate.setDate(today.getDate() + 6);
            const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            let orderStatus = order.paymentMethod === 'COD' ? 'placed' : 'pending';
            let orderObj = {
                deliveryDetails: {
                    address: {
                        fname: user.address.fname,
                        lname: user.address.lname,
                        line1: user.address.line1,
                        line2: user.address.line2,
                        landmark: user.address.landmark,
                        citystate: user.address.citystate,
                        zip: user.address.zip
                    },
                    mobile: order.contact
                },
                userId: ObjectId(order.userId),
                cart: ObjectId(userCart._id),
                username: name,
                paymentMethod: order.paymentMethod,
                products: products,
                totalquantity: cart.totalquantity,
                subtotal: cart.total,
                coupon: cart.coupon,
                discount: cart.savings,
                discountrate: cart.discount,
                total: cart.finalTotal,
                orderStatus: orderStatus,
                orderDate: new Date(),
                monthInNo: new Date().getMonth() + 1,
                month: month[new Date().getMonth()],
                expectedDeliveryDate: expectedDeliveryDate.toString().slice(0, 16),
                shipmentStatus: {
                    orderPlaced: { status: true, lastUpdate: { date: new Date().toString().slice(0, 21) } }
                }
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                resolve(response.insertedId)
            })
        })
    },


    getOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            resolve(order)
        })
    },

    invoiceDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let invoice = await db.get().collection(collection.INVOICE_COLLECTION).findOne({ order: ObjectId(orderId) })
            resolve(invoice)
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        productTotal: '$products.price'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        productTotal: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },

    getMyOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: ObjectId(userId) }
                },
                {
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $sort: { date: -1 }
                }
            ]).toArray();
            resolve(orders)
        })
    },



    generateRazorPay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: `${orderId}`,
            }

            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(order);
                }
                resolve(order)
            });
        })
    },



    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            generated_signature = hmac.digest('hex');
            if (generated_signature == details['payment[razorpay_signature]']) {
                resolve(true)
            } else {
                reject();
            }
        })
    },


    changeOrderStatus: (orderId, cartId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            let paymentStatus = order.paymentMethod === 'COD' ? 'Pending' : 'Paid';
            db.get().collection(collection.INVOICE_COLLECTION)
                .updateOne({ cart: ObjectId(cartId) },
                    {
                        $set: { order: ObjectId(orderId) },
                        $unset: { cart: ObjectId(cartId) }
                    }
                ).then((response) => {
                    db.get().collection(collection.ORDER_COLLECTION)
                        .updateOne({ _id: ObjectId(orderId) },
                            {
                                $set: { orderStatus: "placed", paymentStatus: paymentStatus }
                            }
                        ).then((response) => {
                            db.get().collection(collection.CART_COLLECTION).findOneAndDelete({ _id: ObjectId(cartId) })
                                .then(async (response) => {
                                    resolve()
                                    let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) });
                                    let orderProducts = order.products
                                    orderProducts.forEach(obj => {

                                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(obj.item) }, {
                                            $inc: { quantity: Number("-" + obj.quantity) }
                                        })
                                    });
                                })
                        }).then((response) => {
                            resolve(response)
                        })
                })

        })
    },

    getAllCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },


    applyCoupon: (data, userId, total) => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ code: data.coupon })

            if (total >= parseInt(coupon.min_purchase) && new Date() <= new Date(coupon.expiry_date)) {
                let code = data.coupon
                let discount = coupon.discount
                let cartSavings = Math.floor(total * discount / 100)
                let finalTotal = Math.floor(total - cartSavings)
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user: ObjectId(userId) },
                        {
                            $set: {
                                coupon: data.coupon,
                                discount: `${coupon.discount}%`,
                                savings: cartSavings,
                                finalTotal: finalTotal
                            }
                        }).then((response) => {
                            resolve({ cartSavings, code })
                        })
            } else {
                resolve(false)
            }
        })
    },

    removeCoupon: (data, userId, total) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            let discount = cart.savings
            let total = cart.finalTotal
            let finalTotal = Math.floor(total + discount)
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ user: ObjectId(userId) },
                    {
                        $set: { finalTotal: finalTotal },
                        $unset: { discount: "", savings: "", coupon: "" }
                    }).then((response) => {
                        resolve({ finalTotal })
                    })

        })
    },


    addToWishlist: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let proExist = await db.get().collection(collection.USER_COLLECTION).findOne({ $and: [{ _id: ObjectId(userId) }, { wishlist: ObjectId(proId) }] })
            if (proExist) {
                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({ _id: ObjectId(userId) },
                        {
                            $pull: { wishlist: ObjectId(proId) }
                        }).then((response) => {
                            resolve(response)
                        })
            } else {
                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({ _id: ObjectId(userId) },
                        {
                            $push: { wishlist: ObjectId(proId) }
                        }).then((response) => {
                            resolve(response)
                        })
            }

        })
    },

    checkWishlist: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let proExist = await db.get().collection(collection.USER_COLLECTION).findOne({ $and: [{ _id: ObjectId(userId) }, { wishlist: ObjectId(proId) }] })
            if (proExist) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    },

    viewWishlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $unwind: '$wishlist'
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'wishlist',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(wishlist)


        })
    },

    updateProfile: (data) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectId(data.userId) }, {
                    $set: {
                        firstname: data.firstname,
                        lastname: data.lastname,
                        contact: data.contact
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    checkCart: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            let productExits = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) });
            if (productExits) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
    },

    cancelOrder: (orderId) => {
        return new Promise((async (resolve, reject) => {
            let order = db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            db.get().collection(collection.INVOICE_COLLECTION).findOneAndDelete({ cart: ObjectId(order.cart) }).then((response) => {
                db.get().collection(collection.ORDER_COLLECTION)
                    .updateOne({ _id: ObjectId(orderId) }, {
                        $set: {
                            orderStatus: "Cancelled",
                            cancelDate: new Date().toString().slice(0, 16)
                        }
                    }).then((response) => {
                        resolve(response)
                    })
            })

        }))
    },

    changePassword: (userId, data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            oldPassword = data.oldPassword
            newPassword1 = data.newPassword1
            newPassword2 = data.newPassword2
            data.oldPassword = await bcrypt.hash(data.oldPassword, 10)
            data.newPassword1 = await bcrypt.hash(data.newPassword1, 10)
            data.newPassword2 = await bcrypt.hash(data.newPassword2, 10)
            bcrypt.compare(oldPassword, user.password).then((response) => {
                if (response) {
                    if (newPassword1 === '') {
                        resolve({ enterPassword: true })
                    } else if (newPassword1.length < 8) {
                        resolve({ minimumlength: true })
                    } else if (newPassword1 !== newPassword2) {
                        resolve({ mismatch: true })
                    } else {
                        db.get().collection(collection.USER_COLLECTION)
                            .updateOne({ _id: ObjectId(userId) },
                                {
                                    $set: {
                                        password: data.newPassword1,
                                        password2: data.newPassword2
                                    }
                                }).then((response) => {
                                    resolve({ changePassword: true })
                                })
                    }
                } else {
                    resolve({ failed: true })
                }
            })

        })
    },


    deleteAddress: (addressId, userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectId(userId) },
                    {
                        $pull: {
                            address: { id: ObjectId(addressId) }
                        }
                    }).then((response) => {
                        resolve(response)
                    })
        })
    },

    editAddress: (userId, address) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectId(userId), 'address.id': ObjectId(address.id) },
                    {
                        $set: {
                            "address.$.fname": address.fname,
                            "address.$.lname": address.lname,
                            "address.$.line1": address.line1,
                            "address.$.line2": address.line2,
                            "address.$.landmark": address.landmark,
                            "address.$.zip": address.landmark,
                            "address.$.citystate": address.citystate
                        }
                    }).then((response) => {
                        resolve()
                    })
        })
    }


}
