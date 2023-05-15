import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const logger = createLogger('updateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing UpdateTodo event...')
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const userId: string = getUserId(event)

    try {
      await updateTodo(userId, todoId, updatedTodo)
      logger.info(`Successfully updated the todo item: ${todoId}`)
      return {
        statusCode: 200,
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
