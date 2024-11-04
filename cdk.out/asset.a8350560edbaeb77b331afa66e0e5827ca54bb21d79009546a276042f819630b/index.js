exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    
    // Extract region from Authorization header
    const authHeader = request.headers.authorization[0].value;
    const regionMatch = authHeader.match(/Credential=(?:[^/]+)\/[^/]+\/([^/]+)\/bedrock\/aws4_request/);
    const region = regionMatch ? regionMatch[1] : 'us-east-1';
    
    // Update origin based on region
    request.origin.custom.domainName = `bedrock-runtime.${region}.amazonaws.com`;
    
    // Preserve required headers
    const headersToKeep = [
        'authorization',
        'x-amz-date',
        'x-amz-security-token',
        'host',
        'content-type'
    ];
    
    // Clean up headers
    Object.keys(request.headers).forEach(header => {
        if (!headersToKeep.includes(header.toLowerCase())) {
            delete request.headers[header];
        }
    });
    
    // Set User-Agent
    request.headers['user-agent'] = [{
        key: 'User-Agent',
        value: 'cloudfront'
    }];
    
    return request;
};
