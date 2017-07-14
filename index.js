const msRestAzure = require('ms-rest-azure');
const { URL } = require('url');

const login = async () => {
    console.log('logging in');

    const loginType = process.env.loginType;
    const loginId = process.env.loginId;
    const loginSecret = process.env.loginSecret;

    let response;
    if (loginType === 'sp') {
        // https://github.com/Azure/azure-sdk-for-node/blob/66a255dd882762e93e5b9b92ba63ebb222962d59/runtime/ms-rest-azure/lib/login.js#L414
        response = await msRestAzure.loginWithServicePrincipalSecret(loginId, loginSecret, process.env.loginTenantId);
    } else {
        // https://github.com/Azure/azure-sdk-for-node/blob/66a255dd882762e93e5b9b92ba63ebb222962d59/runtime/ms-rest-azure/index.d.ts#L376
        response = await msRestAzure.loginWithUsernamePassword(loginId, loginSecret, {domain: process.env.loginTenantId});
    }

    console.log('login successful');

    return response;
};

const createOrUpdate = async (credentials) => {
    console.log('creating/updating stream analytics job');

    const url = new URL(
        'https://management.azure.com/' +
        `subscriptions/${process.env.subscriptionId}/` +
        `resourcegroups/${process.env.resourceGroup}/` +
        'providers/Microsoft.StreamAnalytics/' +
        `streamingjobs/${process.env.name}` +
        '?api-version=2015-10-01');

    // see https://github.com/Azure/azure-sdk-for-node/tree/bf6473eae7faca1ca1cf1375ee53c6fc214ca1b1/runtime/ms-rest-azure#using-the-generic-authenticated-azureserviceclient-to-make-custom-requests-to-azure
    const azureServiceClient = new msRestAzure.AzureServiceClient(credentials);

    let options = {
        method: 'PUT',
        url: url.href,
        body:{
            location: process.env.location,
            properties: {
                sku: {
                    name: 'Standard',
                }
            }
        }
    };

    const result = await azureServiceClient.sendRequest(options);

    if (result.error){
        throw new Error(JSON.stringify(result.error));
    }

    console.log('creating/updating stream analytics job successful');
    return result;
};

login().then(createOrUpdate).catch(error => {
    console.log(error);
    process.exit(1)
});