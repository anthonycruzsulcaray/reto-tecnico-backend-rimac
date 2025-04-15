import { Appointment } from "../../domain/entities/appointment";
import mysql from "mysql2/promise";

export class RDSAppointmentRepository {
  private pool = mysql.createPool({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || "3306"),
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  async saveAppointment(appointment: Appointment): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.execute(
        "INSERT INTO appointments (insured_id, schedule_id, country_iso, status) VALUES (?, ?, ?, ?)",
        [appointment.insuredId, appointment.scheduleId, appointment.countryISO, appointment.status]
      );
    } finally {
      conn.release();
    }
  }
}
