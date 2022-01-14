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
    await renderTemplate(templates('templates/home.mustache'));

    document.getElementById('button-contacts').onclick = () => {
        page.redirect('/contact');
    }

    document.getElementById('button-accounts').onclick = () => {
        page.redirect('/account');
    }
});

page('/contact', async () => {
    await renderTemplate(templates('templates/list.mustache'));
    const result = await fetch('/contacts', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        method: 'GET',
    });
    let contacts = await result.json();

    contacts.forEach((contact) => {
        var div = document.createElement("div");
        var p = document.createElement("p");

        p.innerHTML = `${contact.firstName} ${contact.lastName}`;
        document.getElementById("list").appendChild(div).appendChild(p);
    })
});

page('/account', async () => {
    await renderTemplate(templates('templates/list.mustache'));
});

/* -------- Error 404 -------- */

page('*', '/');

/* -------- Lancement de Page -------- */

page();
