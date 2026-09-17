declare namespace Cloudflare {
  interface Env {
    PRIVATE_DEPLOYMENT?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
