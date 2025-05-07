import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Định nghĩa interface cho giao dịch MB Bank
interface MBTransaction {
  postDate: string;
  transactionDate: string;
  accountNumber: string;
  creditAmount: string;
  debitAmount: string;
  transactionCurrency: string;
  transactionDesc: string;
  balanceAvailable: string;
  refNo: string;
  toAccountName: string;
  toBank: string;
  toAccountNumber: string;
  type: string;
  amount?: number;
  description?: string;
}

// Định nghĩa response từ VietQR
interface VietQRResponse {
  code: number;
  desc: string;
  data: {
    qrCode: string;
    qrDataURL: string;
    generateTime: string;
    [key: string]: any;
  };
}

// Định nghĩa response kiểm tra thanh toán
interface PaymentStatusResponse {
  paid: boolean;
  transaction?: MBTransaction;
}

@Injectable()
export class PaymentService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Tạo mã giao dịch duy nhất cho thanh toán
   * @returns Mã giao dịch dạng chuỗi ký tự và số
   */
  generateTransactionCode(): string {
    // Tạo mã giao dịch từ UUID và timestamp để đảm bảo tính duy nhất
    const timestamp = Date.now().toString(36);
    const uuid = uuidv4().replace(/-/g, '').substring(0, 8);
    return `PAY${timestamp.toUpperCase()}${uuid.toUpperCase()}`;
  }

  /**
   * Tạo QR code thanh toán qua VietQR
   * @param amount Số tiền cần thanh toán
   * @param invoiceCode Mã hóa đơn
   * @param transactionCode Mã giao dịch
   * @returns Dữ liệu QR code
   */
  async createPaymentQR(
    amount: number,
    transactionCode: string,
  ): Promise<VietQRResponse> {
    try {
      const accountNo = this.configService.get<string>('BANK_ACCOUNT_NO');
      const accountName = this.configService.get<string>('BANK_ACCOUNT_NAME');
      const acqId = this.configService.get<string>('BANK_ACQ_ID');

      if (!accountNo || !accountName || !acqId) {
        throw new Error('Thiếu thông tin tài khoản ngân hàng');
      }
      const response = await axios.post<VietQRResponse>(
        'https://api.vietqr.io/v2/generate',
        {
          accountNo,
          accountName,
          acqId,
          addInfo: transactionCode,
          amount,
          template: 'compact',
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error creating VietQR:', error);
      throw new Error('Không thể tạo mã QR thanh toán');
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán qua MB Bank API
   * @param transactionCode Mã giao dịch cần kiểm tra
   * @param amount Số tiền cần kiểm tra
   * @returns Thông tin về trạng thái thanh toán
   */
  async checkPaymentStatus(
    transactionCode: string,
    amount: number,
  ): Promise<PaymentStatusResponse> {
    try {
      const username = this.configService.get<string>('MB_USERNAME');
      const password = this.configService.get<string>('MB_PASSWORD');
      const accountNumber = this.configService.get<string>('BANK_ACCOUNT_NO');

      if (!username || !password || !accountNumber) {
        throw new Error('Thiếu thông tin đăng nhập MB Bank');
      }

      try {
        const { MB } = await import('mbbank');
        const mb = new MB({
          username,
          password,
        });
        await mb.login();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const formatDate = (date: Date): string => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const fromDate = formatDate(yesterday);
        const toDate = formatDate(today);
        const transactions = (await mb.getTransactionsHistory({
          accountNumber,
          fromDate,
          toDate,
        })) as MBTransaction[];
        if (!transactions || transactions.length === 0) {
          return { paid: false };
        }
        console.log(transactions);

        const matchingTransaction = transactions?.find(
          (trans: MBTransaction) => {
            if (!trans) return false;

            const cleanDesc = trans.transactionDesc?.replace(/\s+/g, '') || '';
            const cleanCode = transactionCode.replace(/\s+/g, '');

            const transAmount = parseInt(trans.creditAmount || '0', 10);

            // Kiểm tra mã giao dịch cụ thể trong nội dung
            // Thay vì tìm kiếm trực tiếp, chúng ta tìm kiếm phần sau "CUSTOMER "
            // vì định dạng thường là "CUSTOMER [mã giao dịch]. TU: [tên]"
            let hasTransactionCode = false;

            // Cách 1: Kiểm tra nếu mã giao dịch xuất hiện ngay sau "CUSTOMER"
            if (
              trans.transactionDesc?.includes(`CUSTOMER ${transactionCode}`)
            ) {
              hasTransactionCode = true;
            }

            // Cách 2: Tìm kiếm mã giao dịch trong toàn bộ mô tả
            if (cleanDesc.includes(cleanCode)) {
              hasTransactionCode = true;
            }

            // Cách 3: Tách phần mô tả và tìm kiếm ở phần đầu tiên
            const parts = trans.transactionDesc?.split('.') || [];
            if (parts.length > 0 && parts[0].includes(transactionCode)) {
              hasTransactionCode = true;
            }

            // Log để debug việc tìm kiếm
            console.log(
              `So sánh: Mã=${transactionCode}, Mô tả=${trans.transactionDesc}, Tìm thấy=${hasTransactionCode}`,
            );

            const matches = hasTransactionCode && transAmount === amount;

            if (matches) {
              console.log('Đã tìm thấy giao dịch trùng khớp:', trans);
            }

            return matches;
          },
        );

        if (matchingTransaction) {
          return {
            paid: true,
            transaction: matchingTransaction,
          };
        }

        return {
          paid: false,
        };
      } catch (mbError: any) {
        console.error('Lỗi MB Bank API:', mbError);
        throw new Error(
          `Lỗi MB Bank API: ${mbError.message || 'Lỗi không xác định'}`,
        );
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      // Trả về thông tin lỗi chi tiết hơn
      throw new Error(
        `Không thể kiểm tra trạng thái thanh toán: ${error.message || error}`,
      );
    }
  }
}
