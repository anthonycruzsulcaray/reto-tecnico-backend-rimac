import { SQSEvent } from "aws-lambda";
import { DynamoAppointmentRepository } from "../repository/dynamo.repository";
import { AppointmentService } from "../../application/service/appointment.service";

const repository = new DynamoAppointmentRepository();
const service = new AppointmentService(repository);

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
    
      const insuredId = body.detail.insuredId;
      const scheduleId = body.detail.scheduleId;
  
      if (!insuredId || !scheduleId) {
        console.error("Faltan datos en la confirmación:", body);
        continue;
      }
      await service.completeAppointment(insuredId, scheduleId);
    } catch (error) {
      console.error("Error procesando el mensaje de SQS:", record, error);
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Confirmaciones procesadas correctamente." }),
  };
};
