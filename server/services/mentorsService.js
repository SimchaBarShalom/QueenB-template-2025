const prisma = require("../lib/prisma");
const { CAPACITY_MEETING_STATUSES } = require("../lib/capacity");
const { currentMonthRange } = require("../lib/dates");

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

  const { start, end } = currentMonthRange();

  const meetingsThisMonth = await prisma.meeting.findMany({
    where: {
      status: { in: CAPACITY_MEETING_STATUSES },
      scheduledStart: { gte: start, lt: end },
    },
    select: {
      request: { select: { mentorProfileId: true } },
    },
  });

  const usedCapacityByMentorProfileId = new Map();

  meetingsThisMonth.forEach((meeting) => {
    const { mentorProfileId } = meeting.request;

    usedCapacityByMentorProfileId.set(
      mentorProfileId,
      (usedCapacityByMentorProfileId.get(mentorProfileId) || 0) + 1
    );
  });

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