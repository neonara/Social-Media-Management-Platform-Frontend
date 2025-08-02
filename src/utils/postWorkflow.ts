import { ScheduledPost } from "@/types/post";

export interface WorkflowStatus {
  canClientApprove: boolean;
  canClientReject: boolean;
  canModeratorValidate: boolean;
  canModeratorReject: boolean;
  canResubmit: boolean;
  canPublish: boolean;
  nextAction: string;
}

// Utility function to determine available workflow actions for a post
export function getWorkflowStatus(
  post: ScheduledPost,
  userRole: string,
): WorkflowStatus {
  const status = post.status || "draft";
  const isClientApproved = post.is_client_approved || false;
  const isModeratorRejected = post.is_moderator_rejected || false;

  const result: WorkflowStatus = {
    canClientApprove: false,
    canClientReject: false,
    canModeratorValidate: false,
    canModeratorReject: false,
    canResubmit: false,
    canPublish: false,
    nextAction: "No action available",
  };

  switch (status) {
    case "draft":
      if (
        userRole === "admin" ||
        userRole === "moderator" ||
        userRole === "content_manager"
      ) {
        result.nextAction = "Submit for review (requires scheduled datetime)";
      }
      break;

    case "pending":
      if (userRole === "client") {
        result.canClientApprove = !isClientApproved;
        result.canClientReject = !isClientApproved;
        result.nextAction = isClientApproved
          ? "Waiting for moderator validation"
          : "Awaiting client approval";
      }

      if (userRole === "admin" || userRole === "moderator") {
        result.canModeratorValidate = true;
        result.canModeratorReject = true;
        result.nextAction = isClientApproved
          ? "Ready for moderator validation"
          : "Can validate (with or without client approval)";
      }
      break;

    case "rejected":
      if (
        userRole === "admin" ||
        userRole === "moderator" ||
        userRole === "content_manager"
      ) {
        result.canResubmit = true;
        result.nextAction = isModeratorRejected
          ? "Can resubmit after addressing moderator feedback"
          : "Can resubmit for review";
      }
      break;

    case "scheduled":
      if (userRole === "admin" || userRole === "moderator") {
        result.canPublish = true;
        result.nextAction =
          "Can publish immediately or wait for scheduled time";
      } else {
        result.nextAction = `Scheduled for ${post.scheduled_for}`;
      }
      break;

    case "published":
      result.nextAction = "Post has been published";
      break;

    case "failed":
      if (userRole === "admin" || userRole === "moderator") {
        result.canResubmit = true;
        result.nextAction = "Can resubmit after fixing issues";
      }
      break;

    default:
      result.nextAction = "Unknown status";
  }

  return result;
}
