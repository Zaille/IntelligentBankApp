const path = require("path");
const fs = require("fs");

const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

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

/* Default path */
app.get('*', function (req, res) {
    res.sendFile('public/index.html', {'root': __dirname});
});

/* Save updated dataset */
// TODO
/*app.post('/save_data', jsonParser, function (req, res) {

    let data = [{"names": {}, "search": {}}];
    data[0].names = req.body.names;
    data[0].search = req.body.search;

    fs.writeFile('public/data/names_saved.json', JSON.stringify(data), function(err) {
        if (err) {
            return console.error(err);
        }
        console.log("Data written successfully!");
    });

    res.end();
})*/

/* Run the server */
const server = app.listen(8080, function () {
    let port = server.address().port;
    console.log('My app is listening at http://127.0.0.1:%s', port);
});
