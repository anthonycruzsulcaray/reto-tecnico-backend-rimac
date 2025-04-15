import { AppointmentRepository } from "../../domain/repository/appointment.repository";
import { Appointment } from "../../domain/entities/appointment";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();
const tableName = process.env.DYNAMO_TABLE_NAME!;

export class DynamoAppointmentRepository implements AppointmentRepository {
  async createAppointment(appointment: Appointment): Promise<void> {
    await dynamoDb.put({
      TableName: tableName,
      Item: appointment
    }).promise();
  }

  async getAppointmentsByInsuredId(insuredId: string): Promise<Appointment[]> {
    const result = await dynamoDb.query({
      TableName: tableName,
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: {
        ':insuredId': insuredId
      }
    }).promise();
    return result.Items as Appointment[];
  }

  async updateAppointmentStatus(insuredId: string, scheduleId: number, status: string): Promise<void> {
    await dynamoDb.update({
      TableName: tableName,
      Key: { insuredId, scheduleId },
      UpdateExpression: 'set #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status }
    }).promise();
  }
}

