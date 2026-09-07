const prisma = require("../lib/prisma");
const { CAPACITY_STATUSES } = require("../lib/capacity");

async function getAllMentors() {
  const mentors = await prisma.user.findMany({
    where: {
      mentorProfile: {
        isNot: null,
      },
    },

    include: {
      technologies: true,

      mentorProfile: {
        include: {
          mentoringTopics: true,
        },
      },
    },

    orderBy: {
      fullName: "asc",
    },
  });

  const usedCapacityGroups = await prisma.mentoringRequest.groupBy({
    by: ["mentorProfileId"],
    where: {
      status: { in: CAPACITY_STATUSES },
    },
    _count: { _all: true },
  });

  const usedCapacityByMentorProfileId = new Map(
    usedCapacityGroups.map((group) => [
      group.mentorProfileId,
      group._count._all,
    ])
  );

  return mentors.map((user) => {
    const meetingCapacity = user.mentorProfile.meetingCapacity;
    const usedCapacity =
      usedCapacityByMentorProfileId.get(user.mentorProfile.id) || 0;

    return {
      id: user.id,
      fullName: user.fullName,
      jobTitle: user.jobTitle,
      workplace: user.workplace,
      yearsOfExperience: user.yearsOfExperience,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,

      technologies: user.technologies.map(
        (technology) => technology.name
      ),

      mentorProfileId: user.mentorProfile.id,
      background: user.mentorProfile.background,
      meetingCapacity,
      meetingDurationMinutes:
        user.mentorProfile.meetingDurationMinutes,

      usedCapacity,
      remainingCapacity: Math.max(meetingCapacity - usedCapacity, 0),
      isFull: usedCapacity >= meetingCapacity,

      mentoringTopics:
        user.mentorProfile.mentoringTopics.map(
          (topic) => topic.name
        ),
    };
  });
}

module.exports = {
  getAllMentors,
};