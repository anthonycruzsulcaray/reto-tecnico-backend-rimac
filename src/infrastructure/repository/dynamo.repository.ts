import { AppointmentRepository } from "../../domain/repository/appointment.repository";
import { Appointment } from "../../domain/entities/appointment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION }); // Cliente base de DynamoDB
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient); // Cliente simplificado para operaciones con datos
const tableName = process.env.DYNAMO_TABLE_NAME!;

export class DynamoAppointmentRepository implements AppointmentRepository {
  async createAppointment(appointment: Appointment): Promise<void> {
    console.log("Creating appointment in DynamoDB:", JSON.stringify(appointment, null, 2));
    const command = new PutCommand({
      TableName: tableName,
      Item: appointment,
    });
    await dynamoDb.send(command);
  }

  async getAppointmentsByInsuredId(insuredId: string): Promise<Appointment[]> {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "insuredId = :insuredId",
      ExpressionAttributeValues: {
        ":insuredId": insuredId,
      },
    });
    const result = await dynamoDb.send(command);
    return result.Items as Appointment[];
  }

  async updateAppointmentStatus(insuredId: string, scheduleId: number, status: string): Promise<void> {
    console.log("Updating appointment status in DynamoDB:",status, insuredId, scheduleId); ;
    const command = new UpdateCommand({
      TableName: tableName,
      Key: { insuredId, scheduleId },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    });
    await dynamoDb.send(command);
  }
}