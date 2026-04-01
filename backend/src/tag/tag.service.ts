import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TagService {
  constructor(private db: DatabaseService) {}

  async getAllTags() {
    const result = await this.db.query(
      `SELECT id, name FROM tags ORDER BY name ASC`
    );

    return {
      count: result.rows.length,
      tags: result.rows,
    };
  }
}