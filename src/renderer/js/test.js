const encryptionPerformanceTest = () => {
    const key = getNewAesKey();
    const messages = [];
    const encrypted = [];
    const decrypted = [];

    for(i = 0; i < 1000; i++) {
        messages.push(forge.util.encode64(forge.random.getBytesSync(750)))
    }

    const t0 = performance.now();

    for(i = 0; i < 1000; i++) {
        encrypted.push(aes256.encrypt(key, messages[i]));
    }

    const t1 = performance.now();

    for(i = 0; i < 1000; i++) {
        decrypted.push(aes256.decrypt(key, encrypted[i]));
    }

    const t2 = performance.now();

    let error = false;
    for(i = 0; i < 1000; i++) {
        if(decrypted[i] != messages[i]) error = true;
    }

    if(error) console.log("FAILED");
    else console.log("PASSED");

    console.log("Encryption time: " + (t1-t0));
    console.log("Decryption time: " + (t2-t1));
    
}

const rsaEncryptionPerformanceTest = () => {
    const messages = [];
    const encrypted = [];
    const decrypted = [];

    for(i = 0; i < 1000; i++) {
        messages.push(getNewAesKey(32));
    }

    const t0 = performance.now();

    for(i = 0; i < 1000; i++) {
        const message = publicKey.encrypt(messages[i], 'RSA-OAEP');
        encrypted.push(forge.util.encode64(message));
    }

    const t1 = performance.now();

    for(i = 0; i < 1000; i++) {
        const message = forge.util.decode64(encrypted[i]);
        decrypted.push(privateKey.decrypt(message, 'RSA-OAEP'));
    }

    const t2 = performance.now();

    let error = false;
    for(i = 0; i < 1000; i++) {
        if(decrypted[i] != messages[i]) error = true;
    }

    if(error) console.log("FAILED");
    else console.log("PASSED");

    console.log("Encryption time: " + (t1-t0));
    console.log("Decryption time: " + (t2-t1));
    
}