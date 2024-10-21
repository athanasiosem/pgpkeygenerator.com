(async () => {

    importScripts('https://cdn.jsdelivr.net/npm/openpgp@5.11.2/dist/openpgp.min.js');

    self.onmessage = async function handleMessageFromMain(msg) {

        const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
            type: msg.data.optionsTypeValue, // Type of the key, defaults to ECC
            curve: 'curve25519', // ECC curve name, defaults to curve25519
            rsaBits: msg.data.optionsKeySizeValue,
            userIDs: [{ name: msg.data.optionsNameValue, email: msg.data.optionsEmailValue }], // you can pass multiple user IDs
            passphrase: msg.data.optionsPassphraseValue, // protects the private key
            keyExpirationTime: msg.data.optionsExpirationTimeValue,
            format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
        });

        postMessage({ privateKey, publicKey, revocationCertificate });

    };

})();
