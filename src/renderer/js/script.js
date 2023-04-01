const registrationForm = document.getElementById("registration-form");
const loginForm = document.getElementById("login-form");
const serverURL = "http://localhost:5244/api/";
const output = document.getElementById("output");

registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(serverURL+"Auth/register", {
		method: 'POST',
		headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
		},
        body: JSON.stringify({
            username: e.target[0].value,
            password: e.target[1].value,
            publicKey: "string",
            encryptedPrivateKey: "string"
        }),
	})
    .then(response => {
        if(response.status == 200) {
            response.json().then(r => {
                output.innerText = r.message ? r.message : "";
            });
        } else {
            response.json().then(r => {
                output.innerHTML = "";
                output.innerHTML += r.message ? r.message+"<br>" : "";
                if(r.errors) {
                    output.innerHTML += r.errors.username ? r.errors.username[0]+"<br>" : "";
                    output.innerHTML += r.errors.password ? r.errors.password[0]+"<br>" : "";
                }
            });
        }
    })
	.catch(err => console.error(err));

});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(serverURL+"Auth/login", {
		method: 'POST',
		headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
		},
        body: JSON.stringify({
            username: e.target[0].value,
            password: e.target[1].value,
        }),
	})
    .then(response => {
        if(response.status == 200) {
            response.json().then(r => {
                output.innerText = r.token ? r.token : "";
            });
        } else {
            output.innerHTML = "Password or username is wrong";
        }
    })
	.catch(err => console.error(err));

});