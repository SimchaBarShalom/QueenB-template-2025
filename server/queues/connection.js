const IORedis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let queueConnection;
let workerConnection;

// Used by the API-side producer (emailQueue.add). An HTTP request must not
// hang behind Redis: the meeting database operation has already succeeded
// by the time we enqueue, so a slow/unavailable Redis should fail this
// call quickly instead of retrying or queueing commands indefinitely.
function getQueueRedisConnection() {
  if (!queueConnection) {
    queueConnection = new IORedis(REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    queueConnection.on("error", (error) => {
      console.error("Redis connection error (email queue producer):", error.message);
    });
  }
  return queueConnection;
}

// Used by the long-running email Worker process. Unlike the producer, the
// worker has no request to time out — it should keep reconnecting and
// waiting for Redis to come back. BullMQ requires maxRetriesPerRequest:
// null here for its blocking commands.
function getWorkerRedisConnection() {
  if (!workerConnection) {
    workerConnection = new IORedis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
    workerConnection.on("error", (error) => {
      console.error("Redis connection error (email worker):", error.message);
    });
  }
  return workerConnection;
}

module.exports = { getQueueRedisConnection, getWorkerRedisConnection, REDIS_URL };
