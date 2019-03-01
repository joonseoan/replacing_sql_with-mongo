const Product = require('../models/product');

exports.getAddProducts = (req, res, next) => {

    res.render('admin/editProducts', {
        docTitle: 'Add Products',
        path: '/admin/addProducts',
        editing: false
      
    });

}

// to INSERT 'user input data' to the database
exports.postAddProducts = (req, res, next) => {
    
    const { title, imageUrl, description, price } = req.body;
    console.log(req.user)
    const userId = req.user._id;

    // null is for product id
    const product = new Product(title, imageUrl, description, price, null, userId);
    product.save()
        .then(() => {
            // It is a request data, not pure doc data.
            // console.log('result ======================================> ', result)
            console.log('Created Product');
            res.redirect('/admin/products');

        })
        .catch(e => console.log(e));

}

exports.getProducts = (req, res, next) => {

    Product.fetchAll()
        .then(products => {

            res.render('admin/products', {
                products,
                docTitle: 'Admin Products',
                path: '/admin/products'
            });

        })
        .catch(e =>  { throw new Error('Unable to get product list for admin.'); });

}

exports.getEditProduct = (req, res, next) => {

    console.log('req.query: ', req.query); // => req.query:  { edit: 'true', new: 'title' }

    // STRING, by the way
    const editMode = req.query.edit;

    if(!editMode) return res.redirect('/');

    const id = req.params.id;

    Product.findById(id)
        .then(product => {

            if(!product) res.redirect('/');

            res.render('admin/editProducts', {
                product,
                docTitle: 'Edit Product',
                path: '/admin/editProducts',
                editing: editMode
            });

        })
        .catch(e => { throw new Error('Unable to get the existing product. '); });

}

exports.postEditProduct = (req, res, next) => {

    const { title, imageUrl, description, price, id  } = req.body;
    if(!id || !title || !imageUrl || !description || !price) throw new Error('Invalid Input');

    new Product(
        title,
        imageUrl,
        description,
        price,
        id    
    )
    .save()
    .then(() => {

        console.log('Data is updated!!!')
        res.redirect('/admin/products');

    })
    .catch(e => { throw new Error('Unable to update!'); });
    
}

exports.deleteProduct = (req, res, next) => {
    const { id } = req.body;

    Product.deleteById(id)
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch(e => { throw new Error('Unable to delete the product. '); });

}