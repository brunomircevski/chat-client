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