const express = require('express');

// invoke express here and hence transform express into global objects. 
// Therefore, we can define and invoke every async app function in order of line.
const app = express();

const { mongoConnect } = require('./utils/database');
const User = require('./models/user');

const bodyParser = require('body-parser');
const path = require('path');

// Execute routes
const adminRouters = require('./routes/admin');
const shopRouters = require('./routes/shop'); 
const { pageNotFound } = require('./controllers/pageNotFound');

// Execute front-ends
app.set('view engine', 'ejs');
// app.set('views', 'views');

// the path that html can access
app.use(express.static(path.join(__dirname, 'public')));

// boty parser to get json format
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    
    User.fetchAll().then(users => {
        if(users.length > 0) {

            console.log(`${ users[0].username } just signed in!` );
            req.user = users[0];

            next();

        } else {

            const newUser = new User('joons', 'joon@joon.net');
            newUser.save()
                .then(() => { 
                    console.log('Joon is signed up!');
                    return User.findById(newUser._id)
                        .then(user => {
                            req.user = user;
                        });
                })
                .then(() => {
                    console.log('Joon successfully logged in!');
                    next();
                })
                .catch(e => { throw new Error('Joon is not created.')});

        }
    });

});

// routers
app.use('/admin', adminRouters);
app.use(shopRouters);

// Must be at the end of routes
//  when the client unables to find the routes 
//  because no route is specified.
app.use(pageNotFound);

mongoConnect(() => {

    console.log('Node is Up!!!');
    
    app.listen(3000);

});