const path = require("path");
const fs = require("fs");
const bodyParser = require('body-parser');

const express = require('express');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/********** GET **********/

app.get('/contacts', function (req, res) {
    fs.readFile('public/data/external-account.json', 'utf8', (err, data) => {
        const json = JSON.parse(data);
        res.json(json.beneficiary);
    });
});

app.get('/profile/:contact_id', function (req, res) {
    fs.readFile('public/data/external-account.json', 'utf8', (err, data) => {
        const json = JSON.parse(data);
        json.beneficiary.forEach(contact => {
            console.log(contact);
            if( contact.id === parseInt(req.params.contact_id) ) res.json(contact);
        })
    });
});

app.get('/accounts/:account_name', function (req, res) {
    fs.readFile('public/data/internal-account.json', 'utf8', (err, data) => {
        const json = JSON.parse(data);
        json.account.forEach(account => {
            if( account.name === req.params.account_name ) res.json(account);
        })
    });
});

/********** POST **********/

app.post('/add_contact', function (req, res) {

    fs.readFile('public/data/external-account.json', 'utf8', (err, data) => {
        const json = JSON.parse(data);

        let newContact = {
            "id": parseInt(json.beneficiary[json.beneficiary.length-1].id) + 1,
            "firstName": req.body.firstname,
            "lastName": req.body.lastname,
            "searchScore": 0.1,
            "transferScore": 0.1,
            "IBAN": req.body.iban
        }

        json.beneficiary.push(newContact);

        fs.writeFile('public/data/external-account.json', JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.json({id: newContact.id});
            }
        });
    });
})

/* Default path */
app.get('*', function (req, res) {
    res.sendFile('public/index.html', {'root': __dirname});
});

/* Run the server */
const server = app.listen(8080, function () {
    let port = server.address().port;
    console.log('My app is listening at http://127.0.0.1:%s', port);
});
