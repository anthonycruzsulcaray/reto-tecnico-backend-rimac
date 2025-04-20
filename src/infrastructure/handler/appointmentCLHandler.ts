import { SQSEvent } from "aws-lambda";
import { RdsMysqlAppointmentRepository } from "../repository/rds.repository";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"; 

const repository = new RdsMysqlAppointmentRepository();
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION }); 

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log("Processing record:", record.body);

    // Guardar la cita en la base de datos
    await repository.saveAppointment({
      insuredId: body.insuredId,
      scheduleId: body.scheduleId,
      countryISO: body.countryISO,
      status: "pending",
    });

    // Enviar evento a EventBridge
    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          EventBusName: process.env.EVENT_BUS_NAME!,
          Source: "appointment.confirmation",
          DetailType: "AppointmentConfirmed",
          Detail: JSON.stringify({
            insuredId: body.insuredId,
            scheduleId: body.scheduleId,
          }),
        },
      ],
    });

    await eventBridgeClient.send(putEventsCommand);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Citas de Chile procesadas correctamente." }),
  };
};