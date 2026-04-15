/**
 * Auto-trigger notification helpers for key platform events.
 * Call these from mutation onSuccess handlers throughout the app.
 *
 * This barrel re-exports all triggers from domain-specific modules
 * for backwards-compatible dynamic imports.
 */

// Competition & judging
export {
  notifyRegistrationApproved,
  notifyRegistrationRejected,
  notifySponsorshipRequestSent,
  notifySponsorshipRequestStatusChanged,
  notifyListAssigned,
  notifyListShared,
  notifyScoreSubmitted,
  notifyCompetitionStatusChanged,
  notifyRegistrationDeadline,
  notifyCompetitionStartingSoon,
  notifyCompetitionResults,
  notifyJudgeAssigned,
  notifyCertificateIssued,
} from "./notification-triggers/competition";

// Admin review notifications
export {
  notifyAdminEntityReview,
  notifyEntityStatusChanged,
  notifyAdminExhibitionReview,
  notifyAdminCompetitionReview,
  notifyAdminAwardRequest,
  notifyAdminVerificationRequest,
  notifyAdminUnregisteredEntity,
  notifyAdminCompanyRegistration,
  notifyAdminContentReport,
  notifyAdminSupportTicket,
  notifyAdminMembershipCancellation,
} from "./notification-triggers/admin";

// Order center
export {
  notifyItemRequestSubmitted,
  notifyItemRequestReviewed,
  notifyItemRequestFulfilled,
  notifyQuoteRequestSent,
  notifySuggestionSubmitted,
  notifySuggestionReviewed,
  notifyItemDelivered,
  notifyDeadlineApproaching,
} from "./notification-triggers/order-center";

// Supplier
export {
  notifySupplierFeatured,
  notifySupplierNewReview,
  notifySupplierInquiry,
} from "./notification-triggers/supplier";

// Membership lifecycle
export {
  notifyMembershipUpgraded,
  notifyMembershipDowngraded,
  notifyMembershipRenewed,
  notifyMembershipExpiringSoon,
  notifyMembershipExpired,
  notifyMembershipCancellationSubmitted,
  notifyMembershipTrialEnding,
} from "./notification-triggers/membership";

// General / misc
export {
  notifyReportResolved,
  notifyInvoiceCreated,
  notifyInvoiceSent,
  notifyInvoicePaid,
  notifyFromTemplate,
  notifyCompanyInvitation,
  notifyWelcomeUser,
  notifyProfileVerified,
} from "./notification-triggers/general";
