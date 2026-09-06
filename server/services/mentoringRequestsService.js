const prisma = require("../lib/prisma");

async function createMentoringRequest({ menteeId, mentorProfileId }) {
  const request = await prisma.mentoringRequest.create({
    data: {
      menteeId: Number(menteeId),
      mentorProfileId: Number(mentorProfileId),
      status: "WAITING_FOR_MENTOR_SLOTS",
    },
  });

  return request;
}

async function getMentoringRequestsByMentee(menteeId) {
  const requests = await prisma.mentoringRequest.findMany({
    where: {
      menteeId: Number(menteeId),
    },

    include: {
      mentorProfile: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              jobTitle: true,
              workplace: true,
              profileImageUrl: true,
            },
          },

          mentoringTopics: true,
        },
      },

      schedulingRounds: {
        include: {
          offeredSlots: true,
        },
        orderBy: {
          roundNumber: "desc",
        },
      },

      meetings: {
        orderBy: {
          attemptNumber: "desc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
}
async function cancelMentoringRequest({
  requestId,
  menteeId,
}) {
  const existingRequest =
    await prisma.mentoringRequest.findFirst({
      where: {
        id: Number(requestId),
        menteeId: Number(menteeId),
        status: {
          in: [
            "WAITING_FOR_MENTOR_SLOTS",
            "WAITING_FOR_MENTEE_SELECTION",
          ],
        },
      },
    });

  if (!existingRequest) {
    throw new Error(
      "Mentoring request cannot be cancelled"
    );
  }

  const cancelledRequest =
    await prisma.mentoringRequest.update({
      where: {
        id: Number(requestId),
      },
      data: {
        status: "CANCELLED",
      },
    });

  return cancelledRequest;
}

module.exports = {
  createMentoringRequest,
  getMentoringRequestsByMentee,
  cancelMentoringRequest,
};