const getChallenge = (username) => {
    return new Promise(resolve => {
        fetch(url + "api/auth/challenge?" + new URLSearchParams({
            username: username
        }), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.status == 200) {
                response.json().then(res => {
                    resolve(res.challenge);
                });
            } else {
                console.log("Could not get challenge");
                resolve(null);
            }
            
        }).catch(e => {
            console.log(e);
            resolve(null);
        });
    });
}