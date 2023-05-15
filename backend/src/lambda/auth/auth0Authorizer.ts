import Axios from 'axios'
import { verify, decode } from 'jsonwebtoken'
import { error } from 'console'
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { createLogger } from '../../utils/logger'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
const jwksUrl =
  'https://dev-2i2eajkyfku1snp2.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  logger.info('Checking token', authHeader.slice(0, 20))
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  console.log(jwt)

  const response = await Axios.get(jwksUrl)
  const JWTKey = response.data.keys.find((key) => (key.kid = jwt.header.kid))
    ?.x5c?.[0]
  logger.info('JWTKey', JWTKey)

  if (!JWTKey) {
    throw error('JWKS url does not contain key')
  }

  const cert = `-----BEGIN CERTIFICATE-----\n${JWTKey}\n-----END CERTIFICATE-----`
  const verifiedToken = verify(token, cert, {
    algorithms: ['RS256']
  }) as JwtPayload

  logger.info('End verifing token', verifiedToken)

  return verifiedToken
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')

  return split[1]
}
