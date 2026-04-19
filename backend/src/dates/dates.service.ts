// dates.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
// สมมติว่าคุณมี Database Module/Service ที่ฉีดเข้ามาใช้งาน (อ้างอิงจากโค้ดเดิมของคุณ)
import { DatabaseService } from '../database/database.service';
import { RespondDateDto, CancelDateDto, RequestDateDto } from './dto/dates.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DatesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  // 🔥 1. ส่งคำขอเดต
  async requestDate(senderId: number, dto: RequestDateDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const now = new Date();

    if (startTime < now) {
      throw new BadRequestException('Start time cannot be in the past.');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after the start time.');
    }

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
      throw new BadRequestException(
        'You already have another date scheduled during this time.',
      );
    }

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
    const profilesRes = await this.db.query(
      `SELECT p.user_id, p.first_name, 
              (SELECT url FROM pictures WHERE user_id = p.user_id AND is_profile = true LIMIT 1) as profile_image
       FROM profiles p WHERE p.user_id IN ($1, $2)`,
      [senderId, dto.receiverId],
    );

    const myProfile = profilesRes.rows.find((r) => r.user_id === senderId);

    this.notificationService.create(dto.receiverId, 'DATE_REQ', {
      type: 'DATE_REQ',
      senderId,
      senderName: myProfile.first_name,
      senderImage: myProfile.profile_image,
    });

    return result.rows[0];
  }

  // 🔥 2. ตอบรับหรือปฏิเสธคำขอเดต
  async respondDate(receiverId: number, dto: RespondDateDto) {
    // Check if the date exists, belongs to the receiver, and is still pending
    const dateQuery = await this.db.query(
      `SELECT * FROM dates WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [dto.dateId, receiverId],
    );

    // Translated: Not found error
    if (dateQuery.rows.length === 0) {
      throw new NotFoundException(
        'Date request not found or has already been processed.',
      );
    }

    const dateRecord = dateQuery.rows[0];
    const profilesRes = await this.db.query(
      `SELECT p.user_id, p.first_name, 
              (SELECT url FROM pictures WHERE user_id = p.user_id AND is_profile = true LIMIT 1) as profile_image
       FROM profiles p WHERE p.user_id = $1`,
      [receiverId],
    );
    const myProfile = profilesRes.rows[0];
    if (dto.action === 'accept') {
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
          'You already have an overlapping date scheduled. Cannot accept.',
        );
      }

      await this.db.query(
        `UPDATE dates SET status = 'accepted' WHERE id = $1`,
        [dto.dateId],
      );

      this.notificationService.create(dateRecord.sender_id, 'DATE_ACCEPT', {
        type: 'DATE_ACCEPT',
        receiverId,
        senderName: myProfile.first_name,
        senderImage: myProfile.profile_image,
      });
      return { message: 'Date request accepted successfully.' };
    }

    if (dto.action === 'reject') {
      await this.db.query(
        `UPDATE dates SET status = 'rejected' WHERE id = $1`,
        [dto.dateId],
      );
      this.notificationService.create(dateRecord.sender_id, 'DATE_REJECT', {
        type: 'DATE_REJECT',
        receiverId,
        senderName: myProfile.first_name,
        senderImage: myProfile.profile_image,
      });
      return { message: 'Date request rejected successfully.' };
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
      throw new BadRequestException(
        'Cannot cancel this date. It may not exist or has already been processed.',
      );
    }

    return { message: 'Date cancelled successfully.' };
  }

  async getCalendar(userId: number) {
    const result = await this.db.query(
      `SELECT d.id,  
      d.start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' AS start_time,
      d.end_time   AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' AS end_time,
      d.details, d.status,
              CASE 
                WHEN d.sender_id = $1 THEN 'sent' 
                ELSE 'received' 
              END as direction,
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
