import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
    constructor(private db: DatabaseService) {}

    async setUserOnline(userId: number, online: boolean) {
        await this.db.query(
          `UPDATE users SET is_online = $1, last_connection = $2 WHERE id = $3`,
          [online, online ? new Date() : new Date(), userId]
        );
      }
}
