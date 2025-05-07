import {
  Body,
  Controller,
  Patch,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  NotFoundException,
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
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestWithUser } from '@/types/express';
import { UploadInterceptor } from '@/helpers/upload.interceptor';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại.' })
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.userId);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return {
      message: 'Lấy thông tin người dùng thành công',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountType: user.accountType,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        birthday: user.birthday,
        image: user.image,
        isVerified: user.isVerified,
      },
    };
  }

  @Patch('profile')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'updated.user@example.com',
          description: 'Email mới của người dùng',
        },
        password: {
          type: 'string',
          example: 'NewPassword123@',
          description: 'Mật khẩu mới của người dùng',
        },
        name: {
          type: 'string',
          example: 'Nguyễn Văn B',
          description: 'Họ tên mới của người dùng',
        },
        phoneNumber: {
          type: 'string',
          example: '0987654322',
          description: 'Số điện thoại mới của người dùng',
        },
        gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Giới tính mới của người dùng',
        },
        birthday: {
          type: 'string',
          format: 'date',
          example: '1991-01-01',
          description: 'Ngày sinh mới của người dùng',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh mới của người dùng',
        },
      },
    },
  })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      // Xử lý ảnh cũ nếu có
      const user = await this.usersService.findById(req.user.userId);
      if (user && user.image) {
        const oldImagePath = user.image.split('/').pop();
        if (oldImagePath) {
          try {
            await this.supabaseStorageService.deleteFile(
              `users/${oldImagePath}`,
            );
          } catch (error) {
            console.error('Failed to delete old image:', error);
          }
        }
      }

      // Tải lên ảnh mới
      updateUserDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'users',
      );
    }

    return this.usersService.updateUserProfile(req.user.userId, updateUserDto);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công.',
  })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không đúng.' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại.' })
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }
}
