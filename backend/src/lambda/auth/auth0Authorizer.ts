import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJDZexx2pFnYs/MA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi12MHR0dzBobi51cy5hdXRoMC5jb20wHhcNMjIwODA3MDk1MTI0WhcN
MzYwNDE1MDk1MTI0WjAkMSIwIAYDVQQDExlkZXYtdjB0dHcwaG4udXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApfrv63+oat8E6uKk
mUwpK7077fGNPgKUjKWL+dl5nG6UTQSfIGXcCXXZCYetXyxeT2nBMCuZz5KT2REi
1SZiPS5gJCRqen54OlQPFk9GzlTYH0eQ71ZTDdIKGx8gIO2V+aSnb6AtboTsF5bS
JmHOJPTob5j+TwPdOfupiaiy6TVzFsBYy7n68CU4lLYwlj7f3Fm3QpFSYU+UOe7v
5L/UtEwrPonCLFtreDd/YXaygzCZwqf8ArmNN4YHQ3QrL2jVAnYp9Z60604H3er0
S+p/MDWMt65Hw+dgFugiS+IB8JWjMjp1m5P27HfXim/aesNWsh3J/NWVZJn/LXwE
tTlk+wIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTwp5TyQG1O
NwufQVhXfqAzKhE7DDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AIe0aIj4fBNyyuWbw5CNTKsBok0V6xToOgHupHQIXAwVUVAQncTBSiDgK4Q5cMz4
pvytYwVP/IJNxmgj+UcMzYEA23PRokJ0Tkgks3DTr5daSiF1+SCUy2v0t9AmOyZO
uWbf060S9lIvKSGUY519CPY0nA8geluiepN0zgrC2xk0wHFMzhllGlLlz0lPMmq7
b2LoL7dD8G7wFvKEufg/NtM6/bSs0j4a6joSE66m3TGkKtTIyW8BNrYUWuO6AaCe
NwApo4cXkyiIHlPmiuhsjkEngHHVmMtLbA98YvlCZvEqiHwrnxexhHH8otskiXMI
zQFiD7Tc4ZxJNteN6tTcmVA=
-----END CERTIFICATE-----`

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
  const token = getToken(authHeader)  
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')
  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')
  const split = authHeader.split(' ')
  const token = split[1]
  return token
}
