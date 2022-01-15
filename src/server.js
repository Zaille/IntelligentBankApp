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

let PK_new = 0.05; // Default value for updating scores
let min_TH = 0.3; // Minimum threshold to reach, to appear in the list of results

/********** GET **********/

app.get('/contacts', function (req, res) {
    fs.readFile(path.join(__dirname, 'public/data/external-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);
        res.json(json.beneficiary);
    });
});

app.get('/profile/:contact_id', function (req, res) {
    fs.readFile(path.join(__dirname, 'public/data/external-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);
        json.beneficiary.forEach(contact => {
            if( contact.id === parseInt(req.params.contact_id) ) res.json(contact);
        })
    });
});

app.get('/accounts', function (req, res) {
    fs.readFile(path.join(__dirname, 'public/data/internal-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);
        res.json(json.account);
    });
});

app.get('/accounts/:account_id', function (req, res) {
    fs.readFile(path.join(__dirname, 'public/data/internal-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);
        json.account.forEach(account => {
            if( account.id === parseInt(req.params.account_id) ) res.json(account);
        })
    });
});

app.get('/feature/score', function (req, res) {
    fs.readFile(path.join(__dirname, 'public/data/scores.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);
        res.json(json.feature);
    });
});

/********** POST **********/

app.post('/add_contact', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/external-account.json'), 'utf8', (err, data) => {
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

        fs.writeFile(path.join(__dirname, 'public/data/external-account.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.json({id: newContact.id});
            }
        });
    });
})

app.post('/update_contact', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/external-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        for(let i = 0; i < json.beneficiary.length; i++ ){
            if(json.beneficiary[i].id === parseInt(req.body.id)) {
                json.beneficiary[i].firstName = req.body.firstname;
                json.beneficiary[i].lastName = req.body.lastname;
                json.beneficiary[i].IBAN = req.body.iban;
            }
        }

        fs.writeFile(path.join(__dirname, 'public/data/external-account.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.end();
            }
        });
    });
});

app.post('/remove_contact', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/external-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        let beneficiary = [];

        json.beneficiary.forEach((contact) => {
            if(contact.id !== parseInt(req.body.id)) {
                beneficiary.push(contact);
            }
        });

        json.beneficiary = beneficiary;

        fs.writeFile(path.join(__dirname, 'public/data/external-account.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.end();
            }
        });
    });
});

app.post('/update_amount', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/internal-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        for(let i = 0; i < json.account.length; i++ ){
            if(json.account[i].id === parseInt(req.body.id)) {
                if(req.body.type === "deduct") json.account[i].amount -= parseInt(req.body.amount);
                else json.account[i].amount += parseInt(req.body.amount);

                fs.writeFile(path.join(__dirname, 'public/data/internal-account.json'), JSON.stringify(json), function(err) {
                    if (err) {
                        return console.error(err);
                    } else {
                        res.end();
                    }
                });
            }
        }
    });
});

app.post('/update_account', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/internal-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        for(let i = 0; i < json.account.length; i++ ){
            if(json.account[i].id === parseInt(req.body.id)) {
                json.account[i].name = req.body.name;
            }
        }

        fs.writeFile(path.join(__dirname, 'public/data/internal-account.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.end();
            }
        });
    });
});

app.post('/remove_account', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/internal-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        let accounts = [];

        json.account.forEach((account) => {
            if(account.id !== parseInt(req.body.id)) {
                accounts.push(account);
            }
        });

        json.account = accounts;

        fs.writeFile(path.join(__dirname, 'public/data/internal-account.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.end();
            }
        });
    });
});

app.post('/add_account', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/internal-account.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        let newAccount = {
            "id": parseInt(json.account[json.account.length-1].id) + 1,
            "name": req.body.name,
            "amount": 0,
            "transferScore": 0.1,
            "clickScore": 0.1
        }

        json.account.push(newAccount);

        fs.writeFile(path.join(__dirname, 'public/data/internal-account.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.json({id: newAccount.id});
            }
        });
    });
})

app.post('/feature/update_score', function (req, res) {

    fs.readFile(path.join(__dirname, 'public/data/scores.json'), 'utf8', (err, data) => {
        const json = JSON.parse(data);

        for(let i = 0; i < json.feature.length; i++){
            if(json.feature[i].name === req.body.name){
                json.feature[i].score = json.feature[i].score + (1 - json.feature[i].score) * PK_new;
            }
        }

        fs.writeFile(path.join(__dirname, 'public/data/scores.json'), JSON.stringify(json), function(err) {
            if (err) {
                return console.error(err);
            } else {
                res.json({score: json.feature});
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
