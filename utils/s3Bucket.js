const AWS = require("aws-sdk");
const { S3 } = AWS;
const s3Bucket = new S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

module.exports = {
  s3Bucket,
};
