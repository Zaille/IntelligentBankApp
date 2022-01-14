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
});

page('/contact', async () => {
    await renderTemplate(templates('/templates/list.mustache'));

    document.getElementById('h2-list').innerHTML = "List of Beneficiaries";

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

    document.getElementById("button-transfer").onclick = () => {
        page.redirect('/external_transfer/' + req.params.contact_id);
    }

    document.getElementById("button-edit").onclick = () => {

    }

    const result = await fetch('/profile/' + req.params.contact_id, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });

    let contact = await result.json();

    document.getElementById("fname-value").innerHTML = contact.firstName;
    document.getElementById("lname-value").innerHTML = contact.lastName;
    document.getElementById("iban-value").innerHTML = contact.IBAN;
});

page('/external_transfer/:contact_id', async (req) => {
    await renderTemplate(templates('/templates/transfer.mustache'));

    document.getElementById("button-validate").onclick = () => {
        page.redirect('/');
    }

    document.getElementById("button-cancel").onclick = () => {
        page.redirect('/profile/' + req.params.contact_id);
    }
});

page('/account', async () => {
    await renderTemplate(templates('templates/list.mustache'));
});

/* -------- Error 404 -------- */

page('*', '/');

/* -------- Lancement de Page -------- */

page();
