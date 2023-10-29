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
    if (user.username === me.username && user.serverAddress === me.serverAddress) return true;
    return false;
}

const formatDateToTime = (date) => {
    function padTo2Digits(num) {
        return String(num).padStart(2, '0');
    }

    const hoursAndMinutes =
        padTo2Digits(date.getHours()) +
        ':' +
        padTo2Digits(date.getMinutes());

    return hoursAndMinutes;
}

const sameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

const formatDateToLocalDate = (date) => {
    if (sameDay(date, new Date())) return "Today";

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (sameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString('en-us', { weekday: "long", year: "numeric", month: "short", day: "numeric" })
}

function formatDateToDDMMYYYY(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear(); 

    return `${day}-${month}-${year}`;
}