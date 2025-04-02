import { Types } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';

export type MongoDocument = {
  _id: Types.ObjectId;
};

export type PopulatedUser = Pick<User, 'name' | 'email' | 'image'> &
  MongoDocument;

export interface PopulatedHotel extends Omit<Hotel, 'owner' | 'staff'> {
  owner: PopulatedUser | Types.ObjectId;
  staff: (PopulatedUser | Types.ObjectId)[];
}

export type WithId<T> = T & MongoDocument;

// Helper type để check xem một document đã được populate chưa
export type IsPopulated<T, K extends keyof T> = T[K] extends MongoDocument
  ? T[K]
  : T[K] extends Types.ObjectId
    ? false
    : T[K];

// Helper function để kiểm tra một document có _id hay không
export const hasMongoId = (doc: unknown): doc is { _id: Types.ObjectId } => {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    '_id' in doc &&
    doc._id instanceof Types.ObjectId
  );
};
