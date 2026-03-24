import { Op, QueryTypes, literal } from 'sequelize';
import { Item, User, sequelize } from '../models';
import {
  ItemFilters,
  UserItemFilters,
  CreateItemInput,
  UpdateItemInput,
  PaginationInfo,
  ItemStatus,
  ItemType,
  ItemSortBy,
  SortOrder,
} from '../types';

interface ItemListResult {
  items: Item[];
  pagination: PaginationInfo | null;
}

interface ItemCreateData {
  type: ItemType;
  title: string;
  description?: string;
  category?: string;
  location_name?: string;
  image_urls?: string[];
  reward_amount?: number;
  lost_found_at?: Date | null;
  user_id: string;
}

interface ItemUpdateData {
  type?: ItemType;
  title?: string;
  description?: string;
  category?: string;
  location_name?: string;
  image_urls?: string[];
  reward_amount?: number;
  lost_found_at?: Date | null;
  status?: ItemStatus;
}

const ITEM_ATTRIBUTES = [
  'id',
  'user_id',
  'type',
  'status',
  'title',
  'description',
  'category',
  'image_urls',
  'location_name',
  'reward_amount',
  'lost_found_at',
  'createdAt',
  'updatedAt',
];

class ItemService {
  async setItemLocation(itemId: string, lng: number, lat: number): Promise<void> {
    await sequelize.query(
      `UPDATE items SET location = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) WHERE id = :id`,
      {
        replacements: { lng, lat, id: itemId },
        type: QueryTypes.UPDATE,
      }
    );
  }

  async create(itemData: CreateItemInput, userId: string): Promise<Item | null> {
    const { lat, lng, lost_found_at, ...rest } = itemData;

    const data: ItemCreateData = {
      ...rest,
      lost_found_at: lost_found_at ? new Date(lost_found_at) : null,
      user_id: userId,
    };

    const item = await Item.create(data);

    if (lat !== undefined && lng !== undefined) {
      await this.setItemLocation(item.id, lng, lat);
    }

    return this.findById(item.id);
  }

  async findById(id: string): Promise<Item | null> {
    return Item.findByPk(id, {
      attributes: ITEM_ATTRIBUTES,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'name', 'avatar_url'],
        },
      ],
    });
  }

  async findByIdWithOwnerCheck(id: string, userId: string): Promise<{ item: Item | null; isOwner: boolean }> {
    const item = await Item.findByPk(id, {
      attributes: ITEM_ATTRIBUTES,
    });

    if (!item) {
      return { item: null, isOwner: false };
    }

    return { item, isOwner: item.user_id === userId };
  }

  async findAll(filters: ItemFilters = {}): Promise<ItemListResult> {
    console.log('[ItemService.findAll] filters:', JSON.stringify(filters));
    const {
      lat,
      lng,
      radius,
      minDistance,
      maxDistance,
      type,
      category,
      tags,
      status = 'open',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const hasGeoFilters = lat !== undefined && lng !== undefined;

    if (hasGeoFilters) {
      console.log('[ItemService.findAll] calling findNearby with geo filters');
      return this.findNearby(lat, lng, {
        radius,
        minDistance,
        maxDistance,
        type,
        category,
        tags,
        status,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      });
    }

    const where: Record<string, unknown> = { status };
    if (type) where.type = type;
    if (category) where.category = category;
    
    if (tags && tags.length > 0) {
      where.category = { [Op.in]: tags };
    }

    if (search) {
      where[Op.or as unknown as string] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    console.log('[ItemService.findAll] where:', JSON.stringify(where));

    const offset = (page - 1) * limit;

    const order = this.buildSortOrder(sortBy, sortOrder, false);

    const { rows: items, count: total } = await Item.findAndCountAll({
      where,
      attributes: ITEM_ATTRIBUTES,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'name', 'avatar_url'],
        },
      ],
      order,
      limit,
      offset,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildSortOrder(
    sortBy: ItemSortBy,
    sortOrder: SortOrder,
    hasDistance: boolean
  ): Array<[string, string] | [ReturnType<typeof literal>, string]> {
    const direction = sortOrder.toUpperCase();
    
    switch (sortBy) {
      case 'reward_amount':
        return [['reward_amount', direction]];
      case 'title':
        return [['title', direction]];
      case 'distance':
        if (hasDistance) {
          return [[literal('distance'), direction]];
        }
        return [['createdAt', direction]];
      case 'createdAt':
      default:
        return [['createdAt', direction]];
    }
  }

  async findNearby(
    lat: number,
    lng: number,
    filters: Partial<ItemFilters> = {}
  ): Promise<ItemListResult> {
    console.log('[ItemService.findNearby] lat:', lat, 'lng:', lng);
    console.log('[ItemService.findNearby] filters:', JSON.stringify(filters));

    const {
      radius,
      minDistance,
      maxDistance,
      type,
      category,
      tags,
      status = 'open',
      search,
      sortBy = 'distance',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = filters;

    const where: Record<string, unknown> = { status };
    if (type) where.type = type;
    if (category) where.category = category;
    
    if (tags && tags.length > 0) {
      where.category = { [Op.in]: tags };
    }

    if (search) {
      where[Op.or as unknown as string] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const point = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
    console.log('[ItemService.findNearby] point:', point);

    const distanceConditions: string[] = [];
    
    distanceConditions.push('location IS NOT NULL');
    
    if (radius !== undefined) {
      distanceConditions.push(`ST_DWithin(location::geography, ${point}, ${radius})`);
    }
    
    if (minDistance !== undefined) {
      distanceConditions.push(`ST_Distance(location::geography, ${point}) >= ${minDistance}`);
    }
    
    if (maxDistance !== undefined) {
      distanceConditions.push(`ST_Distance(location::geography, ${point}) <= ${maxDistance}`);
    }

    const offset = (page - 1) * limit;
    const order = this.buildSortOrder(sortBy, sortOrder, true);

    try {
      const { rows: items, count: total } = await Item.findAndCountAll({
        where: {
          ...where,
          [Op.and]: distanceConditions.map(condition => literal(condition)),
        },
        attributes: [
          ...ITEM_ATTRIBUTES,
          [literal(`ST_Distance(location::geography, ${point})`), 'distance'],
        ],
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'username', 'name', 'avatar_url'],
          },
        ],
        order,
        limit,
        offset,
      });

      console.log('[ItemService.findNearby] found items:', items.length);
      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const err = error as Error & { sql?: string };
      console.error('[ItemService.findNearby] ERROR:', err.message);
      console.error('[ItemService.findNearby] SQL:', err.sql || 'N/A');
      throw error;
    }
  }

  async findByUser(userId: string, filters: UserItemFilters = {}): Promise<ItemListResult> {
    const { type, status, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = { user_id: userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { rows: items, count: total } = await Item.findAndCountAll({
      where,
      attributes: ITEM_ATTRIBUTES,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    userId: string,
    updateData: UpdateItemInput
  ): Promise<{ item: Item | null; notFound: boolean; forbidden: boolean }> {
    const { item, isOwner } = await this.findByIdWithOwnerCheck(id, userId);

    if (!item) {
      return { item: null, notFound: true, forbidden: false };
    }

    if (!isOwner) {
      return { item: null, notFound: false, forbidden: true };
    }

    const { lat, lng, lost_found_at, ...rest } = updateData;
    const data: ItemUpdateData = {
      ...rest,
      lost_found_at: lost_found_at !== undefined ? (lost_found_at ? new Date(lost_found_at) : null) : undefined,
    };

    await item.update(data);

    if (lat !== undefined || lng !== undefined) {
      const newLat = lat ?? null;
      const newLng = lng ?? null;
      if (newLat !== null && newLng !== null) {
        await this.setItemLocation(id, newLng, newLat);
      }
    }

    return { item: (await this.findById(id))!, notFound: false, forbidden: false };
  }

  async resolve(id: string, userId: string): Promise<{ item: Item | null; notFound: boolean; forbidden: boolean }> {
    const { item, isOwner } = await this.findByIdWithOwnerCheck(id, userId);

    if (!item) {
      return { item: null, notFound: true, forbidden: false };
    }

    if (!isOwner) {
      return { item: null, notFound: false, forbidden: true };
    }

    await item.update({ status: 'resolved' });
    return { item: (await this.findById(id))!, notFound: false, forbidden: false };
  }

  async delete(id: string, userId: string): Promise<{ success: boolean; notFound: boolean; forbidden: boolean }> {
    const { item, isOwner } = await this.findByIdWithOwnerCheck(id, userId);

    if (!item) {
      return { success: false, notFound: true, forbidden: false };
    }

    if (!isOwner) {
      return { success: false, notFound: false, forbidden: true };
    }

    await item.destroy();
    return { success: true, notFound: false, forbidden: false };
  }
}

export default new ItemService();
