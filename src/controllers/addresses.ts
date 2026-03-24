import { Request, Response } from "express";
import addressesService from "../services/addresses";
import { CreateAddressInput, UpdateAddressInput } from "../types";

class AddressesController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const addresses = await addressesService.getByUserId(userId);

      res.json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching addresses:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch addresses",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const address = await addressesService.getById(id, userId);

      if (!address) {
        res.status(404).json({
          success: false,
          message: "Address not found",
        });
        return;
      }

      res.json({
        success: true,
        data: address,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching address:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch address",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateAddressInput = req.body;

      const address = await addressesService.create(userId, data);

      res.status(201).json({
        success: true,
        message: "Address created successfully",
        data: address,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error creating address:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create address",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const data: UpdateAddressInput = req.body;

      const address = await addressesService.update(id, userId, data);

      if (!address) {
        res.status(404).json({
          success: false,
          message: "Address not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Address updated successfully",
        data: address,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error updating address:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update address",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const deleted = await addressesService.delete(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Address not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Address deleted successfully",
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error deleting address:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete address",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async setDefault(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const address = await addressesService.setDefault(id, userId);

      if (!address) {
        res.status(404).json({
          success: false,
          message: "Address not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Default address updated successfully",
        data: address,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error setting default address:", err);
      res.status(500).json({
        success: false,
        message: "Failed to set default address",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
}

export default new AddressesController();
