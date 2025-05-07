import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { RequestWithUser } from '@/types/express';
import { PaymentService } from './payment.service';
import { InvoicesService } from '../hotels.invoices/invoices.service';
import mongoose from 'mongoose';
import { CreatePaymentQrDto } from './dto/create-payment-qr.dto';
import { CheckPaymentDto } from './dto/check-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post('generate-qr')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Tạo mã QR thanh toán cho hóa đơn (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tạo mã QR thành công.',
    schema: {
      type: 'object',
      properties: {
        qrDataURL: {
          type: 'string',
          description: 'URL hình ảnh QR code dạng base64',
        },
        transactionCode: {
          type: 'string',
          description: 'Mã giao dịch để kiểm tra thanh toán',
        },
        amount: {
          type: 'number',
          description: 'Số tiền cần thanh toán',
        },
        invoiceCode: {
          type: 'string',
          description: 'Mã hóa đơn',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc hóa đơn không tồn tại.',
  })
  async generatePaymentQR(
    @Body() createPaymentQrDto: CreatePaymentQrDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const { invoiceId } = createPaymentQrDto;
    const objectId = new mongoose.Types.ObjectId(invoiceId);

    // Lấy thông tin hóa đơn
    const invoice = await this.invoicesService.findOne(objectId);

    // Kiểm tra trạng thái hóa đơn
    if (invoice.status !== 'open') {
      throw new BadRequestException('Hóa đơn đã được thanh toán hoặc đã hủy');
    }

    // Tạo mã giao dịch
    const transactionCode = this.paymentService.generateTransactionCode();

    try {
      // Tạo mã QR
      const qrData = await this.paymentService.createPaymentQR(
        invoice.finalAmount,
        transactionCode,
      );

      // Trả về thông tin QR code và mã giao dịch
      return {
        qrDataURL: qrData.data.qrDataURL,
        transactionCode,
        amount: invoice.finalAmount,
        invoiceCode: invoice.invoiceCode,
      };
    } catch (error) {
      throw new BadRequestException(`Không thể tạo mã QR: ${error.message}`);
    }
  }

  @Post('check-payment')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái thanh toán (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiResponse({
    status: 200,
    description: 'Kiểm tra thanh toán thành công.',
    schema: {
      type: 'object',
      properties: {
        paid: {
          type: 'boolean',
          description: 'Trạng thái thanh toán',
        },
        transaction: {
          type: 'object',
          description: 'Thông tin giao dịch (nếu đã thanh toán)',
        },
        invoice: {
          type: 'object',
          description: 'Thông tin hóa đơn đã cập nhật (nếu đã thanh toán)',
        },
      },
    },
  })
  async checkPayment(
    @Body() checkPaymentDto: CheckPaymentDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const { transactionCode, amount, invoiceId } = checkPaymentDto;

    if (!transactionCode || !amount || !invoiceId) {
      throw new BadRequestException('Thiếu thông tin cần thiết');
    }

    const objectId = new mongoose.Types.ObjectId(invoiceId);

    // Kiểm tra hóa đơn tồn tại
    const invoice = await this.invoicesService.findOne(objectId);
    if (!invoice) {
      throw new NotFoundException('Hóa đơn không tồn tại');
    }

    // Kiểm tra hóa đơn chưa thanh toán
    if (invoice.status !== 'open') {
      throw new BadRequestException('Hóa đơn đã được thanh toán hoặc đã hủy');
    }

    try {
      // Kiểm tra trạng thái thanh toán
      const paymentStatus = await this.paymentService.checkPaymentStatus(
        transactionCode,
        amount,
      );

      // Nếu đã thanh toán, cập nhật hóa đơn
      if (paymentStatus.paid) {
        // Tạo thông tin thanh toán
        const paymentInfo = {
          method: 'BANK_TRANSFER',
          reference: transactionCode,
          note: `Thanh toán qua chuyển khoản - ${
            paymentStatus.transaction?.description || ''
          }`,
        };

        // Cập nhật hóa đơn
        const updatedInvoice = await this.invoicesService.checkout(
          objectId,
          JSON.stringify(paymentInfo),
          req.user.userId,
        );

        return {
          paid: true,
          transaction: paymentStatus.transaction,
          invoice: updatedInvoice,
        };
      }

      return {
        paid: false,
      };
    } catch (error) {
      throw new BadRequestException(
        `Không thể kiểm tra thanh toán: ${error.message}`,
      );
    }
  }
}
