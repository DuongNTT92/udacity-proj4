// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'sbo0bltiab'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  domain: 'dev-2i2eajkyfku1snp2.us.auth0.com', // Auth0 domain
  clientId: 'yJ78uoDvp5Z2uF7QpWIoJKG7lJ6cutP0', // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
