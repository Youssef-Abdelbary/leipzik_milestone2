import Vendor from "../models/modelVendor.js";
import { log } from "../utils/logger.js";

export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();

    res.json({ data: vendors });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors." });
  }
};