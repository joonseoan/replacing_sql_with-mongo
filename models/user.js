const mongodb = require('mongodb');
const { ObjectId } = mongodb;

const { getDb } = require('../utils/database');

module.exports = class User {

    constructor(username, email, cart, id) {
        this.username = username;
        this.email = email;
        this.cart = cart;
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
        
        // const itemIndex = this.cart.items.findIndex(item => item._id === product._id);

        const updatedCart = { items : [ { ...product, qty: 1 } ] };
        const db = getDb();
        return db.collection('users').updateOne({ _id: id }, {
            // the way to update nested object.
            $set: { cart: updatedCart } 
        })
        // return db.collection('users').
    }

    static findById(userId) {

        const db = getDb();

        // 1)
        // Do not forget next!!!
        // return db.collection('users').find({ _id: new ObjectId(userId) }).next()
        
        // 2) findOne : cursor does not exist. We do not need to toArray() or next()
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

