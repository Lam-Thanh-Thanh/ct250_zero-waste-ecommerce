const crypto = require('crypto');

/**
 * MoMo Payment Service
 * Tích hợp thanh toán qua ví MoMo (Sandbox/Production)
 * 
 * API docs: https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime
 * Sử dụng HMAC-SHA256 cho chữ ký
 */
class MoMoService {
    get partnerCode() { return process.env.MOMO_PARTNER_CODE; }
    get accessKey() { return process.env.MOMO_ACCESS_KEY; }
    get secretKey() { return process.env.MOMO_SECRET_KEY; }
    get apiEndpoint() { return process.env.MOMO_API_ENDPOINT || 'https://test-payment.momo.vn'; }
    get redirectUrl() { return process.env.MOMO_REDIRECT_URL; }
    get ipnUrl() { return process.env.MOMO_IPN_URL; }

    /**
     * Tạo URL thanh toán MoMo
     * @param {String} orderId - Mã đơn hàng (unique)
     * @param {Number} amount - Số tiền (VND, số nguyên)
     * @param {String} orderInfo - Mô tả đơn hàng
     * @returns {Object} - { payUrl, deeplink, qrCodeUrl }
     */
    async createPaymentUrl(orderId, amount, orderInfo) {
        const requestId = `${this.partnerCode}_${Date.now()}`;
        const requestType = 'captureWallet';
        const extraData = ''; // base64 encoded JSON nếu cần

        // Tạo raw signature string theo thứ tự MoMo quy định
        const rawSignature = [
            `accessKey=${this.accessKey}`,
            `amount=${amount}`,
            `extraData=${extraData}`,
            `ipnUrl=${this.ipnUrl}`,
            `orderId=${orderId}`,
            `orderInfo=${orderInfo}`,
            `partnerCode=${this.partnerCode}`,
            `redirectUrl=${this.redirectUrl}`,
            `requestId=${requestId}`,
            `requestType=${requestType}`
        ].join('&');

        // Tạo chữ ký HMAC-SHA256
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(rawSignature)
            .digest('hex');

        // Build request body
        const requestBody = {
            partnerCode: this.partnerCode,
            accessKey: this.accessKey,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: this.redirectUrl,
            ipnUrl: this.ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: 'vi'
        };

        // Gọi MoMo API
        const response = await fetch(`${this.apiEndpoint}/v2/gateway/api/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.resultCode !== 0) {
            throw new Error(data.message || `MoMo Error: resultCode ${data.resultCode}`);
        }

        return {
            payUrl: data.payUrl,
            deeplink: data.deeplink,
            qrCodeUrl: data.qrCodeUrl,
            requestId: requestId
        };
    }

    /**
     * Xác thực chữ ký IPN/Redirect từ MoMo
     * @param {Object} params - Params MoMo trả về
     * @returns {Boolean} - Chữ ký có hợp lệ không
     */
    verifySignature(params) {
        const {
            accessKey = this.accessKey,
            amount,
            extraData,
            message,
            orderId,
            orderInfo,
            orderType,
            partnerCode,
            payType,
            requestId,
            responseTime,
            resultCode,
            transId
        } = params;

        const rawSignature = [
            `accessKey=${accessKey}`,
            `amount=${amount}`,
            `extraData=${extraData}`,
            `message=${message}`,
            `orderId=${orderId}`,
            `orderInfo=${orderInfo}`,
            `orderType=${orderType}`,
            `partnerCode=${partnerCode}`,
            `payType=${payType}`,
            `requestId=${requestId}`,
            `responseTime=${responseTime}`,
            `resultCode=${resultCode}`,
            `transId=${transId}`
        ].join('&');

        const expectedSignature = crypto
            .createHmac('sha256', this.secretKey)
            .update(rawSignature)
            .digest('hex');

        return expectedSignature === params.signature;
    }
}

module.exports = new MoMoService();
