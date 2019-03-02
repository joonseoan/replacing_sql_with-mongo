const mongodb = require('mongodb');
const { ObjectId } = mongodb;

const { getDb } = require('../utils/database');

module.exports = class User {

    constructor(username, email, cart, id) {

        this.username = username;
        this.email = email;
        this.cart = cart ? cart : null;
        this._id = id ? new ObjectId(id) : null;
    
    }

    save() {

        const db = getDb();

        return db.collection('users').insertOne(this)
            .then(() => {
                console.log('a user just saved.!');
            })
            .catch(e => { throw new Error('Unable to save the user.'); });

    }
    
    addToCart(product) {

        let newQty = 1;
        let itemIndex;
        // let updatedCart;
        let updatedCartItems = [];

        if(this.cart) {

            itemIndex = this.cart.items.findIndex(item => 
                // must be string when the value is from parametr.
                // Both are ObjectId
                product._id.toString() === item.productId.toString());

            updatedCartItems = [ ...this.cart.items ];
        
        }

        // When updating the existing product
        if(itemIndex >= 0) {
            
            newQty = this.cart.items[itemIndex].qty + 1;
            
            // can update the instance attributes!
            updatedCartItems[itemIndex].qty = newQty;

            // ********************************************************
            // we can directly update attributes of the instance.

            // However, it does not kick in database.
            // In order to get data updated in the database,
            //      we need to copy the this.cart.items and then
            //      assgin it to database variable as shown above.
            // this.cart.items[itemIndex].qty += 1;
            // console.log(this.cart.items[itemIndex].qty)
            // ********************************************************

        } else {
            updatedCartItems.push({ productId: product._id, qty: newQty });
        }
        
        // const existingCart = this.cart; // null
        // It fully updates cart!!!!!!!!!!!!!!!!!!!!!!
        // Therefore, single cart.item always exists
        const updatedCart = { items : [ ...updatedCartItems ]};
        
        const db = getDb();

        return db
            .collection('users')

            // must be user.id
            .updateOne({ _id: this._id }, {
            
            // the way to update nested object.
            $set: { cart: updatedCart } 
        })
        .catch(e => { throw new Error('Unable to update the product.')});
    
    }

    getCart() {

        // remind get/set
        // But they are not in memory forever.
        // { items:
        //  [ { productId: 5c79869fe792393e80293c93, qty: 2 },
        //  { productId: 5c7986b0e792393e80293c94, qty: 3 } ]
        // }
        console.log(this.cart)
        // return this.cart;

        // by using db
        const db = getDb();

        // get just productId
        const productIds = this.cart.items.map(item => item.productId);
        
        // find the products are matched with all productIds, an array in user's cart.
        return db.collection('products').find( { 
            _id: { 
                $in: productIds 
            } 
        })
        .toArray()
        .then(products => {

            // all products from products collection
            console.log('======ppppppppppppppppppppp>', products)
            // return products;

            return products.map(product => {
                return { 
                    ...product,
                    // find(): array method. 
                    // qty : qty of all info
                    qty: this.cart.items.find(item => product._id.toString() === item.productId.toString()).qty
                }
            })
        })
        .catch(e => { throw new Error('Unable to get products in your cart.'); });

    }

    deleteItemFromCart(prodId) {

        const updatedCartItems = this.cart.items.filter(item => 
            prodId.toString() !== item.productId.toString());

        const db = getDb();
        return db.collection('users').updateOne({

                _id: this._id 
            
            }, 
            { $set: { 
                cart : { items : updatedCartItems }
            }
        });

    }

    addOrder() {
        const db = getDb();
        // can create a collection and a document without class *****
        //  because the helper functions are not required so far.

        // adding user information
        // call a function in this class
        return this.getCart()
            .then(products => {
                const order = {

                    // product: product info and qty
                    items: products,
                    user: {
                        _id: this._id,
                        username: this.username
                    }
                };

                return db.collection('orders').insertOne(order);
            
            }).then(() => {

                // newly renew this.cart in the instance
                this.cart = { items: [] };

                // make the user.cart cllection in the database empty.
                return db.collection('users').updateOne({
                    _id: this._id
                }, {
                    $set: { cart: { items: [] } }
                })

            })
            .catch(e => { throw new Error('Order is successful!'); });

    }

    getOrders() {
        const db = getDb();

        //'user._id': it is a way to find the nested object
        /* 
            
            user
            :
            Object
            _id
            :
            5c798690e792393e80293c92
            username
            :
            "joons"
        
        */
       // 'user._id in orders collection that is created in addOrder
       // this._id is the presetn order that the user signed up with

       console.log('this._id', this._id)
        return db.collection('orders')
            .find({'user._id': this._id})
            .toArray();
    }

    static findById(userId) {

        const db = getDb();

        // 1)
        // Do not forget next!!!
        // return db.collection('users').find({ _id: new ObjectId(userId) }).next()
        
        // 2) findOne : cursor does not exist. We do not need to toArray() or next()
        
        // usserId from the parameter is still string.
        return db.collection('users').findOne({ _id: new ObjectId(userId) })
            .then(user => {
                return user;
            }).catch(e => { throw new Error('Unable to find the user.'); });
    }

    static fetchAll() {
        const db = getDb();
        return db.collection('users').find().toArray()
            .then(users => {
                return users;
            });
    }
}