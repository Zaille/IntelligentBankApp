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
    document.getElementById('button-contacts').onclick = () => {
        page.redirect('/contact');
    }

    document.getElementById('button-accounts').onclick = () => {
        page.redirect('/account');
    }

    const result = await fetch('/accounts/1', {
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

    const result = await fetch('/contacts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });
    let contacts = await result.json();

    contacts.forEach((contact) => {
        const div = document.createElement("div");
        const p = document.createElement("p");

        div.onclick = () => {
            page.redirect('/contact/' + contact.id);
        }

        p.innerHTML = `${contact.firstName} ${contact.lastName}`;
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

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                type: "deduct",
                amount: (amount.value ? amount.value : amount.placeholder)
            })
        };

        await fetch('/update_amount', requestOptions);

        page.redirect('/');
    }

    document.getElementById("button-cancel").onclick = () => {
        page.redirect('/contact/' + req.params.contact_id);
    }
});

page('/account', async () => {
    await renderTemplate(templates('templates/list.mustache'));

    document.getElementById('h2-list').innerHTML = "List of Accounts";

    document.getElementById('button-create').onclick = () => {
        page.redirect('/new-account');
    }

    document.getElementById("button-return").onclick = () => {
        page.redirect('/');
    }

    const result = await fetch('/accounts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });
    let accounts = await result.json();

    accounts.forEach((account) => {
        const div = document.createElement("div");
        const p = document.createElement("p");

        div.onclick = () => {
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

    const result = await fetch('/accounts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let accounts = await result.json();

    const select = document.getElementById('select-account');

    accounts.forEach((account) => {
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
