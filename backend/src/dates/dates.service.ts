// dates.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
// สมมติว่าคุณมี Database Module/Service ที่ฉีดเข้ามาใช้งาน (อ้างอิงจากโค้ดเดิมของคุณ)
import { DatabaseService } from '../database/database.service';
import { RespondDateDto, CancelDateDto, RequestDateDto } from './dto/dates.dto';

@Injectable()
export class DatesService {
  constructor(private readonly db: DatabaseService) {}

  // 🔥 1. ส่งคำขอเดต
  async requestDate(senderId: number, dto: RequestDateDto) {
    if (new Date(dto.startTime) >= new Date(dto.endTime)) {
      throw new BadRequestException('เวลาจบเดตต้องมากกว่าเวลาเริ่มเดต');
    }

    // ตรวจสอบว่า "ผู้ส่ง (Sender)" มีเดตอื่นที่ตอบรับแล้วในช่วงเวลานี้หรือไม่
    const overlapCheck = await this.db.query(
      `SELECT 1 FROM dates 
       WHERE (sender_id = $1 OR receiver_id = $1)
       AND status = 'accepted'
       AND start_time < $3 
       AND end_time > $2 
       LIMIT 1`,
      [senderId, dto.startTime, dto.endTime],
    );

    if (overlapCheck.rows.length > 0) {
      throw new BadRequestException('คุณมีเดตนัดหมายอื่นในช่วงเวลานี้แล้ว');
    }

    // บันทึกคำขอเดต (สถานะ default เป็น pending)
    const result = await this.db.query(
      `INSERT INTO dates (sender_id, receiver_id, start_time, end_time, details, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [
        senderId,
        dto.receiverId,
        dto.startTime,
        dto.endTime,
        dto.details || null,
      ],
    );

    return result.rows[0];
  }

  // 🔥 2. ตอบรับหรือปฏิเสธคำขอเดต
  async respondDate(receiverId: number, dto: RespondDateDto) {
    // เช็คก่อนว่ามีเดตนี้อยู่จริง และส่งมาถึงผู้ใช้คนนี้ สถานะต้องเป็น pending
    const dateQuery = await this.db.query(
      `SELECT * FROM dates WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [dto.dateId, receiverId],
    );

    if (dateQuery.rows.length === 0) {
      throw new NotFoundException('ไม่พบคำขอเดต หรือคำขอนี้ถูกจัดการไปแล้ว');
    }

    const dateRecord = dateQuery.rows[0];

    if (dto.action === 'accept') {
      // ตรวจสอบว่า "ผู้รับ (Receiver)" มีเดตอื่นที่ตอบรับแล้วในช่วงเวลานี้หรือไม่
      const overlapCheck = await this.db.query(
        `SELECT 1 FROM dates 
         WHERE (sender_id = $1 OR receiver_id = $1)
         AND status = 'accepted'
         AND start_time < $3 
         AND end_time > $2 
         LIMIT 1`,
        [receiverId, dateRecord.start_time, dateRecord.end_time],
      );

      if (overlapCheck.rows.length > 0) {
        throw new BadRequestException(
          'คุณมีเดตนัดหมายอื่นในช่วงเวลานี้แล้ว ไม่สามารถตอบรับได้',
        );
      }

      // อัปเดตสถานะเป็น accepted
      await this.db.query(
        `UPDATE dates SET status = 'accepted' WHERE id = $1`,
        [dto.dateId],
      );
      return { message: 'ตอบรับคำขอเดตเรียบร้อยแล้ว' };
    }

    if (dto.action === 'reject') {
      // อัปเดตสถานะเป็น rejected
      await this.db.query(
        `UPDATE dates SET status = 'rejected' WHERE id = $1`,
        [dto.dateId],
      );
      return { message: 'ปฏิเสธคำขอเดตเรียบร้อยแล้ว' };
    }
  }

  // 🔥 3. ยกเลิกเดต
  async cancelDate(userId: number, dto: CancelDateDto) {
    const result = await this.db.query(
      `UPDATE dates 
       SET status = 'canceled' 
       WHERE id = $1 
       AND (sender_id = $2 OR receiver_id = $2) 
       AND status IN ('pending', 'accepted')
       RETURNING *`,
      [dto.dateId, userId],
    );

    if (result.rowCount === 0) {
      throw new BadRequestException('ไม่สามารถยกเลิกเดตนี้ได้');
    }

    return { message: 'ยกเลิกเดตเรียบร้อยแล้ว' };
  }

  // 🔥 4. ดึงข้อมูลปฏิทิน (แสดงเดตที่ accepted และ pending)
  async getCalendar(userId: number) {
    const result = await this.db.query(
      `SELECT d.id, d.start_time, d.end_time, d.details, d.status,
              CASE 
                WHEN d.sender_id = $1 THEN 'sent' 
                ELSE 'received' 
              END as direction,
              -- ดึงข้อมูลอีกฝ่ายมาแสดง
              u.id as other_user_id, p.first_name as other_first_name
       FROM dates d
       JOIN users u ON u.id = CASE WHEN d.sender_id = $1 THEN d.receiver_id ELSE d.sender_id END
       JOIN profiles p ON p.user_id = u.id
       WHERE (d.sender_id = $1 OR d.receiver_id = $1)
       AND d.status IN ('accepted', 'pending')
       ORDER BY d.start_time ASC`,
      [userId],
    );

    return result.rows;
  }
}
