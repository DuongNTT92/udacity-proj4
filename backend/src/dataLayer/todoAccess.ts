import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem, TodoUpdate } from '../models'
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('todoAccess')

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting todo items')
    const response = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise()

    return response.Items as TodoItem[]
  }

  async createTodo(newTodo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new item: ${newTodo.todoId}`)
    await this.docClient.put({
        TableName: this.todosTable,
        Item: newTodo
      }).promise()

    return newTodo
  }

  async updateTodo(
    userId: string,
    todoId: string,
    updatedTodo: TodoUpdate
  ): Promise<void> {
    logger.info(`Updating item: ${todoId}`)
    await this.docClient.update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set #n = :n, dueDate = :due, done = :dn',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: {
          ':n': updatedTodo.name,
          ':due': updatedTodo.dueDate,
          ':dn': updatedTodo.done
        },
        ReturnValues: 'ALL_NEW'
      }).promise()
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.docClient.delete({
        TableName: this.todosTable,
        Key: { userId, todoId }
      }).promise()
  }

  async saveImgUrl(
    userId: string,
    todoId: string,
    attachmentUrl: string
  ): Promise<void> {
    await this.docClient.update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      }).promise()
  }
}
