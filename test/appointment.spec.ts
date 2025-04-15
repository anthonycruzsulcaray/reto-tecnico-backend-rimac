import { AppointmentRepository } from '../src/domain/repository/appointment.repository';
import { AppointmentService } from '../src/application/service/appointment.service';
import { Appointment } from '../src/domain/entities/appointment';


const mockRepository: AppointmentRepository = {
  createAppointment: jest.fn(),
  getAppointmentsByInsuredId: jest.fn(),
  updateAppointmentStatus: jest.fn(),
};

const service = new AppointmentService(mockRepository);

describe("AppointmentService", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Se crea una cita correctamente", async () => {
    const appointment: Appointment = {
      insuredId: "00001",
      scheduleId: 1,
      countryISO: "PE",
      status: "pending",
    };

    await service.createAppointment(appointment);

    expect(mockRepository.createAppointment).toHaveBeenCalledTimes(1);
    expect(mockRepository.createAppointment).toHaveBeenCalledWith(appointment);
  });

  it("Se lista las citas de un asegurado", async () => {
    const appointments: Appointment[] = [
      { insuredId: "00001", scheduleId: 1, countryISO: "PE", status: "pending" },
      { insuredId: "00001", scheduleId: 2, countryISO: "PE", status: "completed" },
    ];

    (mockRepository.getAppointmentsByInsuredId as jest.Mock).mockResolvedValue(appointments);

    const result = await service.getAppointments("00001");

    expect(mockRepository.getAppointmentsByInsuredId).toHaveBeenCalledTimes(1);
    expect(result).toEqual(appointments);
  });

  it("Se aactualiza el estado de una cita a 'completed'", async () => {
    await service.completeAppointment("00001", 1);

    expect(mockRepository.updateAppointmentStatus).toHaveBeenCalledTimes(1);
    expect(mockRepository.updateAppointmentStatus).toHaveBeenCalledWith("00001", 1, "completed");
  });

});

