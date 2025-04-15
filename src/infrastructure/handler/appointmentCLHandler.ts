import { SQSEvent } from "aws-lambda";
import { RDSAppointmentRepository } from "../repository/rds.repository";
import { EventBridge } from "aws-sdk";

const repository = new RDSAppointmentRepository();
const eventBridge = new EventBridge();

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    await repository.saveAppointment({
      insuredId: body.insuredId,
      scheduleId: body.scheduleId,
      countryISO: body.countryISO,
      status: "pending",
    });

    await eventBridge.putEvents({
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
    }).promise();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Citas de Chile procesadas correctamente." }),
  };
};
