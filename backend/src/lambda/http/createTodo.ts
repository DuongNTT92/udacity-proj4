import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { createTodo } from '../../businessLogic/todos'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const logger = createLogger('createTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing CreateTodo event...')
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)

    try {
      const newItem = await createTodo(userId, newTodo)
      logger.info(`Successfully created a new todo item: ${newItem}`)

      return {
        statusCode: 201,
        body: JSON.stringify({
          item: newItem
        })
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

handler.use(
  cors({
    credentials: true
  })
)
