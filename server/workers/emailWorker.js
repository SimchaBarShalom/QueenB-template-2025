require("dotenv").config();
const { Worker } = require("bullmq");
const { getWorkerRedisConnection } = require("../queues/connection");
const { EMAIL_QUEUE_NAME } = require("../queues/queueNames");
const {
  sendMeetingScheduledMentorEmail,
  sendMeetingScheduledMenteeEmail,
  sendMeetingCancelledEmail,
} = require("../services/emailService");

const JOB_HANDLERS = {
  "meeting-scheduled-mentor": sendMeetingScheduledMentorEmail,
  "meeting-scheduled-mentee": sendMeetingScheduledMenteeEmail,
  "meeting-cancelled": sendMeetingCancelledEmail,
};

async function processEmailJob(job) {
  const handler = JOB_HANDLERS[job.name];

  if (!handler) {
    throw new Error(`No email handler registered for job "${job.name}"`);
  }

  // Let delivery errors propagate so BullMQ marks the job failed and retries it.
  await handler(job.data);
}

function createEmailWorker() {
  return new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: getWorkerRedisConnection(),
    concurrency: 10,
  });
}

function startEmailWorker() {
  const worker = createEmailWorker();

  worker.on("completed", (job) => {
    console.log(`📧 Email job ${job.id} (${job.name}) sent successfully`);
  });

  worker.on("failed", (job, error) => {
    console.error(`📧 Email job ${job?.id} (${job?.name}) failed:`, error);
  });

  console.log(`📧 Email worker started (queue: "${EMAIL_QUEUE_NAME}", concurrency: 10)`);

  return worker;
}

if (require.main === module) {
  startEmailWorker();
}

module.exports = { createEmailWorker, startEmailWorker };
