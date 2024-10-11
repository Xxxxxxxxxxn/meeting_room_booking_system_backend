import { Injectable } from '@nestjs/common';
import { CreateMinioDto } from './dto/create-minio.dto';
import { UpdateMinioDto } from './dto/update-minio.dto';

@Injectable()
export class MinioService {
  create(createMinioDto: CreateMinioDto) {
    return 'This action adds a new minio';
  }

  findAll() {
    return `This action returns all minio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} minio`;
  }

  update(id: number, updateMinioDto: UpdateMinioDto) {
    return `This action updates a #${id} minio`;
  }

  remove(id: number) {
    return `This action removes a #${id} minio`;
  }
}
