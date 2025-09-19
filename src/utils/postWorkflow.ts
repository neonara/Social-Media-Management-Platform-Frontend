import { ScheduledPost } from "@/types/post";

// Helper functions for three-state boolean logic
export function getApprovalStatus(
  is_client_approved: boolean | null | undefined,
): "pending" | "approved" | "rejected" {
  if (is_client_approved === null || is_client_approved === undefined)
    return "pending";
  if (is_client_approved === true) return "approved";
  return "rejected";
}

export function getValidationStatus(
  is_moderator_validated: boolean | null | undefined,
): "pending" | "validated" | "rejected" {
  if (is_moderator_validated === null || is_moderator_validated === undefined)
    return "pending";
  if (is_moderator_validated === true) return "validated";
  return "rejected";
}

export function getApprovalStatusText(
  is_client_approved: boolean | null | undefined,
): string {
  switch (getApprovalStatus(is_client_approved)) {
    case "pending":
      return "Pending Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

export function getValidationStatusText(
  is_moderator_validated: boolean | null | undefined,
): string {
  switch (getValidationStatus(is_moderator_validated)) {
    case "pending":
      return "Pending Validation";
    case "validated":
      return "Validated";
    case "rejected":
      return "Rejected";
  }
}

// Utility functions for filtering posts by approval/validation states
export function filterPostsByApprovalStatus(
  posts: ScheduledPost[],
  status: "pending" | "approved" | "rejected",
): ScheduledPost[] {
  return posts.filter(
    (post) => getApprovalStatus(post.is_client_approved) === status,
  );
}

export function filterPostsByValidationStatus(
  posts: ScheduledPost[],
  status: "pending" | "validated" | "rejected",
): ScheduledPost[] {
  return posts.filter(
    (post) => getValidationStatus(post.is_moderator_validated) === status,
  );
}

// Get posts that are fully approved and validated
export function getFullyApprovedPosts(posts: ScheduledPost[]): ScheduledPost[] {
  return posts.filter(
    (post) =>
      getApprovalStatus(post.is_client_approved) === "approved" &&
      getValidationStatus(post.is_moderator_validated) === "validated",
  );
}

// Get posts awaiting any decision (client approval OR moderator validation)
export function getPostsAwaitingDecision(
  posts: ScheduledPost[],
): ScheduledPost[] {
  return posts.filter(
    (post) =>
      getApprovalStatus(post.is_client_approved) === "pending" ||
      getValidationStatus(post.is_moderator_validated) === "pending",
  );
}

// Get posts that have been rejected by either client or moderator
export function getRejectedPosts(posts: ScheduledPost[]): ScheduledPost[] {
  return posts.filter(
    (post) =>
      getApprovalStatus(post.is_client_approved) === "rejected" ||
      getValidationStatus(post.is_moderator_validated) === "rejected",
  );
}

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
  const clientApprovalStatus = getApprovalStatus(post.is_client_approved);
  const moderatorValidationStatus = getValidationStatus(
    post.is_moderator_validated,
  );

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
        const isPending = clientApprovalStatus === "pending";
        result.canClientApprove = isPending;
        result.canClientReject = isPending;
        result.nextAction =
          clientApprovalStatus === "approved"
            ? "Waiting for moderator validation"
            : "Awaiting client approval";
      }

      if (userRole === "admin" || userRole === "moderator") {
        result.canModeratorValidate = true;
        result.canModeratorReject = true;
        result.nextAction =
          clientApprovalStatus === "approved"
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
        result.nextAction =
          moderatorValidationStatus === "rejected"
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
