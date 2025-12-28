importScripts('https://cdn.jsdelivr.net/npm/openpgp@6.3.0/dist/openpgp.min.js');

self.onmessage = async function handleMessageFromMain(msg) {

    try {
        const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
            type: msg.data.optionsTypeValue, // Type of the key, defaults to ECC
            curve: 'curve25519', // ECC curve name, defaults to curve25519
            rsaBits: parseInt(msg.data.optionsKeySizeValue),
            userIDs: [{ name: msg.data.optionsNameValue, email: msg.data.optionsEmailValue }], // you can pass multiple user IDs
            passphrase: msg.data.optionsPassphraseValue, // protects the private key
            keyExpirationTime: parseInt(msg.data.optionsExpirationTimeValue),
            format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
        });

        postMessage({ privateKey, publicKey, revocationCertificate });
    } catch (error) {
        postMessage({ error: error.message });
    }

};
