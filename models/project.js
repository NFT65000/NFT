const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  address: {
    type: String,
    default: "",
  },
  traits: {
    type: String,
    default: "background",
  },
  name: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  symbol: {
    type: String,
    default: "",
  },
  totalsupply: {
    type: Number,
    default: 0,
  },
  rarity: {
    type: Boolean,
    default: false,
  },
  presale: {
    type: Boolean,
    default: false,
  },
  presale_supply: {
    type: Number,
    default: 0,
  },
  presale_price: {
    type: Number,
    default: 0,
  },
  public_sale_price: {
    type: Number,
    default: 0,
  },
  rarity_values: {
    type: String,
    default: "",
  },
  img_urls: {
    type: String,
    default: "",
  },
  ipfs_img_base_url: {
    type: String,
    default: "",
  },
  generated_collection_img_urls: {
    type: Array,
    default: [],
  },
  metadata_url: {
    type: String,
    default: "",
  },
  contract: {
    type: String,
    default: "",
  },
  abi: {
    type: Array,
  },
  status: {
    type: String,
    default: "generating",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
