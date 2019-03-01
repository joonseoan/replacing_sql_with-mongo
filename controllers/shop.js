const Product = require('../models/product');

exports.getProducts = (req, res, next) => {

    Product.fetchAll()
        .then(products => {
            res.render('shop/productList', { 
                products, 
                docTitle: 'All Products', 
                path: '/products'
            });
        })
        .catch(e => {
            console.log(e);
        });
        
}

exports.getProduct = (req, res, next) => {
    
    // id must be identified with router.get('/products/:id')
    const { id } = req.params;
        
    Product.findById(id)
        .then(product => {

            // no array here other than the one used by mysql2
            res.render('shop/productDetail', {
                product,
                docTitle: product.title,
                path: '/products'
            });
        })
        .catch(e => { console.log(e)});

}

exports.getIndex = (req, res, next) => {

    // [ SELECT * FROM Table ]
    // Also, we can set up 'WHERE' in findAll({where: ?})
    // Without {where: ?}, it feches all data.

    Product.fetchAll()
        .then((products) => {
            // products [ {id, title, price, imageUrl, description}, {id, title, price, imageUrl, description}]
            // console.log(products);
            res.render('shop/index', { 
                products,
                docTitle: 'Shop', 
                path: '/'
            });        
        })
        .catch(e => console.log(e));

    // Only with mysql2
    // Product.fetchAll().then(([ products, meta ]) => {

    //     console.log(products)
    //     res.render('shop/index', { 
    //         products, 
    //         docTitle: 'Shop', 
    //         path: '/'
    //      });
    // }).catch(err => {
    //     console.log(err);
    // });

 }

 // Add to Cart button
 exports.postCart = (req, res, next) => {

    const { id } = req.body;

    Product.findById(id)
        .then(product =>{

            // At this moment, product has the userId number
            return req.user.addToCart(product);
        })
        .then(() => {

            res.redirect('./cart');
        })
        .catch(e => {throw new Error('Unable to add the product to your cart.')})

}

// Required Association!!!
exports.getCart = (req, res, next) => {

    // We must use req.user.getCart();
    req.user.getCart()
        .then(products => {

            console.log('reallty ------------------->', products)
            
            res.render('shop/cart', {
                docTitle: 'Your Cart',
                path: '/cart',
                products
            });

        })
        .catch(e => console.log(e));
    
}

exports.postOrder = (req, res, next) => {
    
    let fetchedCart;
    
    req.user.getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then(products => {
            
            // console.log('products ===============================================> ', products.cartItems)

            // because Order.belongsTo(User);
            // User.hasMany(Order);

            // INSERT id with userId
            //  because 'Order' table has 'id' only that automatically increments
            return req.user.createOrder()
                .then(order => {

                    /* 
                        {   
                            id: 1,
                            userId: 1,
                            updatedAt: 2019-02-27T03:32:47.744Z,
                            createdAt: 2019-02-27T03:32:47.744Z 
                        }
                    
                    
                    */
                    console.log('order: ========================================> ', order)

                    // Adding new products with orderItems row by row

                    // => [1, 1]
                    // const ddd = products.map(product => {
                    //     return product.orderItems = {qty: product.cartTiems.qty };
                    // });
                    return order.addProducts(products.map(product => {

                        /* 
                            {   
                                
                                id: 1,
                                title: 'aaa',
                                price: 22,
                                imageUrl: 'aaa',
                                description: 'aaa',
                                createdAt: 2019-02-27T03:32:44.000Z,
                                updatedAt: 2019-02-27T03:32:44.000Z,
                                userId: 1,
                                cartItems:
                                cartItems {
                                    dataValues: [Object],
                                    _previousDataValues: [Object],
                                    _changed: {},
                                    _modelOptions: [Object],
                                    _options: [Object],
                                    __eagerlyLoadedAssociations: [],
                                    isNewRecord: false } 
                            }
                        
                        */

                        // product.orderItems = { qty: product.cartItems.qty };
                        product.addOrder(order, { through: { qty : product.cartItems.qty }});

                        // return [ product, product ]
                        return product;

                        // Then run addProducts while we are fetching products

                    }));                
                
                })
                .catch(e => console.log(e));
        
        })
        .then((orders) => {

            // Once the order is done, 
            //  'CartItems' is going to be empty.
            return fetchedCart.setProducts(null);

        })
        .then(() => {

            res.redirect('./orders');
        
        })
        .catch(e => console.log(e));
    
}

exports.getOrders = (req, res, next) => {
    /* 
        order in ejs ============================================> order {
        have products ********************************
        { 
            id: 1,
            createdAt: 2019-02-27T03:32:47.000Z,
            updatedAt: 2019-02-27T03:32:47.000Z,
            userId: 1,
            products: [ [product] ] 
        },    
            
    */

    // one:many therefore, user.getOrder(x)
    // Order : Product is a many to many
    // Therefore, getOrder invoke eagerLoading with include:['products]
    
    // 2) dried up statement
    req.user.getOrders({ include: ['products']})
    
    // 1) based on the standard document
    // req.user.getOrders({ include: {
        //     model: Product
        // }})
        .then(orders => {

            //    [ {createdAt: 2019-02-27T05:43:54.000Z,
            //         updatedAt: 2019-02-27T05:43:54.000Z,
            //         userId: 1,
            //         products: [Array] } ],
            console.log('final products : =======================================================================> ', orders)

            res.render('shop/orders', {
                docTitle: 'Your Orders',
                path: '/orders',
                orders
            });
        })
        .catch(e => console.log(e));    

}

exports.postCartDeleteItem = ( req, res, next) => {

    const { id }= req.body;

    req.user.deleteItemFromCart(id)
        .then(() => {
            // res.redirect('./cart');
        })
        .catch(e => {
            throw new Error('Unable to delete.');
        })
}

exports.getCheckout = (req, res, next) => {

    res.render('shop/checkout', {
        docTitle: 'Checkout',
        path: '/checkout'
    });

}