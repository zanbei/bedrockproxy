export const handler = async (event) => {
    try {
        // 详细的日志记录
        //console.log('Event received:', JSON.stringify(event, null, 2));

        if (!event.Records?.[0]?.cf?.request) {
            throw new Error('Invalid event structure: missing request object');
        }

        const request = event.Records[0].cf.request;
        const headers = request.headers;
        const authHeader = headers.authorization?.[0]?.value;
        // 获取 X-Forwarded-For 头部
        const xForwardedFor = headers['x-forwarded-for']?.[0]?.value;

        console.log('Original headers:', JSON.stringify(request.headers, null, 2));

        // 添加源 IP 地址限制
        const allowedIps = []; // 示例允许的 IP 地址
        if (xForwardedFor && !allowedIps.includes(xForwardedFor.split(',')[0].trim())) {
            console.log('Forbidden IP:', xForwardedFor);
            return {
                status: '403',
                statusDescription: 'Forbidden',
                headers: {
                    'content-type': [{ value: 'text/plain' }]
                },
                body: 'Access denied due to IP restriction.'
            };
        }
        
        if (!authHeader) {
            return request;
        }

        // 解析区域信息
        const credentialMatch = authHeader.match(/Credential=([^/]+)\/([^/]+)\/([^/]+)/);
        if (!credentialMatch || !credentialMatch[3]) {
            console.log('No region found in Authorization header');
            return request;
        }

        const region = credentialMatch[3];

        // 验证区域
        const validRegions = ['us-east-1', 'us-west-2', 'ap-northeast-1', 'eu-west-1'];
        if (!validRegions.includes(region)) {
            console.log('Invalid region:', region);
            return request;
        }

        // 记录原始请求头
        //console.log('Original headers:', JSON.stringify(request.headers, null, 2));

        // 安全地删除 header
        if (request.headers && request.headers['x-forwarded-for']) {
            console.log('Removing x-forwarded-for header');
            delete request.headers['x-forwarded-for'];
        }
        
        request.headers['user-agent'] = [{
            key: 'User-Agent',
            value: `cloudfront`
        }];


        // 设置新的源域名
        request.origin = {
            custom: {
                domainName: `bedrock-runtime.${region}.amazonaws.com`,
                port: 443,
                protocol: 'https',
                sslProtocols: ['TLSv1.2'],
                readTimeout: 60,
                keepaliveTimeout: 5,
                customHeaders: {}
            }
        };

        // 如果需要修改 host header 以匹配新的源

        // 记录修改后的请求头和源信息
        //console.log('Modified headers:', JSON.stringify(request.headers, null, 2));
        //console.log('New origin:', JSON.stringify(request.origin, null, 2));

        return request;
    } catch (error) {
        console.error('Error in handler:', error);
        throw error;
    }
};
