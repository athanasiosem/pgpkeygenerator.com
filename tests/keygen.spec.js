import { test, expect } from '@playwright/test';

test.describe('PGP Key Generation', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('generates ECC keys', async ({ page }) => {
        await page.selectOption('#options-type', 'ecc');
        await page.fill('#options-name', 'Test User');
        await page.fill('#options-email', 'test@example.com');
        await page.click('#generate-keys-button');

        await expect(page.locator('#private-key-textarea')).not.toHaveValue('', { timeout: 30000 });

        const privateKey = await page.inputValue('#private-key-textarea');
        const publicKey = await page.inputValue('#public-key-textarea');
        const revocationCert = await page.inputValue('#revocation-certificate-textarea');

        expect(privateKey).toContain('-----BEGIN PGP PRIVATE KEY BLOCK-----');
        expect(publicKey).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
        expect(revocationCert).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    });

    test('generates RSA keys', async ({ page }) => {
        await page.selectOption('#options-type', 'rsa');
        await page.fill('#options-name', 'Test User');
        await page.fill('#options-email', 'test@example.com');
        await page.click('#generate-keys-button');

        await expect(page.locator('#private-key-textarea')).not.toHaveValue('', { timeout: 60000 });

        const privateKey = await page.inputValue('#private-key-textarea');
        const publicKey = await page.inputValue('#public-key-textarea');
        const revocationCert = await page.inputValue('#revocation-certificate-textarea');

        expect(privateKey).toContain('-----BEGIN PGP PRIVATE KEY BLOCK-----');
        expect(publicKey).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
        expect(revocationCert).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    });

    test('generates keys without a name', async ({ page }) => {
        await page.fill('#options-email', 'test@example.com');
        await page.click('#generate-keys-button');

        await expect(page.locator('#private-key-textarea')).not.toHaveValue('', { timeout: 30000 });

        const privateKey = await page.inputValue('#private-key-textarea');
        expect(privateKey).toContain('-----BEGIN PGP PRIVATE KEY BLOCK-----');
    });

    test('shows error for invalid email', async ({ page }) => {
        await page.fill('#options-name', 'Test User');
        await page.fill('#options-email', 'not-an-email');
        await page.click('#generate-keys-button');

        await expect(page.locator('#error-message')).toBeVisible();
    });

    test('enables copy and download buttons after generation', async ({ page }) => {
        await page.fill('#options-name', 'Test User');
        await page.fill('#options-email', 'test@example.com');
        await page.click('#generate-keys-button');

        await expect(page.locator('#private-key-textarea')).not.toHaveValue('', { timeout: 30000 });

        await expect(page.locator('#copy-private-key-button')).toBeEnabled();
        await expect(page.locator('#copy-public-key-button')).toBeEnabled();
        await expect(page.locator('#copy-revocation-certificate-button')).toBeEnabled();
        await expect(page.locator('#download-private-key-button')).toBeEnabled();
        await expect(page.locator('#download-public-key-button')).toBeEnabled();
        await expect(page.locator('#download-revocation-certificate-button')).toBeEnabled();
    });

    test('clears error on new generation attempt', async ({ page }) => {
        await page.fill('#options-email', 'not-an-email');
        await page.click('#generate-keys-button');
        await expect(page.locator('#error-message')).toBeVisible();

        await page.fill('#options-email', 'test@example.com');
        await page.click('#generate-keys-button');
        await expect(page.locator('#error-message')).toBeHidden();
    });

});
