import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { RequestWithUser } from '@/types/express';
import { GetEmployeesDto } from './dto/get-employees.dto';
import { UploadInterceptor } from '@/helpers/upload.interceptor';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';

@ApiTags('employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  @Post()
  @Roles('OWNER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Tạo nhân viên mới cho một khách sạn cụ thể (Chỉ OWNER)',
  })
  @ApiResponse({ status: 201, description: 'Tạo nhân viên thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({
    status: 403,
    description:
      'Không có quyền tạo nhân viên hoặc không sở hữu khách sạn này.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'employee@example.com',
          description: 'Email của nhân viên',
        },
        password: {
          type: 'string',
          example: 'Password123@',
          description: 'Mật khẩu của nhân viên',
        },
        name: {
          type: 'string',
          example: 'Nguyễn Văn A',
          description: 'Họ tên của nhân viên',
        },
        phoneNumber: {
          type: 'string',
          example: '0987654321',
          description: 'Số điện thoại của nhân viên',
        },
        gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Giới tính của nhân viên',
        },
        birthday: {
          type: 'string',
          format: 'date',
          example: '1990-01-01',
          description: 'Ngày sinh của nhân viên',
        },
        role: {
          type: 'string',
          enum: ['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'],
          description: 'Vai trò của nhân viên',
        },
        hotelId: {
          type: 'string',
          example: '60d0fe4f5311236168a109ca',
          description: 'ID của khách sạn mà nhân viên thuộc về',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh của nhân viên',
        },
        note: {
          type: 'string',
          example:
            'Nhân viên này có kinh nghiệm làm việc tại nhiều khách sạn lớn',
          description: 'Ghi chú về nhân viên',
        },
      },
    },
  })
  async createEmployee(
    @Request() req: RequestWithUser,
    @Body() createEmployeeDto: CreateEmployeeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createEmployeeDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'employees',
      );
    }

    return this.usersService.createEmployee(req.user.userId, createEmployeeDto);
  }

  @Get()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Lấy danh sách nhân viên theo khách sạn (Chỉ OWNER hoặc MANAGER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách nhân viên thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({
    status: 403,
    description:
      'Không có quyền xem danh sách nhân viên hoặc không quản lý khách sạn này.',
  })
  getEmployees(
    @Request() req: RequestWithUser,
    @Query() getEmployeesDto: GetEmployeesDto,
  ) {
    return this.usersService.getEmployeesByHotel(
      req.user.userId,
      getEmployeesDto.hotelId,
    );
  }
}
