const path = require("path");
const bodyParser = require('body-parser');
const fs = require('fs');

const express = require('express');
const app = express();

const jsonParser = bodyParser.json();

app.use(express.static(path.join(__dirname, 'public')));

/* Default path */
app.get('/', function (req, res) {
    res.sendFile('public/index.html', {'root': __dirname});
});

app.get('/list', function (req, res) {
    res.sendFile('public/list.html', {'root': __dirname});
});

app.get('/profile', function (req, res) {
    res.sendFile('public/profile.html', {'root': __dirname});
});

app.get('/transfer', function (req, res) {
    res.sendFile('public/transfer.html', {'root': __dirname});
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
