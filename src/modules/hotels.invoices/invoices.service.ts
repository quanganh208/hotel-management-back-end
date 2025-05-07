import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import {
  Invoice,
  InvoiceDocument,
  InvoiceItem,
  InvoiceStatus,
  InvoiceType,
  ItemType,
} from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AddInvoiceItemsDto } from './dto/add-invoice-items.dto';
import { InventoryService } from '../hotels.inventory/inventory.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    // Tạo mã hóa đơn tự động theo format HD000001
    const latestInvoice = await this.invoiceModel
      .findOne({ hotelId: createInvoiceDto.hotelId })
      .sort({ invoiceCode: -1 })
      .exec();

    let nextId = 1;
    if (latestInvoice) {
      const latestNumber = parseInt(
        latestInvoice.invoiceCode.replace('HD', ''),
      );
      nextId = latestNumber + 1;
    }

    const invoiceCode = `HD${nextId.toString().padStart(6, '0')}`;

    // Xử lý các trường thời gian
    let checkInDate: Date | undefined;
    let checkOutDate: Date | undefined;

    if (createInvoiceDto.checkInDate) {
      checkInDate = new Date(createInvoiceDto.checkInDate);
    }

    if (createInvoiceDto.checkOutDate) {
      checkOutDate = new Date(createInvoiceDto.checkOutDate);
    }

    // Khởi tạo hóa đơn mới
    const newInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      invoiceCode,
      checkInDate,
      checkOutDate,
      status: InvoiceStatus.OPEN,
      createdBy: new mongoose.Types.ObjectId(userId),
      items: [],
      totalAmount: 0,
      finalAmount: 0,
    });

    return newInvoice.save();
  }

  async findAll(hotelId: mongoose.Types.ObjectId): Promise<Invoice[]> {
    return this.invoiceModel.find({ hotelId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<Invoice> {
    const invoice = await this.invoiceModel.findById(id).exec();

    if (!invoice) {
      throw new NotFoundException(
        `Hóa đơn với ID ${id.toString()} không tìm thấy`,
      );
    }

    return invoice;
  }

  async findByRoom(
    roomId: mongoose.Types.ObjectId,
    status?: InvoiceStatus,
  ): Promise<Invoice[]> {
    const query: any = { roomId };

    if (status) {
      query.status = status;
    }

    return this.invoiceModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findActiveRoomInvoice(
    roomId: mongoose.Types.ObjectId,
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceModel
      .findOne({
        roomId,
        status: InvoiceStatus.OPEN,
        invoiceType: InvoiceType.ROOM,
      })
      .exec();

    return invoice;
  }

  async update(
    id: mongoose.Types.ObjectId,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Không cho phép cập nhật hóa đơn đã thanh toán hoặc đã hủy
    if (invoice.status !== InvoiceStatus.OPEN) {
      throw new BadRequestException(
        'Không thể cập nhật hóa đơn đã thanh toán hoặc đã hủy',
      );
    }

    const updateData: any = { ...updateInvoiceDto };
    delete updateData.items; // Xóa items khỏi updateData để xử lý riêng

    // Xử lý trường checkOutDate
    if (updateInvoiceDto.checkOutDate) {
      updateData.checkOutDate = new Date(updateInvoiceDto.checkOutDate);
    }

    // Nếu có cập nhật về items
    if (updateInvoiceDto.items) {
      // Tách các item hiện tại thành hai loại: phòng và hàng hóa
      const roomItems: InvoiceItem[] = [];
      const inventoryItems: InvoiceItem[] = [];

      // Phân loại các item hiện tại dựa vào itemType
      for (const oldItem of invoice.items) {
        if (oldItem.itemType === ItemType.ROOM || oldItem.type === 'service') {
          roomItems.push(oldItem);
        } else if (
          oldItem.itemType === ItemType.INVENTORY ||
          oldItem.type === 'inventory'
        ) {
          inventoryItems.push(oldItem);
        }
      }

      // Phục hồi số lượng tồn kho chỉ cho các mặt hàng inventory
      for (const oldItem of inventoryItems) {
        try {
          // Lấy thông tin mặt hàng từ kho
          const inventoryItem = await this.inventoryService.findOne(
            new mongoose.Types.ObjectId(oldItem.itemId.toString()),
          );

          // Hoàn trả số lượng vào kho
          await this.inventoryService.update(oldItem.itemId, {
            hotelId: invoice.hotelId,
            stock: inventoryItem.stock + oldItem.quantity,
          });
        } catch (error) {
          // Bỏ qua lỗi nếu không tìm thấy mặt hàng (có thể đã bị xóa)
          console.error(
            `Error restoring inventory for item ${oldItem.itemId}: ${error.message}`,
          );
        }
      }

      // Xử lý danh sách items mới
      const newItems: InvoiceItem[] = [];
      let totalAmount = 0;

      // Giữ nguyên các item phòng trong danh sách mới
      for (const roomItem of roomItems) {
        newItems.push(roomItem);
        totalAmount += roomItem.amount;
      }

      // Cập nhật số lượng tồn kho cho các mặt hàng mới (chỉ xử lý inventory)
      for (const item of updateInvoiceDto.items) {
        // Kiểm tra xem item này có phải là phí phòng hiện tại không
        const isRoomItem = roomItems.some(
          (roomItem) => roomItem.itemId.toString() === item.itemId.toString(),
        );

        if (isRoomItem) {
          // Đây là phí phòng, giữ nguyên số lượng item theo request
          const roomItem = roomItems.find(
            (ri) => ri.itemId.toString() === item.itemId.toString(),
          );

          if (roomItem) {
            // Cập nhật số lượng nếu khác với yêu cầu
            if (roomItem.quantity !== item.quantity) {
              // Tính lại giá tiền
              const newAmount = roomItem.price * item.quantity;

              // Cập nhật roomItem đã được push vào newItems trước đó
              // Tìm vị trí của roomItem trong newItems
              const itemIndex = newItems.findIndex(
                (ni) => ni.itemId.toString() === roomItem.itemId.toString(),
              );

              if (itemIndex !== -1) {
                newItems[itemIndex].quantity = item.quantity;
                newItems[itemIndex].amount = newAmount;

                // Điều chỉnh totalAmount
                totalAmount = totalAmount - roomItem.amount + newAmount;
              }
            }
          }

          // Bỏ qua các bước tiếp theo vì đây là phí phòng
          continue;
        }

        try {
          // Lấy thông tin mặt hàng từ kho
          const inventoryItem = await this.inventoryService.findOne(
            new mongoose.Types.ObjectId(item.itemId.toString()),
          );

          // Kiểm tra số lượng tồn kho
          if (inventoryItem.stock < item.quantity) {
            throw new BadRequestException(
              `Sản phẩm "${inventoryItem.name}" không đủ số lượng trong kho (Còn ${inventoryItem.stock}, cần ${item.quantity})`,
            );
          }

          // Tính toán thành tiền cho mặt hàng
          const amount = item.quantity * inventoryItem.sellingPrice;
          totalAmount += amount;

          // Tạo mặt hàng mới với đầy đủ thông tin
          newItems.push({
            itemId: new mongoose.Types.ObjectId(item.itemId.toString()),
            name: inventoryItem.name,
            itemCode: inventoryItem.inventoryCode,
            type: 'inventory',
            itemType: ItemType.INVENTORY,
            quantity: item.quantity,
            price: inventoryItem.sellingPrice,
            amount: amount,
            note: `${inventoryItem.name} (${inventoryItem.unit})`,
          });

          // Cập nhật số lượng tồn kho
          await this.inventoryService.update(item.itemId, {
            hotelId: invoice.hotelId,
            stock: inventoryItem.stock - item.quantity,
          });
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new NotFoundException(
            `Không tìm thấy sản phẩm với ID ${item.itemId}`,
          );
        }
      }

      // Cập nhật danh sách items và tính lại tổng tiền
      updateData.items = newItems;
      updateData.totalAmount = totalAmount;
      updateData.finalAmount =
        totalAmount - (updateInvoiceDto.discount || invoice.discount || 0);
    } else if (updateInvoiceDto.discount !== undefined) {
      // Nếu chỉ cập nhật giảm giá, tính lại finalAmount
      updateData.finalAmount = invoice.totalAmount - updateInvoiceDto.discount;
    }

    // Cập nhật thông tin người cập nhật
    updateData.updatedBy = new mongoose.Types.ObjectId(userId);

    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedInvoice) {
      throw new NotFoundException(
        `Hóa đơn với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedInvoice;
  }

  async addItems(
    id: mongoose.Types.ObjectId,
    addItemsDto: AddInvoiceItemsDto,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Không cho phép thêm mặt hàng vào hóa đơn đã thanh toán hoặc đã hủy
    if (invoice.status !== InvoiceStatus.OPEN) {
      throw new BadRequestException(
        'Không thể thêm mặt hàng vào hóa đơn đã thanh toán hoặc đã hủy',
      );
    }

    // Kiểm tra xem khách sạn của hóa đơn và khách sạn trong request có trùng khớp không
    if (invoice.hotelId.toString() !== addItemsDto.hotelId.toString()) {
      throw new BadRequestException(
        'Khách sạn trong request không khớp với khách sạn của hóa đơn',
      );
    }

    // Xử lý từng mặt hàng mới
    const newItems: InvoiceItem[] = [];
    for (const item of addItemsDto.items) {
      try {
        // Lấy thông tin mặt hàng từ kho
        const inventoryItem = await this.inventoryService.findOne(
          new mongoose.Types.ObjectId(item.itemId.toString()),
        );

        // Kiểm tra số lượng tồn kho
        if (inventoryItem.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${inventoryItem.name}" không đủ số lượng trong kho (Còn ${inventoryItem.stock}, cần ${item.quantity})`,
          );
        }

        // Tính toán thành tiền cho mặt hàng
        const amount = item.quantity * inventoryItem.sellingPrice;

        // Thêm mặt hàng vào danh sách mới
        newItems.push({
          itemId: new mongoose.Types.ObjectId(item.itemId.toString()),
          name: inventoryItem.name,
          itemCode: inventoryItem.inventoryCode,
          type: 'inventory',
          itemType: ItemType.INVENTORY,
          quantity: item.quantity,
          price: inventoryItem.sellingPrice,
          amount: amount,
          note: `${inventoryItem.name} (${inventoryItem.unit})`,
        });

        // Cập nhật số lượng tồn kho
        await this.inventoryService.update(item.itemId, {
          hotelId: addItemsDto.hotelId,
          stock: inventoryItem.stock - item.quantity,
        });
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new NotFoundException(
          `Không tìm thấy sản phẩm với ID ${item.itemId}`,
        );
      }
    }

    // Giữ nguyên tất cả các item hiện tại và thêm các item mới
    const updatedItems = [...invoice.items, ...newItems];
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );
    const finalAmount = totalAmount - (invoice.discount || 0);

    // Cập nhật hóa đơn
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            items: updatedItems,
            totalAmount,
            finalAmount,
            updatedBy: new mongoose.Types.ObjectId(userId),
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedInvoice) {
      throw new NotFoundException(
        `Hóa đơn với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedInvoice;
  }

  async checkout(
    id: mongoose.Types.ObjectId,
    paymentMethod: string,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Không cho phép thanh toán hóa đơn đã thanh toán hoặc đã hủy
    if (invoice.status !== InvoiceStatus.OPEN) {
      throw new BadRequestException('Hóa đơn đã được thanh toán hoặc đã hủy');
    }

    // Phân tích thông tin thanh toán
    let paymentInfo = {
      method: 'CASH',
      reference: '',
      note: '',
    };

    try {
      // Thử phân tích chuỗi JSON
      paymentInfo = JSON.parse(paymentMethod);
    } catch (e) {
      // Nếu không phải JSON, sử dụng giá trị cũ làm method
      paymentInfo.method = paymentMethod;
    }

    // Cập nhật hóa đơn
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: InvoiceStatus.PAID,
            paymentMethod: paymentInfo.method,
            paymentReference: paymentInfo.reference,
            paymentNote: paymentInfo.note,
            paidDate: new Date(),
            updatedBy: new mongoose.Types.ObjectId(userId),
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedInvoice) {
      throw new NotFoundException(
        `Hóa đơn với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedInvoice;
  }

  async remove(id: mongoose.Types.ObjectId): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Không cho phép xóa hóa đơn đã thanh toán
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Không thể xóa hóa đơn đã thanh toán');
    }

    // Nếu là hóa đơn mở và có mặt hàng từ kho, cần hoàn lại số lượng tồn kho
    if (invoice.status === InvoiceStatus.OPEN) {
      for (const item of invoice.items) {
        if (item.itemType === ItemType.INVENTORY || item.type === 'inventory') {
          try {
            // Lấy thông tin mặt hàng từ kho
            const inventoryItem = await this.inventoryService.findOne(
              new mongoose.Types.ObjectId(item.itemId.toString()),
            );

            // Cập nhật số lượng tồn kho (hoàn lại)
            await this.inventoryService.update(item.itemId, {
              hotelId: invoice.hotelId,
              stock: inventoryItem.stock + item.quantity,
            });
          } catch (error) {
            // Bỏ qua lỗi nếu không tìm thấy mặt hàng (có thể đã bị xóa)
            console.error(
              `Error restoring inventory for item ${item.itemId}: ${error.message}`,
            );
          }
        }
      }
    }

    // Xóa hóa đơn
    const deletedInvoice = await this.invoiceModel.findByIdAndDelete(id).exec();

    if (!deletedInvoice) {
      throw new NotFoundException(
        `Hóa đơn với ID ${id.toString()} không tìm thấy`,
      );
    }

    return deletedInvoice;
  }

  async cancel(id: mongoose.Types.ObjectId, userId: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Không cho phép hủy hóa đơn đã thanh toán hoặc đã hủy
    if (invoice.status !== InvoiceStatus.OPEN) {
      throw new BadRequestException('Hóa đơn đã được thanh toán hoặc đã hủy');
    }

    // Hoàn lại số lượng tồn kho cho các mặt hàng
    for (const item of invoice.items) {
      if (item.itemType === ItemType.INVENTORY || item.type === 'inventory') {
        try {
          // Lấy thông tin mặt hàng từ kho
          const inventoryItem = await this.inventoryService.findOne(
            new mongoose.Types.ObjectId(item.itemId.toString()),
          );

          // Cập nhật số lượng tồn kho (hoàn lại)
          await this.inventoryService.update(item.itemId, {
            hotelId: invoice.hotelId,
            stock: inventoryItem.stock + item.quantity,
          });
        } catch (error) {
          // Bỏ qua lỗi nếu không tìm thấy mặt hàng (có thể đã bị xóa)
          console.error(
            `Error restoring inventory for item ${item.itemId}: ${error.message}`,
          );
        }
      }
    }

    // Cập nhật hóa đơn
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: InvoiceStatus.CANCELLED,
            updatedBy: new mongoose.Types.ObjectId(userId),
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedInvoice) {
      throw new NotFoundException(
        `Hóa đơn với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedInvoice;
  }
}
