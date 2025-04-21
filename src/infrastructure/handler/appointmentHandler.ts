import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoAppointmentRepository } from "../repository/dynamo.repository";
import { AppointmentService } from "../../application/service/appointment.service";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const repository = new DynamoAppointmentRepository();
const service = new AppointmentService(repository);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
// console.log("env : ",process.env);
const snsTopicArn = process.env.SNS_TOPIC_ARN!;

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body!);

    // 1. Guardar en DynamoDB
    await service.createAppointment({
      insuredId: body.insuredId,
      scheduleId: body.scheduleId,
      countryISO: body.countryISO,
      status: "pending",
    });

    // Verificar el valor de SNS_TOPIC_ARN
    console.log("SNS_TOPIC_ARN:", snsTopicArn);

    // 2. Publicar al SNS
    const publishCommand = new PublishCommand({
      TopicArn: snsTopicArn,
      Message: JSON.stringify({
        insuredId: body.insuredId,
        scheduleId: body.scheduleId,
        countryISO: body.countryISO,
      }),
      MessageAttributes: {
        countryISO: {
          DataType: "String",
          StringValue: body.countryISO,
        },
      },
    });
    await snsClient.send(publishCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Cita creada y publicada en SNS exitosamente" }),
    };
  }

  if (event.httpMethod === "GET") {
    const insuredId = event.pathParameters?.insuredId;
    if (!insuredId) {
      return { statusCode: 400, body: "No se obtuvo el key:  insuredId" };
    }
    const appointments = await service.getAppointments(insuredId);
    return {
      statusCode: 200,
      body: JSON.stringify(appointments),
    };
  }

  return { statusCode: 405, body: "Metodo no permitido" };
};
