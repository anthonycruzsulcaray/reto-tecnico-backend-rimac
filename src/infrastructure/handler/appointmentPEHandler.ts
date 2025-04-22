import { SQSEvent } from "aws-lambda";
import { RdsMysqlAppointmentRepository } from "../repository/rds.repository";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const repository = new RdsMysqlAppointmentRepository();
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    // Deserializar el mensaje SNS envuelto en SQS
    const snsMessage = JSON.parse(record.body);
    const body = JSON.parse(snsMessage.Message);

    console.log("Processing record:", body);

    // Guardar en RDS
    await repository.saveAppointment({
      insuredId: body.insuredId,
      scheduleId: body.scheduleId,
      countryISO: body.countryISO,
      status: "pending",
    });

    // Enviar evento de confirmación a EventBridge
    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          EventBusName: process.env.EVENT_BUS_NAME!,
          Source: "appointment.confirmation",
          DetailType: "AppointmentConfirmed",
          Detail: JSON.stringify({
            insuredId: body.insuredId,
            scheduleId: body.scheduleId,
            countryISO: body.countryISO,
            status: "completed", // Estado que será actualizado en DynamoDB
          })
        }
      ]
    });

    await eventBridgeClient.send(putEventsCommand);
    console.log("Event sent to EventBridge:", JSON.stringify(putEventsCommand.input, null, 2));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Citas de Perú procesadas correctamente." }),
  };
};