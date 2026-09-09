const { Queue } = require("bullmq");
const { getQueueRedisConnection } = require("./connection");
const { EMAIL_QUEUE_NAME } = require("./queueNames");

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: getQueueRedisConnection(),
});

module.exports = { emailQueue, EMAIL_QUEUE_NAME };
