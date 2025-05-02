import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { CreateInventoryCheckDto } from './dto/create-inventory-check.dto';
import { UpdateInventoryCheckDto } from './dto/update-inventory-check.dto';
import {
  InventoryCheck,
  InventoryCheckDocument,
  InventoryCheckItem,
  InventoryCheckStatus,
} from './schemas/inventory-check.schema';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryCheckService {
  constructor(
    @InjectModel(InventoryCheck.name)
    private inventoryCheckModel: Model<InventoryCheckDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(
    createInventoryCheckDto: CreateInventoryCheckDto,
    userId: string,
  ): Promise<InventoryCheck> {
    // Tạo mã phiếu kiểm kê tự động theo format KK000001
    const latestCheck = await this.inventoryCheckModel
      .findOne({ hotelId: createInventoryCheckDto.hotelId })
      .sort({ checkCode: -1 })
      .exec();

    let nextId = 1;
    if (latestCheck) {
      const latestNumber = parseInt(latestCheck.checkCode.replace('KK', ''));
      nextId = latestNumber + 1;
    }

    const checkCode = `KK${nextId.toString().padStart(6, '0')}`;

    // Xử lý các mặt hàng kiểm kê
    const items: InventoryCheckItem[] = [];
    let totalDifference = 0;
    let totalIncrease = 0;
    let totalDecrease = 0;

    for (const item of createInventoryCheckDto.items) {
      try {
        // Lấy thông tin sản phẩm từ mã
        const inventoryItem = await this.inventoryService.findByInventoryCode(
          item.inventoryCode,
        );

        // Tính chênh lệch
        const systemStock = inventoryItem.stock;
        const difference = item.actualStock - systemStock;

        // Cập nhật tổng chênh lệch
        totalDifference += difference;
        if (difference > 0) {
          totalIncrease += difference;
        } else if (difference < 0) {
          totalDecrease += difference;
        }

        // Thêm vào danh sách mặt hàng kiểm kê
        items.push({
          inventoryItemId: new mongoose.Types.ObjectId(inventoryItem['_id']),
          inventoryCode: inventoryItem.inventoryCode,
          name: inventoryItem.name,
          unit: inventoryItem.unit,
          systemStock,
          actualStock: item.actualStock,
          difference,
        });
      } catch (error) {
        throw new NotFoundException(
          `Không tìm thấy hàng hóa với mã ${item.inventoryCode}`,
        );
      }
    }

    // Tạo phiếu kiểm kê mới
    const newCheck = new this.inventoryCheckModel({
      ...createInventoryCheckDto,
      checkCode,
      items,
      totalDifference,
      totalIncrease,
      totalDecrease,
      status: InventoryCheckStatus.DRAFT,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return newCheck.save();
  }

  async findAll(hotelId: mongoose.Types.ObjectId): Promise<InventoryCheck[]> {
    return this.inventoryCheckModel
      .find({ hotelId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<InventoryCheck> {
    const check = await this.inventoryCheckModel.findById(id).exec();

    if (!check) {
      throw new NotFoundException(
        `Phiếu kiểm kê với ID ${id.toString()} không tìm thấy`,
      );
    }

    return check;
  }

  async update(
    id: mongoose.Types.ObjectId,
    updateInventoryCheckDto: UpdateInventoryCheckDto,
    userId: string,
  ): Promise<InventoryCheck> {
    const check = await this.findOne(id);

    // Kiểm tra trạng thái phiếu
    if (check.status === InventoryCheckStatus.BALANCED) {
      throw new ForbiddenException(
        'Không thể cập nhật phiếu kiểm kê đã cân bằng',
      );
    }

    // Cập nhật phiếu
    const updateData: any = { ...updateInventoryCheckDto };

    // Nếu cập nhật danh sách mặt hàng
    if (
      updateInventoryCheckDto.items &&
      updateInventoryCheckDto.items.length > 0
    ) {
      // Tạo một bản sao của các mặt hàng hiện tại để cập nhật
      const updatedItems = [...check.items];
      let totalDifference = 0;
      let totalIncrease = 0;
      let totalDecrease = 0;

      for (const updateItem of updateInventoryCheckDto.items) {
        try {
          // Nếu có inventoryItemId, cập nhật mặt hàng đã tồn tại
          if (updateItem.inventoryItemId) {
            const itemIndex = updatedItems.findIndex(
              (item) =>
                item.inventoryItemId.toString() ===
                updateItem.inventoryItemId.toString(),
            );

            if (itemIndex >= 0) {
              // Lấy thông tin mặt hàng từ database để đảm bảo số lượng hệ thống chính xác
              const inventoryItem = await this.inventoryService.findOne(
                new mongoose.Types.ObjectId(
                  updateItem.inventoryItemId.toString(),
                ),
              );

              // Cập nhật số lượng thực tế
              const systemStock = inventoryItem.stock;
              const difference = updateItem.actualStock - systemStock;

              // Cập nhật mặt hàng trong danh sách
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                actualStock: updateItem.actualStock,
                systemStock,
                difference,
              };
            } else {
              // Mặt hàng không tồn tại trong phiếu, cần thêm mới
              const inventoryItem = await this.inventoryService.findOne(
                new mongoose.Types.ObjectId(
                  updateItem.inventoryItemId.toString(),
                ),
              );

              const systemStock = inventoryItem.stock;
              const difference = updateItem.actualStock - systemStock;

              updatedItems.push({
                inventoryItemId: new mongoose.Types.ObjectId(
                  updateItem.inventoryItemId.toString(),
                ),
                inventoryCode: inventoryItem.inventoryCode,
                name: inventoryItem.name,
                unit: inventoryItem.unit,
                systemStock,
                actualStock: updateItem.actualStock,
                difference,
              });
            }
          }
          // Nếu có inventoryCode thay vì inventoryItemId
          else if (updateItem.inventoryCode) {
            // Lấy thông tin sản phẩm từ mã
            const inventoryItem =
              await this.inventoryService.findByInventoryCode(
                updateItem.inventoryCode,
              );

            // Tìm mặt hàng trong danh sách hiện tại
            const itemIndex = updatedItems.findIndex(
              (item) => item.inventoryCode === updateItem.inventoryCode,
            );

            const systemStock = inventoryItem.stock;
            const difference = updateItem.actualStock - systemStock;

            if (itemIndex >= 0) {
              // Cập nhật mặt hàng đã tồn tại
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                actualStock: updateItem.actualStock,
                systemStock,
                difference,
              };
            } else {
              // Thêm mặt hàng mới
              updatedItems.push({
                inventoryItemId: new mongoose.Types.ObjectId(
                  inventoryItem['_id'],
                ),
                inventoryCode: inventoryItem.inventoryCode,
                name: inventoryItem.name,
                unit: inventoryItem.unit,
                systemStock,
                actualStock: updateItem.actualStock,
                difference,
              });
            }
          }
        } catch (error) {
          if (updateItem.inventoryCode) {
            throw new NotFoundException(
              `Không tìm thấy hàng hóa với mã ${updateItem.inventoryCode}`,
            );
          } else {
            throw new NotFoundException(
              `Không tìm thấy hàng hóa với ID ${updateItem.inventoryItemId}`,
            );
          }
        }
      }

      // Tính lại tổng chênh lệch
      for (const item of updatedItems) {
        totalDifference += item.difference;
        if (item.difference > 0) {
          totalIncrease += item.difference;
        } else if (item.difference < 0) {
          totalDecrease += item.difference;
        }
      }

      updateData.items = updatedItems;
      updateData.totalDifference = totalDifference;
      updateData.totalIncrease = totalIncrease;
      updateData.totalDecrease = totalDecrease;
    }

    // Nếu cập nhật trạng thái sang "đã cân bằng"
    if (updateData.status === InventoryCheckStatus.BALANCED) {
      // Cập nhật số lượng tồn kho thực tế
      for (const item of check.items) {
        const inventoryItemId = item.inventoryItemId;
        const actualStock = item.actualStock;

        try {
          await this.inventoryService.update(inventoryItemId, {
            hotelId: check.hotelId,
            stock: actualStock,
          });
        } catch (error) {
          throw new BadRequestException(
            `Không thể cập nhật số lượng tồn kho cho hàng hóa ${item.name}`,
          );
        }
      }

      // Cập nhật thông tin phiếu
      updateData.balanceDate = new Date();
      updateData.balancedBy = new mongoose.Types.ObjectId(userId);
    }

    const updatedCheck = await this.inventoryCheckModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedCheck) {
      throw new NotFoundException(
        `Phiếu kiểm kê với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedCheck;
  }

  async remove(id: mongoose.Types.ObjectId): Promise<InventoryCheck> {
    const check = await this.findOne(id);

    // Nếu xóa phiếu đã cân bằng, cần rollback lại số lượng tồn kho của hàng hóa
    if (check.status === InventoryCheckStatus.BALANCED) {
      try {
        // Rollback số lượng tồn kho cho từng mặt hàng về giá trị ban đầu (systemStock)
        for (const item of check.items) {
          const inventoryItemId = item.inventoryItemId;
          const systemStock = item.systemStock; // Số lượng ban đầu trước khi cân bằng

          // Cập nhật lại số lượng tồn kho về giá trị ban đầu
          await this.inventoryService.update(inventoryItemId, {
            hotelId: check.hotelId,
            stock: systemStock,
          });
        }
      } catch (error) {
        throw new BadRequestException(
          'Không thể rollback số lượng tồn kho. Vui lòng thử lại sau.',
        );
      }
    }

    // Xóa phiếu kiểm kê
    const deletedCheck = await this.inventoryCheckModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedCheck) {
      throw new NotFoundException(
        `Phiếu kiểm kê với ID ${id.toString()} không tìm thấy`,
      );
    }

    return deletedCheck;
  }

  async balanceInventory(
    id: mongoose.Types.ObjectId,
    userId: string,
  ): Promise<InventoryCheck> {
    const check = await this.findOne(id);

    // Kiểm tra trạng thái phiếu - không thể cân bằng phiếu đã cân bằng
    if (check.status === InventoryCheckStatus.BALANCED) {
      throw new ForbiddenException(
        'Phiếu kiểm kê này đã được cân bằng trước đó',
      );
    }

    // Cập nhật số lượng tồn kho thực tế cho từng mặt hàng
    for (const item of check.items) {
      const inventoryItemId = item.inventoryItemId;
      const actualStock = item.actualStock;

      try {
        await this.inventoryService.update(inventoryItemId, {
          hotelId: check.hotelId,
          stock: actualStock,
        });
      } catch (error) {
        throw new BadRequestException(
          `Không thể cập nhật số lượng tồn kho cho hàng hóa ${item.name}`,
        );
      }
    }

    // Cập nhật thông tin phiếu kiểm kê
    const updateData = {
      status: InventoryCheckStatus.BALANCED,
      balanceDate: new Date(),
      balancedBy: new mongoose.Types.ObjectId(userId),
    };

    const updatedCheck = await this.inventoryCheckModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedCheck) {
      throw new NotFoundException(
        `Phiếu kiểm kê với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedCheck;
  }
}
