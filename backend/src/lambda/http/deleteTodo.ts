import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { deleteTodo } from '../../businessLogic/todos'

const logger = createLogger('deleteTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing DeleteTodo event...')
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    try {
      await deleteTodo(userId, todoId)
      logger.info(`Successfully deleted todo item: ${todoId}`)
      return {
        statusCode: 204,
        body: undefined
      }
    } catch (err) {
      logger.error(`Error: ${err.message}`)
      return {
        statusCode: 500,
        body: JSON.stringify({ err })
      }
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
