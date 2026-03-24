import { Address } from '../models';
import { CreateAddressInput, UpdateAddressInput, AddressAttributes } from '../types';

export interface AddressResponse {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
  updatedAt: Date;
}

class AddressesService {
  async getByUserId(userId: string): Promise<AddressResponse[]> {
    const addresses = await Address.findAll({
      where: { user_id: userId },
      order: [['is_default', 'DESC'], ['createdAt', 'DESC']],
    });
    return addresses.map(this.toAddressResponse);
  }

  async getById(addressId: string, userId: string): Promise<AddressResponse | null> {
    const address = await Address.findOne({
      where: { id: addressId, user_id: userId },
    });
    if (!address) {
      return null;
    }
    return this.toAddressResponse(address);
  }

  async create(userId: string, data: CreateAddressInput): Promise<AddressResponse> {
    // If this is set as default, unset other defaults first
    if (data.is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: userId } }
      );
    }

    // If this is the first address, make it default
    const existingCount = await Address.count({ where: { user_id: userId } });
    const isDefault = existingCount === 0 ? true : data.is_default || false;

    const address = await Address.create({
      user_id: userId,
      label: data.label,
      address_line1: data.address_line1,
      address_line2: data.address_line2 || null,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country || 'India',
      is_default: isDefault,
      lat: data.lat || null,
      lng: data.lng || null,
    });

    return this.toAddressResponse(address);
  }

  async update(addressId: string, userId: string, data: UpdateAddressInput): Promise<AddressResponse | null> {
    const address = await Address.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      return null;
    }

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: userId } }
      );
    }

    const updateData: Partial<AddressAttributes> = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.address_line1 !== undefined) updateData.address_line1 = data.address_line1;
    if (data.address_line2 !== undefined) updateData.address_line2 = data.address_line2;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postal_code !== undefined) updateData.postal_code = data.postal_code;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.is_default !== undefined) updateData.is_default = data.is_default;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;

    if (Object.keys(updateData).length > 0) {
      await address.update(updateData);
    }

    return this.toAddressResponse(address);
  }

  async delete(addressId: string, userId: string): Promise<boolean> {
    const address = await Address.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      return false;
    }

    const wasDefault = address.is_default;
    await address.destroy();

    // If deleted address was default, make the most recent one default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
      });
      if (nextAddress) {
        await nextAddress.update({ is_default: true });
      }
    }

    return true;
  }

  async setDefault(addressId: string, userId: string): Promise<AddressResponse | null> {
    const address = await Address.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      return null;
    }

    // Unset all other defaults
    await Address.update(
      { is_default: false },
      { where: { user_id: userId } }
    );

    // Set this one as default
    await address.update({ is_default: true });

    return this.toAddressResponse(address);
  }

  toAddressResponse(address: Address): AddressResponse {
    return {
      id: address.id,
      user_id: address.user_id,
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
      lat: address.lat,
      lng: address.lng,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}

export default new AddressesService();
