import timeTableProjectPhoto from "../../images/time_table_project.jpg"
import groupMeetPlannerProjectPhoto from "../../images/group_meet_planner_project.jpg";
import eventPortalProjectPhoto from "../../images/event_portal_project.jpg"

export const Project1Data = {
    id: "project 1",
    title: "Uni TimeTable Companion",
    description:"An app to manage Weekly Recurring Time Table for Universities Hall availability checking, Seminar management, Subject management, and Personal task management for both Students and Lecturers.",
    technologies: "Flutter Firebase Cloud Firestore", 
    projectImg: timeTableProjectPhoto,
    gitHubUrl: "https://github.com/melanga/university-timetable-companion-app",
    projectUrl: "https://github.com/melanga/university-timetable-companion-app"
}

export const Project2Data = {
    id: "project 2",
    title: "Event Portal",
    description:"Web Portal for Event Service Providers & Customers. A communicative platform for event-related service providers and customers with a location and rating-based searching system and integrated chat service.",
    technologies: "PERN Redux Socket.io",
    projectImg: eventPortalProjectPhoto,
    gitHubUrl: "https://github.com/melanga/event-portal",
    projectUrl: "https://github.com/melanga/event-portal"
}

export const Project3Data = {
    id: "project 3",
    title: "Group Meet Planner",
    description:"It is a pain to schedule group meetings which is suitable for every group member. This web application helps users in creating groups and input available time so the app will calculate meeting times suitable for all members.",
    technologies: "Django SQLite Docker",
    projectImg: groupMeetPlannerProjectPhoto,
    gitHubUrl: "https://github.com/melanga/GroupMeetPlanner",
    projectUrl: "https://github.com/melanga/GroupMeetPlanner"
}