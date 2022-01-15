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

    const result = await fetch('/accounts/main', {
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

    const firstname = document.getElementById("fname-value");
    const lastname = document.getElementById("lname-value");
    const iban = document.getElementById("iban-value");
    const edit = document.getElementById("div-edit");
    const button = document.getElementById("div-button");

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
                firstname: document.getElementById("fname-value").value,
                lastname: document.getElementById("lname-value").value,
                iban: document.getElementById("iban-value").value
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

    document.getElementById("button-validate").onclick = async () => {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstname: document.getElementById("fname-value").value,
                lastname: document.getElementById("lname-value").value,
                iban: document.getElementById("iban-value").value
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
                name: "main",
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
});

/* -------- Error 404 -------- */

page('*', '/');

/* -------- Lancement de Page -------- */

page();
