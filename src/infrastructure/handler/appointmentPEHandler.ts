import { SQSEvent } from "aws-lambda";
import { RDSAppointmentRepository } from "../repository/rds.repository";
import { EventBridge } from "aws-sdk";

const repository = new RDSAppointmentRepository();
const eventBridge = new EventBridge();

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    // Guardar en RDS (simulación de insert real)
    await repository.saveAppointment({
      insuredId: body.insuredId,
      scheduleId: body.scheduleId,
      countryISO: body.countryISO,
      status: "pending",
    });

    // Enviar evento de confirmación a EventBridge
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
    body: JSON.stringify({ message: "Citas de Perú procesadas correctamente." }),
  };
};
