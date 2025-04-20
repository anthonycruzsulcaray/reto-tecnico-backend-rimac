import { SQSEvent } from "aws-lambda";
import { DynamoAppointmentRepository } from "../repository/dynamo.repository";
import { AppointmentService } from "../../application/service/appointment.service";

const repository = new DynamoAppointmentRepository();
const service = new AppointmentService(repository);

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
      // Deserializar el mensaje recibido desde SQS
      const sqsMessage = JSON.parse(record.body);

      // El contenido real del evento está en el campo "Detail"
      const body = JSON.parse(sqsMessage.detail);

      console.log("Processing record:", body);

      const insuredId = body.insuredId;
      const scheduleId = body.scheduleId;

      if (!insuredId || !scheduleId) {
        console.error("Faltan datos en la confirmación:", body);
        continue;
      }

      // Actualizar el estado de la cita en DynamoDB
      await service.completeAppointment(insuredId, scheduleId);
      console.log(`Appointment updated to completed: InsuredId=${insuredId}, ScheduleId=${scheduleId}`);
    } catch (error) {
      console.error("Error procesando el mensaje de SQS:", record, error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Confirmaciones procesadas correctamente." }),
  };
};
