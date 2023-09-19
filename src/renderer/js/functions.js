const getNewAesKey = () => {
    return forge.random.getBytesSync(32).toString();
};

const publicKeyEncrypt64 = (message, publicKeyPem) => {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encryptedMessage = publicKey.encrypt(message, 'RSA-OAEP');
    return forge.util.encode64(encryptedMessage);
};

const privateKeyDecrypt64 = (message64) => {
    const message = forge.util.decode64(message64);
    return privateKey.decrypt(message, 'RSA-OAEP');
};

const getUserFromAddress = (address) => {
    let username, serverAddress;
    
    if (address.includes("@")) {
        const arr = address.split("@");
        if (arr.length != 2) {
            return null;
        }
        username = arr[0];
        serverAddress = 'http://' + arr[1] + '/';

    } else {
        username = address;
        serverAddress = url;
    }

    return new User(username, serverAddress);
}

const userIsMe = (user) => {
    if(user.username === me.username && user.serverAddress === me.serverAddress) return true;
    return false;
}