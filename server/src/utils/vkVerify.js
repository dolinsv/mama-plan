import crypto from 'crypto';

export const verifyVkInitData = async (initData, appSecret) => {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        const sorted = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(appSecret)
            .digest();

        const computedHash = crypto
            .createHmac('sha256', secretKey)
            .update(sorted)
            .digest('hex');

        if (computedHash !== hash) {
            throw new Error('Invalid signature');
        }

        const userData = JSON.parse(urlParams.get('user'));
        return {
            vkId: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            avatar: userData.photo_200
        };
    } catch (e) {
        console.error('VK verification failed:', e.message);
        throw new Error('Unauthorized');
    }
};