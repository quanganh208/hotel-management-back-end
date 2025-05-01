import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  InventoryItem,
  InventoryItemDocument,
} from './schemas/inventory-item.schema';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import mongoose from 'mongoose';

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  categoryCount: number;
  items: InventoryItem[];
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
  ) {}

  async create(
    createInventoryItemDto: CreateInventoryItemDto,
  ): Promise<InventoryItem> {
    // Tạo mã hàng hoá tự động theo format SP00001
    const latestItem = await this.inventoryItemModel
      .findOne({ hotelId: createInventoryItemDto.hotelId })
      .sort({ inventoryCode: -1 })
      .exec();

    let nextId = 1;
    if (latestItem) {
      const latestNumber = parseInt(latestItem.inventoryCode.replace('SP', ''));
      nextId = latestNumber + 1;
    }

    const inventoryCode = `SP${nextId.toString().padStart(5, '0')}`;

    const newItem = new this.inventoryItemModel({
      ...createInventoryItemDto,
      inventoryCode,
    });

    return newItem.save();
  }

  async findAll(hotelId: mongoose.Types.ObjectId): Promise<InventoryItem[]> {
    return this.inventoryItemModel.find({ hotelId }).exec();
  }

  async getSummary(
    hotelId: mongoose.Types.ObjectId,
    lowStockThreshold: number = 20,
  ): Promise<InventorySummary> {
    // Lấy tất cả sản phẩm của khách sạn
    const items = await this.inventoryItemModel.find({ hotelId }).exec();

    // Tính toán các số liệu thống kê
    const totalItems = items.length;

    // Tổng giá trị kho = sum(giá vốn * số lượng tồn kho)
    const totalValue = items.reduce((sum, item) => {
      return sum + item.costPrice * item.stock;
    }, 0);

    // Đếm số sản phẩm sắp hết hàng (dưới ngưỡng)
    const lowStockItems = items.filter(
      (item) => item.stock <= lowStockThreshold,
    ).length;

    // Đếm số danh mục sản phẩm (dựa trên itemType)
    const categories = new Set(items.map((item) => item.itemType));
    const categoryCount = categories.size;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      categoryCount,
      items,
    };
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<InventoryItem> {
    const item = await this.inventoryItemModel.findById(id).exec();

    if (!item) {
      throw new NotFoundException(
        `Hàng hoá với ID ${id.toString()} không tìm thấy`,
      );
    }

    return item;
  }

  async findByInventoryCode(inventoryCode: string): Promise<InventoryItem> {
    const item = await this.inventoryItemModel
      .findOne({ inventoryCode })
      .exec();

    if (!item) {
      throw new NotFoundException(
        `Hàng hoá với mã ${inventoryCode} không tìm thấy`,
      );
    }

    return item;
  }

  async update(
    id: mongoose.Types.ObjectId,
    updateInventoryItemDto: UpdateInventoryItemDto,
  ): Promise<InventoryItem> {
    const updatedItem = await this.inventoryItemModel
      .findByIdAndUpdate(id, { $set: updateInventoryItemDto }, { new: true })
      .exec();

    if (!updatedItem) {
      throw new NotFoundException(
        `Hàng hoá với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedItem;
  }

  async remove(id: mongoose.Types.ObjectId): Promise<InventoryItem> {
    const deletedItem = await this.inventoryItemModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedItem) {
      throw new NotFoundException(
        `Hàng hoá với ID ${id.toString()} không tìm thấy`,
      );
    }

    return deletedItem;
  }
}
