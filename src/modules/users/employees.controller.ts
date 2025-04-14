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
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
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
import { UpdateEmployeeDto } from './dto/update-employee.dto';

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

  @Patch(':id')
  @Roles('OWNER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Cập nhật thông tin nhân viên (Chỉ OWNER)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật nhân viên thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật nhân viên này.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên.' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'updated.employee@example.com',
          description: 'Email mới của nhân viên',
        },
        password: {
          type: 'string',
          example: 'NewPassword123@',
          description: 'Mật khẩu mới của nhân viên',
        },
        name: {
          type: 'string',
          example: 'Nguyễn Văn B',
          description: 'Họ tên mới của nhân viên',
        },
        phoneNumber: {
          type: 'string',
          example: '0987654322',
          description: 'Số điện thoại mới của nhân viên',
        },
        gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Giới tính mới của nhân viên',
        },
        birthday: {
          type: 'string',
          format: 'date',
          example: '1991-01-01',
          description: 'Ngày sinh mới của nhân viên',
        },
        role: {
          type: 'string',
          enum: ['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'],
          description: 'Vai trò mới của nhân viên',
        },
        hotelId: {
          type: 'string',
          example: '60d0fe4f5311236168a109ca',
          description: 'ID của khách sạn mà nhân viên thuộc về (bắt buộc)',
        },
        employeeCode: {
          type: 'string',
          example: 'NV000012',
          description: 'Mã nhân viên mới',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh mới của nhân viên',
        },
        note: {
          type: 'string',
          example: 'Nhân viên đã được đào tạo về nghiệp vụ mới',
          description: 'Ghi chú mới về nhân viên',
        },
      },
    },
  })
  async updateEmployee(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      // Xử lý ảnh cũ nếu có
      const employee = await this.usersService.findById(id);
      if (employee && employee.image) {
        const oldImagePath = employee.image.split('/').pop();
        if (oldImagePath) {
          try {
            await this.supabaseStorageService.deleteFile(
              `employees/${oldImagePath}`,
            );
          } catch (error) {
            console.error('Failed to delete old image:', error);
          }
        }
      }

      // Tải lên ảnh mới
      updateEmployeeDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'employees',
      );
    }

    // hotelId được truyền trong updateEmployeeDto để xác định nhân viên thuộc về khách sạn nào
    // employeeCode được cho phép cập nhật nếu có trong updateEmployeeDto
    return this.usersService.updateEmployee(
      req.user.userId,
      id,
      updateEmployeeDto,
    );
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Xóa nhân viên (Chỉ OWNER)',
  })
  @ApiResponse({ status: 200, description: 'Xóa nhân viên thành công.' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa nhân viên.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên.' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  async removeEmployee(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    // Xử lý xóa ảnh trước khi xóa nhân viên
    const employee = await this.usersService.findById(id);
    if (employee && employee.image) {
      const imagePath = employee.image.split('/').pop();
      if (imagePath) {
        try {
          await this.supabaseStorageService.deleteFile(
            `employees/${imagePath}`,
          );
        } catch (error) {
          console.error('Failed to delete employee image:', error);
        }
      }
    }

    return this.usersService.removeEmployee(req.user.userId, id);
  }
}
