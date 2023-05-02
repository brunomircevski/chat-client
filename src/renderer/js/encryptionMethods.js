
const encrypt = (message, key) => {
    return aes256.encrypt(key, message);
}

const decrypt = (encrypted, key) => {
    return aes256.decrypt(key, encrypted);
}
