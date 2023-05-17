import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { getTodoByDate } from '../../businessLogic/todos'
import { TodoItem } from '../../models'

const logger = createLogger('getTodosByDate')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing GetTodosByDate event...')
    const userId = getUserId(event)
    const date = event.pathParameters.date

    try {
      const todoList: TodoItem[] = await getTodoByDate(userId, date)
      logger.info('Successfully retrieved todolist')
      return {
        statusCode: 200,
        body: JSON.stringify({ items: todoList })
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
