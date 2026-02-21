const privateKeyTextarea = document.querySelector("#private-key-textarea");
const publicKeyTextarea = document.querySelector("#public-key-textarea");
const revocationCertificateTextarea = document.querySelector("#revocation-certificate-textarea");

const buttonGenerateKeys = document.querySelector("#generate-keys-button");
const optionsType = document.querySelector("#options-type");
const keySizeSelectHolder = document.querySelector("#key-size-select-holder");
const optionsKeySize = document.querySelector("#options-key-size");
const optionsName = document.querySelector("#options-name");
const optionsEmail = document.querySelector("#options-email");
const optionsPassphrase = document.querySelector("#options-passphrase");
const optionsExpirationTime = document.querySelector("#options-expiration");

const copyPrivateKeyButton = document.querySelector("#copy-private-key-button");
const copyPublicKeyButton = document.querySelector("#copy-public-key-button");
const copyRevocationCertificateButton = document.querySelector("#copy-revocation-certificate-button");

const downloadPrivateKeyButton = document.querySelector("#download-private-key-button");
const downloadPublicKeyButton = document.querySelector("#download-public-key-button");
const downloadRevocationCertificateButton = document.querySelector("#download-revocation-certificate-button");
const errorMessage = document.querySelector("#error-message");

const showError = (msg) => {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
};

const clearError = () => {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
};

const downloadFile = (element) => {

    const textareaName = element.dataset.target;

    const link = document.createElement("a");
    const content = document.querySelector("#" + textareaName).value;
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = textareaName.replace("-textarea", "") + ".asc";
    link.click();
    URL.revokeObjectURL(link.href);
};

const copyToClipboard = (element) => {

    const textareaName = element.dataset.target;

    const textarea = document.querySelector("#" + textareaName);

    navigator.clipboard.writeText(textarea.value).then(() => {
        const originalText = element.innerText;
        element.innerText = "Copied!";
        setTimeout(() => {
            element.innerText = originalText;
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy: ", err);
    });
}

const keyAlgorithmChanged = (element) => {

    if (element.value == "rsa") {
        keySizeSelectHolder.classList.remove("key-size-select-holder");
    } else {
        keySizeSelectHolder.classList.add("key-size-select-holder");
    }
};

const worker = new Worker("worker.js");

worker.onerror = (error) => {
    console.error("Worker error:", error);
    showError("An error occurred with the background worker. Please reload the page.");
    buttonGenerateKeys.disabled = false;
    buttonGenerateKeys.innerText = "Generate Keys";
};

// Pending resolver for MCP tool calls that need to await key generation
let _mcpPendingResolve = null;
let _mcpPendingReject = null;

worker.onmessage = async function handleMessageFromMain(msg) {

    if (msg.data.error) {
        if (_mcpPendingReject) {
            const reject = _mcpPendingReject;
            _mcpPendingResolve = null;
            _mcpPendingReject = null;
            reject(new Error(msg.data.error));
        } else {
            showError("Error generating keys: " + msg.data.error);
        }
        buttonGenerateKeys.disabled = false;
        buttonGenerateKeys.innerText = "Generate Keys";
        return;
    }

    privateKeyTextarea.value = msg.data.privateKey;
    publicKeyTextarea.value = msg.data.publicKey;
    revocationCertificateTextarea.value = msg.data.revocationCertificate;

    copyPrivateKeyButton.classList.add("copy-button");
    copyPublicKeyButton.classList.add("copy-button");
    copyRevocationCertificateButton.classList.add("copy-button");

    downloadPrivateKeyButton.classList.add("download-button");
    downloadPublicKeyButton.classList.add("download-button");
    downloadRevocationCertificateButton.classList.add("download-button");

    buttonGenerateKeys.disabled = false;
    buttonGenerateKeys.innerText = "Generate Keys";

    copyPrivateKeyButton.disabled = false;
    copyPublicKeyButton.disabled = false;
    copyRevocationCertificateButton.disabled = false;

    downloadPrivateKeyButton.disabled = false;
    downloadPublicKeyButton.disabled = false;
    downloadRevocationCertificateButton.disabled = false;

    privateKeyTextarea.disabled = false;
    publicKeyTextarea.disabled = false;
    revocationCertificateTextarea.disabled = false;

    // Resolve MCP tool call if one is pending
    if (_mcpPendingResolve) {
        const resolve = _mcpPendingResolve;
        _mcpPendingResolve = null;
        _mcpPendingReject = null;
        resolve({
            privateKey: msg.data.privateKey,
            publicKey: msg.data.publicKey,
            revocationCertificate: msg.data.revocationCertificate
        });
    }
};

const generateKeys = () => {

    const optionsTypeValue = optionsType.value;
    const optionsKeySizeValue = optionsKeySize.value;
    const optionsNameValue = optionsName.value.trim();
    const optionsEmailValue = optionsEmail.value.trim();
    const optionsPassphraseValue = optionsPassphrase.value;
    const optionsExpirationTimeValue = optionsExpirationTime.value;

    const optionsObject = {
        optionsTypeValue,
        optionsKeySizeValue, optionsNameValue,
        optionsEmailValue, optionsPassphraseValue,
        optionsExpirationTimeValue
    };

    if (!optionsEmail.checkValidity()) {
        showError("Please enter a valid email address.");
        return;
    }

    clearError();

    copyPrivateKeyButton.classList.remove("copy-button");
    copyPublicKeyButton.classList.remove("copy-button");
    copyRevocationCertificateButton.classList.remove("copy-button");

    downloadPrivateKeyButton.classList.remove("download-button");
    downloadPublicKeyButton.classList.remove("download-button");
    downloadRevocationCertificateButton.classList.remove("download-button");

    buttonGenerateKeys.disabled = true;
    buttonGenerateKeys.innerText = "Generating...";

    copyPrivateKeyButton.disabled = true;
    copyPublicKeyButton.disabled = true;
    copyRevocationCertificateButton.disabled = true;
    downloadPrivateKeyButton.disabled = true;
    downloadPublicKeyButton.disabled = true;
    downloadRevocationCertificateButton.disabled = true;

    worker.postMessage(optionsObject);

};

// ── Event listeners ────────────────────────────────────────────────────────
buttonGenerateKeys.addEventListener("click", generateKeys);
optionsType.addEventListener("change", function () { keyAlgorithmChanged(this); });

copyPrivateKeyButton.addEventListener("click", function () { copyToClipboard(this); });
copyPublicKeyButton.addEventListener("click", function () { copyToClipboard(this); });
copyRevocationCertificateButton.addEventListener("click", function () { copyToClipboard(this); });

downloadPrivateKeyButton.addEventListener("click", function () { downloadFile(this); });
downloadPublicKeyButton.addEventListener("click", function () { downloadFile(this); });
downloadRevocationCertificateButton.addEventListener("click", function () { downloadFile(this); });

// ── WebMCP (Chrome Canary navigator.modelContext) ──────────────────────────
// Registers a generate_pgp_keys tool so in-browser AI agents can call it.
// Gracefully does nothing on browsers that don't support the API yet.
if (typeof navigator !== 'undefined' && navigator.modelContext) {
    navigator.modelContext.registerTool({
        name: 'generate_pgp_keys',
        description: 'Generate a PGP key pair (private key, public key, and revocation certificate) using OpenPGP.js. All computation happens client-side in the browser.',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Full name for the PGP user ID (e.g. "Alice Smith")'
                },
                email: {
                    type: 'string',
                    description: 'Email address for the PGP user ID (e.g. "alice@example.com")'
                },
                type: {
                    type: 'string',
                    enum: ['ecc', 'rsa'],
                    description: 'Key algorithm. "ecc" uses Curve25519 (modern, fast, recommended). "rsa" uses RSA. Defaults to "ecc".'
                },
                keySize: {
                    type: 'number',
                    enum: [2048, 4096],
                    description: 'RSA key size in bits. Only used when type is "rsa". Defaults to 4096.'
                },
                passphrase: {
                    type: 'string',
                    description: 'Optional passphrase to protect the private key. Leave empty for no passphrase.'
                },
                expirationTime: {
                    type: 'number',
                    description: 'Key expiration time in seconds from now. Use 0 for no expiration. Common values: 31536000 (1 year), 63072000 (2 years). Defaults to 0.'
                }
            },
            required: ['name', 'email']
        },
        execute: async (args) => {
            const {
                name,
                email,
                type = 'ecc',
                keySize = 4096,
                passphrase = '',
                expirationTime = 0
            } = args;

            // Populate the form fields so the UI reflects the generation
            optionsName.value = name;
            optionsEmail.value = email;
            optionsType.value = type;
            keyAlgorithmChanged(optionsType);
            optionsKeySize.value = String(keySize);
            optionsPassphrase.value = passphrase;
            optionsExpirationTime.value = String(expirationTime);

            // Trigger key generation and await the worker result via Promise
            const result = await new Promise((resolve, reject) => {
                _mcpPendingResolve = resolve;
                _mcpPendingReject = reject;
                generateKeys();
            });

            return {
                content: [{
                    type: 'text',
                    text: [
                        '=== Private Key ===',
                        result.privateKey,
                        '',
                        '=== Public Key ===',
                        result.publicKey,
                        '',
                        '=== Revocation Certificate ===',
                        result.revocationCertificate
                    ].join('\n')
                }]
            };
        }
    });
}
