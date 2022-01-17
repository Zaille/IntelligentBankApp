// Utility function for lazy loading of templates
const templates = (() => {
    let templates = {};
    return function load(url) {
            if (templates[url]) {
            return Promise.resolve(templates[url]); // systeme de caching
        } else {
            return fetch(url)
                .then(res => res.text())
                .then(text => {
                    return templates[url] = text;
                });

        }
    };
})();


// fonction utilitaire de rendu d'un template
const renderTemplate = async function (template) {
    // On rend le template
    const rendered = Mustache.render(await template);

    // Et on l'insère dans le body
    let body = document.querySelector('body');
    body.innerHTML = rendered;
};

/********** PAGE **********/

page('/', async () => {
    await renderTemplate(templates('/templates/home.mustache'));

    let bAccount = document.createElement("button");
    bAccount.innerHTML = "Accounts";
    bAccount.id = "button-accounts";

    let bContact = document.createElement("button");
    bContact.innerHTML = "Contacts";
    bContact.id = "button-contacts";

    const button = {
        "account": bAccount,
        "contact": bContact
    }

    let result = await fetch('/feature/score', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let features = await result.json();

    features.sort((a, b) => {
        return a.score < b.score;
    });

    features.forEach((feature) => {
        document.getElementById('div-feature').appendChild(button[feature.name]);
    });

    document.getElementById('div-account').onclick = () => {
        page.redirect('/account/1');
    }

    document.getElementById('button-contacts').onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: "contact",
            })
        };

        await fetch('/feature/update_score', requestOptions);

        page.redirect('/contact');
    }

    document.getElementById('button-accounts').onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: "account",
            })
        };

        await fetch('/feature/update_score', requestOptions);

        page.redirect('/account');
    }

    result = await fetch('/accounts/1', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let account = await result.json();
    document.getElementById("p-amount").innerHTML = account.amount + '€';
});

page('/contact', async () => {
    await renderTemplate(templates('/templates/list.mustache'));

    document.getElementById('h2-list').innerHTML = "List of Beneficiaries";

    document.getElementById('button-create').onclick = () => {
        page.redirect('/new-contact');
    }

    document.getElementById("button-return").onclick = () => {
        page.redirect('/');
    }

    let result = await fetch('/contacts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });
    let contacts = await result.json();

    const search = document.getElementById('input-search');

    let contact_list = [];

    search.oninput = async () => {
        contact_list = [];

        if (search.value.length > 3) { // If the user has typed more than 4 characters: Start the name search
            const requestOptions = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    string: search.value,
                })
            };

            result = await fetch('/search/update_score', requestOptions);

            const search_score = await result.json();

            result = await fetch('/contacts/score', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                },
                method: 'GET',
            });
            let contacts_scores = await result.json();

            contacts.forEach((contact) => {
                if(contact.firstName.toLowerCase().indexOf(search.value.toLowerCase()) === 0 || contact.lastName.toLowerCase().indexOf(search.value.toLowerCase()) === 0) {
                    contacts_scores.forEach((score) => {
                        if(contact.id === score.id){
                            const confidence = parseFloat(search_score) * parseFloat(score.transferScore);
                            if(confidence > 0.3) {
                                contact_list.push({
                                    id: contact.id,
                                    firstname: contact.firstName,
                                    lastname: contact.lastName,
                                    confidence: confidence
                                });
                            }
                        }
                    })
                }
            });

            contact_list.sort((a, b) => {
                return a.confidence < b.confidence;
            })

            document.getElementById('list').innerHTML = '';

            contact_list.forEach((contact) => {
                const div = document.createElement("div");

                const p = document.createElement("p");

                div.onclick = async () => {
                    const requestOptions = {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            id: contact.id,
                            score: "searchScore"
                        })
                    };

                    await fetch('/contact/update_score', requestOptions);

                    page.redirect('/contact/' + contact.id);
                }


                p.innerHTML = `${contact.firstname} ${contact.lastname}`;
                document.getElementById("list").appendChild(div).appendChild(p);
            });
        } else {
            document.getElementById('list').innerHTML = '';

            result = await fetch('/contacts/score', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                },
                method: 'GET',
            });
            let contacts_scores = await result.json();

            contacts.forEach((contact) => {
                contacts_scores.forEach((score) => {
                    if(contact.id === score.id){
                        const confidence = parseFloat(score.transferScore) * parseFloat(score.searchScore);
                        contact_list.push({
                            id: contact.id,
                            firstname: contact.firstName,
                            lastname: contact.lastName,
                            confidence: confidence
                        });
                    }
                })
            });

            contact_list.sort((a, b) => {
                return a.confidence < b.confidence;
            })

            contact_list.forEach((contact) => {
                const div = document.createElement("div");
                const p = document.createElement("p");

                div.onclick = () => {
                    page.redirect('/contact/' + contact.id);
                }

                p.innerHTML = `${contact.firstname} ${contact.lastname}`;
                document.getElementById("list").appendChild(div).appendChild(p);
            })
        }
    }

    result = await fetch('/contacts/score', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });
    let contacts_scores = await result.json();

    contacts.forEach((contact) => {
        contacts_scores.forEach((score) => {
            if(contact.id === score.id){
                const confidence = parseFloat(score.transferScore) * parseFloat(score.searchScore);
                contact_list.push({
                    id: contact.id,
                    firstname: contact.firstName,
                    lastname: contact.lastName,
                    confidence: confidence
                });
            }
        })
    });

    contact_list.sort((a, b) => {
        return a.confidence < b.confidence;
    })

    contact_list.forEach((contact) => {
        const div = document.createElement("div");
        div.classList.add("elmt");
        const p = document.createElement("p");

        div.onclick = () => {
            page.redirect('/contact/' + contact.id);
        }

        p.innerHTML = `${contact.firstname} ${contact.lastname}`;
        document.getElementById("list").appendChild(div).appendChild(p);
    })
});

page('/contact/:contact_id', async (req) => {
    await renderTemplate(templates('/templates/profile.mustache'));

    const firstname = document.getElementById("input-1");
    const lastname = document.getElementById("input-2");
    const iban = document.getElementById("input-3");
    const edit = document.getElementById("div-edit");
    const button = document.getElementById("div-button");

    document.getElementById("label-1").innerHTML = "First name:";
    document.getElementById("label-2").innerHTML = "Last name:";
    document.getElementById("label-3").innerHTML = "IBAN:";

    firstname.readOnly = true;
    lastname.readOnly = true;
    iban.readOnly = true;

    edit.hidden = true;

    document.getElementById("button-remove").onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: req.params.contact_id,
            })
        };

        await fetch('/remove_contact', requestOptions);

        page.redirect('/contact');
    }

    document.getElementById("button-transfer").onclick = () => {
        page.redirect('/external_transfer/' + req.params.contact_id);
    }

    document.getElementById("button-edit").onclick = () => {
        firstname.readOnly = false;
        lastname.readOnly = false;
        iban.readOnly = false;

        edit.hidden = false;
        button.hidden = true;
    }

    document.getElementById("button-return").onclick = () => {
        page.redirect('/contact');
    }

    document.getElementById("button-validate").onclick = async () => {
        firstname.readOnly = true;
        lastname.readOnly = true;
        iban.readOnly = true;

        edit.hidden = true;
        button.hidden = false;

        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: req.params.contact_id,
                firstname: firstname.value,
                lastname: lastname.value,
                iban: iban.value
            })
        };

        await fetch('/update_contact', requestOptions);
    }

    document.getElementById("button-cancel").onclick = () => {
        firstname.readOnly = true;
        lastname.readOnly = true;
        iban.readOnly = true;

        edit.hidden = true;
        button.hidden = false;

        //TODO : Reprendre l'ancienne valeur
    }

    const result = await fetch('/profile/' + req.params.contact_id, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let contact = await result.json();

    firstname.value = contact.firstName;
    lastname.value = contact.lastName;
    iban.value = contact.IBAN;
});

page('/new-contact', async () => {
    await renderTemplate(templates('/templates/profile.mustache'));

    document.getElementById("div-button").hidden = true;

    document.getElementById("label-1").innerHTML = "First Name:";
    document.getElementById("label-2").innerHTML = "Last Name:";
    document.getElementById("label-3").innerHTML = "IBAN:";

    document.getElementById("button-validate").onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstname: document.getElementById("input-1").value,
                lastname: document.getElementById("input-2").value,
                iban: document.getElementById("input-3").value
            })
        };

        const result = await fetch('/add_contact', requestOptions);

        let json = await result.json();
        page.redirect('/contact/' + json.id);
    }

    document.getElementById("button-cancel").onclick = () => {
        page.redirect('/contact')
    }
});

page('/external_transfer/:contact_id', async (req) => {
    await renderTemplate(templates('/templates/transfer.mustache'));

    document.getElementById('div-account').hidden = true;

    const result = await fetch('/profile/' + req.params.contact_id, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let contact = await result.json();

    document.getElementById('input-beneficiary').value = `${contact.firstName} ${contact.lastName}`;

    document.getElementById("button-validate").onclick = async () => {
        const amount = document.getElementById("input-amount");

        let requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                type: "deduct",
                amount: (amount.value ? amount.value : amount.placeholder)
            })
        };

        await fetch('/update_amount', requestOptions);

        requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                score: "transferScore"
            })
        };

        await fetch('/account/update_score', requestOptions);

        requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: req.params.contact_id,
                score: "transferScore"
            })
        };

        await fetch('/contact/update_score', requestOptions);

        page.redirect('/');
    }

    document.getElementById("button-cancel").onclick = () => {
        page.redirect('/contact/' + req.params.contact_id);
    }
});

page('/account', async () => {
    await renderTemplate(templates('templates/list.mustache'));

    document.getElementById('h2-list').innerHTML = "List of Accounts";

    document.getElementById('div-search').hidden = true;

    document.getElementById('button-create').onclick = () => {
        page.redirect('/new-account');
    }

    document.getElementById("button-return").onclick = () => {
        page.redirect('/');
    }

    let result = await fetch('/accounts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let accounts = await result.json();

    result = await fetch('/account/score', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let accounts_scores = await result.json();

    let account_list = [];

    accounts.forEach((account) => {
        accounts_scores.forEach((score) => {
            if(account.id === score.id){
                const confidence = parseFloat(score.transferScore) * parseFloat(score.clickScore);
                account_list.push({
                    id: account.id,
                    name: account.name,
                    amount: account.amount,
                    confidence: confidence
                });
            }
        })
    });

    account_list.sort((a, b) => {
        return a.confidence < b.confidence;
    })

    account_list.forEach((account) => {
        const div = document.createElement("div");
        div.classList.add("elmt");
        const p = document.createElement("p");

        div.onclick = async () => {
            requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: account.id,
                    score: "clickScore"
                })
            };

            await fetch('/account/update_score', requestOptions);

            page.redirect('/account/' + account.id);
        }

        p.innerHTML = `${account.name} - ${account.amount}€`;
        document.getElementById("list").appendChild(div).appendChild(p);
    })
});

page('/account/:account_id', async (req) => {
    await renderTemplate(templates('/templates/profile.mustache'));

    const name = document.getElementById("input-1");
    const amount = document.getElementById("input-2");
    const edit = document.getElementById("div-edit");
    const button = document.getElementById("div-button");

    document.getElementById("label-1").innerHTML = "Account:";
    document.getElementById("label-2").innerHTML = "Amount:";
    document.getElementById("div-3").hidden = true;

    name.readOnly = true;
    amount.readOnly = true;

    edit.hidden = true;

    document.getElementById("button-remove").onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: req.params.account_id,
            })
        };

        await fetch('/remove_account', requestOptions);

        page.redirect('/account');
    }

    document.getElementById("button-transfer").onclick = () => {
        page.redirect('/internal_transfer/' + req.params.account_id);
    }

    document.getElementById("button-edit").onclick = () => {
        name.readOnly = false;

        edit.hidden = false;
        button.hidden = true;
    }

    document.getElementById("button-return").onclick = () => {
        page.redirect('/account');
    }

    document.getElementById("button-validate").onclick = async () => {
        name.readOnly = true;

        edit.hidden = true;
        button.hidden = false;

        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: req.params.account_id,
                name: name.value
            })
        };

        await fetch('/update_account', requestOptions);
    }

    document.getElementById("button-cancel").onclick = () => {
        name.readOnly = true;

        edit.hidden = true;
        button.hidden = false;
    }

    const result = await fetch('/accounts/' + req.params.account_id, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let account = await result.json();

    name.value = account.name;
    amount.value = account.amount;
});

page('/new-account', async () => {
    await renderTemplate(templates('/templates/profile.mustache'));

    document.getElementById("div-button").hidden = true;

    document.getElementById("label-1").innerHTML = "Account:";
    document.getElementById("div-2").hidden = true;
    document.getElementById("div-3").hidden = true;

    document.getElementById("button-validate").onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById("input-1").value,
            })
        };

        const result = await fetch('/add_account', requestOptions);

        let json = await result.json();
            page.redirect('/account/' + json.id);
    }

    document.getElementById("button-cancel").onclick = () => {
        page.redirect('/account')
    }
});

page('/internal_transfer/:account_id', async (req) => {
    await renderTemplate(templates('/templates/transfer.mustache'));

    document.getElementById('div-beneficiary').hidden = true;

    let result = await fetch('/accounts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let accounts = await result.json();

    result = await fetch('/account/score', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let accounts_scores = await result.json();

    let account_list = [];

    accounts.forEach((account) => {
        accounts_scores.forEach((score) => {
            if(account.id === score.id){
                const confidence = parseFloat(score.transferScore) * parseFloat(score.clickScore);
                account_list.push({
                    id: account.id,
                    name: account.name,
                    confidence: confidence
                });
            }
        })
    });

    account_list.sort((a, b) => {
        return a.confidence < b.confidence;
    })

    const select = document.getElementById('select-account');

    account_list.forEach((account) => {
        if(account.id !== parseInt(req.params.account_id)) {
            const option = document.createElement("option");
            option.value = account.id;
            option.innerHTML = account.name;

            select.appendChild(option);
        }
    })

    document.getElementById("button-validate").onclick = async () => {
        const amount = document.getElementById("input-amount");

        let requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: req.params.account_id,
                type: "deduct",
                amount: (amount.value ? amount.value : amount.placeholder)
            })
        };

        await fetch('/update_amount', requestOptions);

        const idx = select.selectedIndex;
        const id = document.getElementsByTagName("option")[idx].value;

        requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                type: "add",
                amount: (amount.value ? amount.value : amount.placeholder)
            })
        };

        await fetch('/update_amount', requestOptions);

        requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: req.params.account_id,
                score: "transferScore"
            })
        };

        await fetch('/account/update_score', requestOptions);

        requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                score: "transferScore"
            })
        };

        await fetch('/account/update_score', requestOptions);

        page.redirect('/account');
    }

    document.getElementById("button-cancel").onclick = () => {
        page.redirect('/account/' + req.params.account_id);
    }
});

/* -------- Error 404 -------- */

page('*', '/');

/* -------- Lancement de Page -------- */

page();
