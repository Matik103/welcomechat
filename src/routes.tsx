import { RouteObject } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import { AuthPage } from "@/pages/Auth";
import { PricingPage } from "@/pages/Pricing";
import { ContactPage } from "@/pages/Contact";
import { AboutPage } from "@/pages/About";
import { TermsPage } from "@/pages/Terms";
import { PrivacyPage } from "@/pages/Privacy";
import { NotFoundPage } from "@/pages/NotFound";
import { DashboardPage } from "@/pages/Dashboard";
import { ClientDashboardPage } from "@/pages/ClientDashboard";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboard";
import { AdminClientsPage } from "@/pages/admin/AdminClients";
import DocumentExtractionPage from "@/pages/admin/DocumentExtraction";
import { SettingsPage } from "@/pages/Settings";
import { ClientSettingsPage } from "@/pages/ClientSettings";
import { NewClientPage } from "@/pages/NewClient";
import { SubscriptionPage } from "@/pages/Subscription";
import { ClientSubscriptionPage } from "@/pages/ClientSubscription";
import { AdminAgentsPage } from "@/pages/admin/AdminAgents";
import { AgentSettingsPage } from "@/pages/AgentSettings";
import { ClientAgentSettingsPage } from "@/pages/ClientAgentSettings";
import { AdminUsersPage } from "@/pages/admin/AdminUsers";
import { AdminInvoicesPage } from "@/pages/admin/AdminInvoices";
import { ClientInvoicesPage } from "@/pages/ClientInvoices";
import { AdminSettingsPage } from "@/pages/admin/AdminSettings";
import { AdminApiKeyPage } from "@/pages/admin/AdminApiKey";
import { AdminUsagePage } from "@/pages/admin/AdminUsage";
import { AdminEmailPage } from "@/pages/admin/AdminEmail";
import { AdminNotificationsPage } from "@/pages/admin/AdminNotifications";
import { ClientNotificationsPage } from "@/pages/ClientNotifications";
import { AdminLogsPage } from "@/pages/admin/AdminLogs";
import { AdminPromotionsPage } from "@/pages/admin/AdminPromotions";
import { AdminTasksPage } from "@/pages/admin/AdminTasks";
import { AdminFeedbackPage } from "@/pages/admin/AdminFeedback";
import { AdminSupportPage } from "@/pages/admin/AdminSupport";
import { ClientSupportPage } from "@/pages/ClientSupport";
import { AdminBillingPage } from "@/pages/admin/AdminBilling";
import { ClientBillingPage } from "@/pages/ClientBilling";
import { AdminIntegrationsPage } from "@/pages/admin/AdminIntegrations";
import { ClientIntegrationsPage } from "@/pages/ClientIntegrations";
import { AdminKnowledgeBasePage } from "@/pages/admin/AdminKnowledgeBase";
import { ClientKnowledgeBasePage } from "@/pages/ClientKnowledgeBase";
import { AdminSecurityPage } from "@/pages/admin/AdminSecurity";
import { ClientSecurityPage } from "@/pages/ClientSecurity";
import { AdminCompliancePage } from "@/pages/admin/AdminCompliance";
import { ClientCompliancePage } from "@/pages/ClientCompliance";
import { AdminGDPRPage } from "@/pages/admin/AdminGDPR";
import { ClientGDPRPage } from "@/pages/ClientGDPR";
import { AdminAuditLogsPage } from "@/pages/admin/AdminAuditLogs";
import { ClientAuditLogsPage } from "@/pages/ClientAuditLogs";
import { AdminTrainingPage } from "@/pages/admin/AdminTraining";
import { ClientTrainingPage } from "@/pages/ClientTraining";
import { AdminConsultingPage } from "@/pages/admin/AdminConsulting";
import { ClientConsultingPage } from "@/pages/ClientConsulting";
import { AdminEbooksPage } from "@/pages/admin/AdminEbooks";
import { ClientEbooksPage } from "@/pages/ClientEbooks";
import { AdminWebinarsPage } from "@/pages/admin/AdminWebinars";
import { ClientWebinarsPage } from "@/pages/ClientWebinars";
import { AdminCaseStudiesPage } from "@/pages/admin/AdminCaseStudies";
import { ClientCaseStudiesPage } from "@/pages/ClientCaseStudies";
import { AdminTemplatesPage } from "@/pages/admin/AdminTemplates";
import { ClientTemplatesPage } from "@/pages/ClientTemplates";
import { AdminChecklistsPage } from "@/pages/admin/AdminChecklists";
import { ClientChecklistsPage } from "@/pages/ClientChecklists";
import { AdminCalculatorsPage } from "@/pages/admin/AdminCalculators";
import { ClientCalculatorsPage } from "@/pages/ClientCalculators";
import { AdminGeneratorsPage } from "@/pages/admin/AdminGenerators";
import { ClientGeneratorsPage } from "@/pages/ClientGenerators";
import { AdminToolsPage } from "@/pages/admin/AdminTools";
import { ClientToolsPage } from "@/pages/ClientTools";
import { AdminMarketplacePage } from "@/pages/admin/AdminMarketplace";
import { ClientMarketplacePage } from "@/pages/ClientMarketplace";
import { AdminPartnersPage } from "@/pages/admin/AdminPartners";
import { ClientPartnersPage } from "@/pages/ClientPartners";
import { AdminAffiliatesPage } from "@/pages/admin/AdminAffiliates";
import { ClientAffiliatesPage } from "@/pages/ClientAffiliates";
import { AdminReferralsPage } from "@/pages/admin/AdminReferrals";
import { ClientReferralsPage } from "@/pages/ClientReferrals";
import { AdminRewardsPage } from "@/pages/admin/AdminRewards";
import { ClientRewardsPage } from "@/pages/ClientRewards";
import { AdminEventsPage } from "@/pages/admin/AdminEvents";
import { ClientEventsPage } from "@/pages/ClientEvents";
import { AdminCommunityPage } from "@/pages/admin/AdminCommunity";
import { ClientCommunityPage } from "@/pages/ClientCommunity";
import { AdminDirectoryPage } from "@/pages/admin/AdminDirectory";
import { ClientDirectoryPage } from "@/pages/ClientDirectory";
import { AdminResourcesPage } from "@/pages/admin/AdminResources";
import { ClientResourcesPage } from "@/pages/ClientResources";
import { AdminFAQPage } from "@/pages/admin/AdminFAQ";
import { ClientFAQPage } from "@/pages/ClientFAQ";
import { AdminGlossaryPage } from "@/pages/admin/AdminGlossary";
import { ClientGlossaryPage } from "@/pages/ClientGlossary";
import { AdminBlogPage } from "@/pages/admin/AdminBlog";
import { ClientBlogPage } from "@/pages/ClientBlog";
import { AdminNewsPage } from "@/pages/admin/AdminNews";
import { ClientNewsPage } from "@/pages/ClientNews";
import { AdminReleasesPage } from "@/pages/admin/AdminReleases";
import { ClientReleasesPage } from "@/pages/ClientReleases";
import { AdminRoadmapPage } from "@/pages/admin/AdminRoadmap";
import { ClientRoadmapPage } from "@/pages/ClientRoadmap";
import { AdminStatusPage } from "@/pages/admin/AdminStatus";
import { ClientStatusPage } from "@/pages/ClientStatus";
import { AdminExperimentsPage } from "@/pages/admin/AdminExperiments";
import { ClientExperimentsPage } from "@/pages/ClientExperiments";
import { AdminLabsPage } from "@/pages/admin/AdminLabs";
import { ClientLabsPage } from "@/pages/ClientLabs";
import { AdminFeedbackProgramPage } from "@/pages/admin/AdminFeedbackProgram";
import { ClientFeedbackProgramPage } from "@/pages/ClientFeedbackProgram";
import { AdminAmbassadorsPage } from "@/pages/admin/AdminAmbassadors";
import { ClientAmbassadorsPage } from "@/pages/ClientAmbassadors";
import { AdminBetaProgramPage } from "@/pages/admin/AdminBetaProgram";
import { ClientBetaProgramPage } from "@/pages/ClientBetaProgram";
import { AdminEarlyAccessPage } from "@/pages/admin/AdminEarlyAccess";
import { ClientEarlyAccessPage } from "@/pages/ClientEarlyAccess";
import { AdminWishlistPage } from "@/pages/admin/AdminWishlist";
import { ClientWishlistPage } from "@/pages/ClientWishlist";
import { AdminIdeasPage } from "@/pages/admin/AdminIdeas";
import { ClientIdeasPage } from "@/pages/ClientIdeas";
import { AdminSuggestionsPage } from "@/pages/admin/AdminSuggestions";
import { ClientSuggestionsPage } from "@/pages/ClientSuggestions";
import { AdminTestimonialsPage } from "@/pages/admin/AdminTestimonials";
import { ClientTestimonialsPage } from "@/pages/ClientTestimonials";
import { AdminReviewsPage } from "@/pages/admin/AdminReviews";
import { ClientReviewsPage } from "@/pages/ClientReviews";
import { AdminCaseStudiesDirectoryPage } from "@/pages/admin/AdminCaseStudiesDirectory";
import { ClientCaseStudiesDirectoryPage } from "@/pages/ClientCaseStudiesDirectory";
import { AdminWhitepapersPage } from "@/pages/admin/AdminWhitepapers";
import { ClientWhitepapersPage } from "@/pages/ClientWhitepapers";
import { AdminReportsPage } from "@/pages/admin/AdminReports";
import { ClientReportsPage } from "@/pages/ClientReports";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalytics";
import { ClientAnalyticsPage } from "@/pages/ClientAnalytics";
import { AdminMetricsPage } from "@/pages/admin/AdminMetrics";
import { ClientMetricsPage } from "@/pages/ClientMetrics";
import { AdminDashboardsPage } from "@/pages/admin/AdminDashboards";
import { ClientDashboardsPage } from "@/pages/ClientDashboards";
import { AdminAutomationPage } from "@/pages/admin/AdminAutomation";
import { ClientAutomationPage } from "@/pages/ClientAutomation";
import { AdminWorkflowsPage } from "@/pages/admin/AdminWorkflows";
import { ClientWorkflowsPage } from "@/pages/ClientWorkflows";
import { AdminIntegrationsDirectoryPage } from "@/pages/admin/AdminIntegrationsDirectory";
import { ClientIntegrationsDirectoryPage } from "@/pages/ClientIntegrationsDirectory";
import { AdminAPIPage } from "@/pages/admin/AdminAPI";
import { ClientAPIPage } from "@/pages/ClientAPI";
import { AdminSDKPage } from "@/pages/admin/AdminSDK";
import { ClientSDKPage } from "@/pages/ClientSDK";
import { AdminPluginsPage } from "@/pages/admin/AdminPlugins";
import { ClientPluginsPage } from "@/pages/ClientPlugins";
import { AdminExtensionsPage } from "@/pages/admin/AdminExtensions";
import { ClientExtensionsPage } from "@/pages/ClientExtensions";
import { AdminAddonsPage } from "@/pages/admin/AdminAddons";
import { ClientAddonsPage } from "@/pages/ClientAddons";
import { AdminModulesPage } from "@/pages/admin/AdminModules";
import { ClientModulesPage } from "@/pages/ClientModules";
import { AdminComponentsPage } from "@/pages/admin/AdminComponents";
import { ClientComponentsPage } from "@/pages/ClientComponents";
import { AdminTemplatesDirectoryPage } from "@/pages/admin/AdminTemplatesDirectory";
import { ClientTemplatesDirectoryPage } from "@/pages/ClientTemplatesDirectory";
import { AdminThemesPage } from "@/pages/admin/AdminThemes";
import { ClientThemesPage } from "@/pages/ClientThemes";
import { AdminStylesPage } from "@/pages/admin/AdminStyles";
import { ClientStylesPage } from "@/pages/ClientStyles";
import { AdminDesignPage } from "@/pages/admin/AdminDesign";
import { ClientDesignPage } from "@/pages/ClientDesign";
import { AdminBrandingPage } from "@/pages/admin/AdminBranding";
import { ClientBrandingPage } from "@/pages/ClientBranding";
import { AdminLocalizationPage } from "@/pages/admin/AdminLocalization";
import { ClientLocalizationPage } from "@/pages/ClientLocalization";
import { AdminAccessibilityPage } from "@/pages/admin/AdminAccessibility";
import { ClientAccessibilityPage } from "@/pages/ClientAccessibility";
import { AdminPerformancePage } from "@/pages/admin/AdminPerformance";
import { ClientPerformancePage } from "@/pages/ClientPerformance";
import { AdminScalabilityPage } from "@/pages/admin/AdminScalability";
import { ClientScalabilityPage } from "@/pages/ClientScalability";
import { AdminReliabilityPage } from "@/pages/admin/AdminReliability";
import { ClientReliabilityPage } from "@/pages/ClientReliability";
import { AdminSecurityAuditsPage } from "@/pages/admin/AdminSecurityAudits";
import { ClientSecurityAuditsPage } from "@/pages/ClientSecurityAudits";
import { AdminPrivacyShieldPage } from "@/pages/admin/AdminPrivacyShield";
import { ClientPrivacyShieldPage } from "@/pages/ClientPrivacyShield";
import { AdminTermsOfServicePage } from "@/pages/admin/AdminTermsOfService";
import { ClientTermsOfServicePage } from "@/pages/ClientTermsOfService";
import { AdminLegalPage } from "@/pages/admin/AdminLegal";
import { ClientLegalPage } from "@/pages/ClientLegal";
import { AdminComplianceReportsPage } from "@/pages/admin/AdminComplianceReports";
import { ClientComplianceReportsPage } from "@/pages/ClientComplianceReports";
import { AdminRiskAssessmentsPage } from "@/pages/admin/AdminRiskAssessments";
import { ClientRiskAssessmentsPage } from "@/pages/ClientRiskAssessments";
import { AdminDataBreachResponsePage } from "@/pages/admin/AdminDataBreachResponse";
import { ClientDataBreachResponsePage } from "@/pages/ClientDataBreachResponse";
import { AdminInsurancePage } from "@/pages/admin/AdminInsurance";
import { ClientInsurancePage } from "@/pages/ClientInsurance";
import { AdminCertificationsPage } from "@/pages/admin/AdminCertifications";
import { ClientCertificationsPage } from "@/pages/ClientCertifications";
import { AdminTrainingProgramsPage } from "@/pages/admin/AdminTrainingPrograms";
import { ClientTrainingProgramsPage } from "@/pages/ClientTrainingPrograms";
import { AdminConsultingServicesPage } from "@/pages/admin/AdminConsultingServices";
import { ClientConsultingServicesPage } from "@/pages/ClientConsultingServices";
import { AdminEbooksDirectoryPage } from "@/pages/admin/AdminEbooksDirectory";
import { ClientEbooksDirectoryPage } from "@/pages/ClientEbooksDirectory";
import { AdminWebinarsDirectoryPage } from "@/pages/admin/AdminWebinarsDirectory";
import { ClientWebinarsDirectoryPage } from "@/pages/ClientWebinarsDirectory";
import { AdminSupportChannelsPage } from "@/pages/admin/AdminSupportChannels";
import { ClientSupportChannelsPage } from "@/pages/ClientSupportChannels";
import { AdminKnowledgeBaseDirectoryPage } from "@/pages/admin/AdminKnowledgeBaseDirectory";
import { ClientKnowledgeBaseDirectoryPage } from "@/pages/ClientKnowledgeBaseDirectory";
import { AdminCommunityForumsPage } from "@/pages/admin/AdminCommunityForums";
import { ClientCommunityForumsPage } from "@/pages/ClientCommunityForums";
import { AdminEventsCalendarPage } from "@/pages/admin/AdminEventsCalendar";
import { ClientEventsCalendarPage } from "@/pages/ClientEventsCalendar";
import { AdminMarketplaceDirectoryPage } from "@/pages/admin/AdminMarketplaceDirectory";
import { ClientMarketplaceDirectoryPage } from "@/pages/ClientMarketplaceDirectory";
import { AdminAppStorePage } from "@/pages/admin/AdminAppStore";
import { ClientAppStorePage } from "@/pages/ClientAppStore";
import { AdminPartnerNetworkPage } from "@/pages/admin/AdminPartnerNetwork";
import { ClientPartnerNetworkPage } from "@/pages/ClientPartnerNetwork";
import { AdminAffiliateProgramPage } from "@/pages/admin/AdminAffiliateProgram";
import { ClientAffiliateProgramPage } from "@/pages/ClientAffiliateProgram";
import { AdminReferralProgramPage } from "@/pages/admin/AdminReferralProgram";
import { ClientReferralProgramPage } from "@/pages/ClientReferralProgram";
import { AdminRewardProgramsPage } from "@/pages/admin/AdminRewardPrograms";
import { ClientRewardProgramsPage } from "@/pages/ClientRewardPrograms";
import { StorageBrowserPage } from "@/pages/admin/StorageBrowser";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/client/:clientId",
    element: <ClientDashboardPage />,
  },
  {
    path: "/admin",
    element: <AdminDashboardPage />,
  },
  {
    path: "/admin/clients",
    element: <AdminClientsPage />,
  },
  {
    path: "/admin/document-extraction",
    element: <DocumentExtractionPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/client/:clientId/settings",
    element: <ClientSettingsPage />,
  },
  {
    path: "/new-client",
    element: <NewClientPage />,
  },
  {
    path: "/subscription",
    element: <SubscriptionPage />,
  },
  {
    path: "/client/:clientId/subscription",
    element: <ClientSubscriptionPage />,
  },
  {
    path: "/admin/agents",
    element: <AdminAgentsPage />,
  },
  {
    path: "/agent/:agentId/settings",
    element: <AgentSettingsPage />,
  },
  {
    path: "/client/:clientId/agent/:agentId/settings",
    element: <ClientAgentSettingsPage />,
  },
  {
    path: "/admin/users",
    element: <AdminUsersPage />,
  },
  {
    path: "/admin/invoices",
    element: <AdminInvoicesPage />,
  },
  {
    path: "/client/:clientId/invoices",
    element: <ClientInvoicesPage />,
  },
  {
    path: "/admin/settings",
    element: <AdminSettingsPage />,
  },
  {
    path: "/admin/api-key",
    element: <AdminApiKeyPage />,
  },
  {
    path: "/admin/usage",
    element: <AdminUsagePage />,
  },
  {
    path: "/admin/email",
    element: <AdminEmailPage />,
  },
  {
    path: "/admin/notifications",
    element: <AdminNotificationsPage />,
  },
  {
    path: "/client/:clientId/notifications",
    element: <ClientNotificationsPage />,
  },
  {
    path: "/admin/logs",
    element: <AdminLogsPage />,
  },
  {
    path: "/admin/promotions",
    element: <AdminPromotionsPage />,
  },
  {
    path: "/admin/tasks",
    element: <AdminTasksPage />,
  },
  {
    path: "/admin/feedback",
    element: <AdminFeedbackPage />,
  },
  {
    path: "/admin/support",
    element: <AdminSupportPage />,
  },
  {
    path: "/client/:clientId/support",
    element: <ClientSupportPage />,
  },
  {
    path: "/admin/billing",
    element: <AdminBillingPage />,
  },
  {
    path: "/client/:clientId/billing",
    element: <ClientBillingPage />,
  },
  {
    path: "/admin/integrations",
    element: <AdminIntegrationsPage />,
  },
  {
    path: "/client/:clientId/integrations",
    element: <ClientIntegrationsPage />,
  },
  {
    path: "/admin/knowledge-base",
    element: <AdminKnowledgeBasePage />,
  },
  {
    path: "/client/:clientId/knowledge-base",
    element: <ClientKnowledgeBasePage />,
  },
  {
    path: "/admin/security",
    element: <AdminSecurityPage />,
  },
  {
    path: "/client/:clientId/security",
    element: <ClientSecurityPage />,
  },
  {
    path: "/admin/compliance",
    element: <AdminCompliancePage />,
  },
  {
    path: "/client/:clientId/compliance",
    element: <ClientCompliancePage />,
  },
  {
    path: "/admin/gdpr",
    element: <AdminGDPRPage />,
  },
  {
    path: "/client/:clientId/gdpr",
    element: <ClientGDPRPage />,
  },
  {
    path: "/admin/audit-logs",
    element: <AdminAuditLogsPage />,
  },
  {
    path: "/client/:clientId/audit-logs",
    element: <ClientAuditLogsPage />,
  },
  {
    path: "/admin/training",
    element: <AdminTrainingPage />,
  },
  {
    path: "/client/:clientId/training",
    element: <ClientTrainingPage />,
  },
  {
    path: "/admin/consulting",
    element: <AdminConsultingPage />,
  },
  {
    path: "/client/:clientId/consulting",
    element: <ClientConsultingPage />,
  },
  {
    path: "/admin/ebooks",
    element: <AdminEbooksPage />,
  },
  {
    path: "/client/:clientId/ebooks",
    element: <ClientEbooksPage />,
  },
  {
    path: "/admin/webinars",
    element: <AdminWebinarsPage />,
  },
  {
    path: "/client/:clientId/webinars",
    element: <ClientWebinarsPage />,
  },
  {
    path: "/admin/case-studies",
    element: <AdminCaseStudiesPage />,
  },
  {
    path: "/client/:clientId/case-studies",
    element: <ClientCaseStudiesPage />,
  },
  {
    path: "/admin/templates",
    element: <AdminTemplatesPage />,
  },
  {
    path: "/client/:clientId/templates",
    element: <ClientTemplatesPage />,
  },
  {
    path: "/admin/checklists",
    element: <AdminChecklistsPage />,
  },
  {
    path: "/client/:clientId/checklists",
    element: <ClientChecklistsPage />,
  },
  {
    path: "/admin/calculators",
    element: <AdminCalculatorsPage />,
  },
  {
    path: "/client/:clientId/calculators",
    element: <ClientCalculatorsPage />,
  },
  {
    path: "/admin/generators",
    element: <AdminGeneratorsPage />,
  },
  {
    path: "/client/:clientId/generators",
    element: <ClientGeneratorsPage />,
  },
  {
    path: "/admin/tools",
    element: <AdminToolsPage />,
  },
  {
    path: "/client/:clientId/tools",
    element: <ClientToolsPage />,
  },
  {
    path: "/admin/marketplace",
    element: <AdminMarketplacePage />,
  },
  {
    path: "/client/:clientId/marketplace",
    element: <ClientMarketplacePage />,
  },
  {
    path: "/admin/partners",
    element: <AdminPartnersPage />,
  },
  {
    path: "/client/:clientId/partners",
    element: <ClientPartnersPage />,
  },
  {
    path: "/admin/affiliates",
    element: <AdminAffiliatesPage />,
  },
  {
    path: "/client/:clientId/affiliates",
    element: <ClientAffiliatesPage />,
  },
  {
    path: "/admin/referrals",
    element: <AdminReferralsPage />,
  },
  {
    path: "/client/:clientId/referrals",
    element: <ClientReferralsPage />,
  },
  {
    path: "/admin/rewards",
    element: <AdminRewardsPage />,
  },
  {
    path: "/client/:clientId/rewards",
    element: <ClientRewardsPage />,
  },
  {
    path: "/admin/events",
    element: <AdminEventsPage />,
  },
  {
    path: "/client/:clientId/events",
    element: <ClientEventsPage />,
  },
  {
    path: "/admin/community",
    element: <AdminCommunityPage />,
  },
  {
    path: "/client/:clientId/community",
    element: <ClientCommunityPage />,
  },
  {
    path: "/admin/directory",
    element: <AdminDirectoryPage />,
  },
  {
    path: "/client/:clientId/directory",
    element: <ClientDirectoryPage />,
  },
  {
    path: "/admin/resources",
    element: <AdminResourcesPage />,
  },
  {
    path: "/client/:clientId/resources",
    element: <ClientResourcesPage />,
  },
  {
    path: "/admin/faq",
    element: <AdminFAQPage />,
  },
  {
    path: "/client/:clientId/faq",
    element: <ClientFAQPage />,
  },
  {
    path: "/admin/glossary",
    element: <AdminGlossaryPage />,
  },
  {
    path: "/client/:clientId/glossary",
    element: <ClientGlossaryPage />,
  },
  {
    path: "/admin/blog",
    element: <AdminBlogPage />,
  },
  {
    path: "/client/:clientId/blog",
    element: <ClientBlogPage />,
  },
  {
    path: "/admin/news",
    element: <AdminNewsPage />,
  },
  {
    path: "/client/:clientId/news",
    element: <ClientNewsPage />,
  },
  {
    path: "/admin/releases",
    element: <AdminReleasesPage />,
  },
  {
    path: "/client/:clientId/releases",
    element: <ClientReleasesPage />,
  },
  {
    path: "/admin/roadmap",
    element: <AdminRoadmapPage />,
  },
  {
    path: "/client/:clientId/roadmap",
    element: <ClientRoadmapPage />,
  },
  {
    path: "/admin/status",
    element: <AdminStatusPage />,
  },
  {
    path: "/client/:clientId/status",
    element: <ClientStatusPage />,
  },
  {
    path: "/admin/experiments",
    element: <AdminExperimentsPage />,
  },
  {
    path: "/client/:clientId/experiments",
    element: <ClientExperimentsPage />,
  },
  {
    path: "/admin/labs",
    element: <AdminLabsPage />,
  },
  {
    path: "/client/:clientId/labs",
    element: <ClientLabsPage />,
  },
  {
    path: "/admin/feedback-program",
    element: <AdminFeedbackProgramPage />,
  },
  {
    path: "/client/:clientId/feedback-program",
    element: <ClientFeedbackProgramPage />,
  },
  {
    path: "/admin/ambassadors",
    element: <AdminAmbassadorsPage />,
  },
  {
    path: "/client/:clientId/ambassadors",
    element: <ClientAmbassadorsPage />,
  },
  {
    path: "/admin/beta-program",
    element: <AdminBetaProgramPage />,
  },
  {
    path: "/client/:clientId/beta-program",
    element: <ClientBetaProgramPage />,
  },
  {
    path: "/admin/early-access",
    element: <AdminEarlyAccessPage />,
  },
  {
    path: "/client/:clientId/early-access",
    element: <ClientEarlyAccessPage />,
  },
  {
    path: "/admin/wishlist",
    element: <AdminWishlistPage />,
  },
  {
    path: "/client/:clientId/wishlist",
    element: <ClientWishlistPage />,
  },
  {
    path: "/admin/ideas",
    element: <AdminIdeasPage />,
  },
  {
    path: "/client/:clientId/ideas",
    element: <ClientIdeasPage />,
  },
  {
    path: "/admin/suggestions",
    element: <AdminSuggestionsPage />,
  },
  {
    path: "/client/:clientId/suggestions",
    element: <ClientSuggestionsPage />,
  },
  {
    path: "/admin/testimonials",
    element: <AdminTestimonialsPage />,
  },
  {
    path: "/client/:clientId/testimonials",
    element: <ClientTestimonialsPage />,
  },
  {
    path: "/admin/reviews",
    element: <AdminReviewsPage />,
  },
  {
    path: "/client/:clientId/reviews",
    element: <ClientReviewsPage />,
  },
  {
    path: "/admin/case-studies-directory",
    element: <AdminCaseStudiesDirectoryPage />,
  },
  {
    path: "/client/:clientId/case-studies-directory",
    element: <ClientCaseStudiesDirectoryPage />,
  },
  {
    path: "/admin/whitepapers",
    element: <AdminWhitepapersPage />,
  },
  {
    path: "/client/:clientId/whitepapers",
    element: <ClientWhitepapersPage />,
  },
  {
    path: "/admin/reports",
    element: <AdminReportsPage />,
  },
  {
    path: "/client/:clientId/reports",
    element: <ClientReportsPage />,
  },
  {
    path: "/admin/analytics",
    element: <AdminAnalyticsPage />,
  },
  {
    path: "/client/:clientId/analytics",
    element: <ClientAnalyticsPage />,
  },
  {
    path: "/admin/metrics",
    element: <AdminMetricsPage />,
  },
  {
    path: "/client/:clientId/metrics",
    element: <ClientMetricsPage />,
  },
  {
    path: "/admin/dashboards",
    element: <AdminDashboardsPage />,
  },
  {
    path: "/client/:clientId/dashboards",
    element: <ClientDashboardsPage />,
  },
  {
    path: "/admin/automation",
    element: <AdminAutomationPage />,
  },
  {
    path: "/client/:clientId/automation",
    element: <ClientAutomationPage />,
  },
  {
    path: "/admin/workflows",
    element: <AdminWorkflowsPage />,
  },
  {
    path: "/client/:clientId/workflows",
    element: <ClientWorkflowsPage />,
  },
  {
    path: "/admin/integrations-directory",
    element: <AdminIntegrationsDirectoryPage />,
  },
  {
    path: "/client/:clientId/integrations-directory",
    element: <ClientIntegrationsDirectoryPage />,
  },
  {
    path: "/admin/api",
    element: <AdminAPIPage />,
  },
  {
    path: "/client/:clientId/api",
    element: <ClientAPIPage />,
  },
  {
    path: "/admin/sdk",
    element: <AdminSDKPage />,
  },
  {
    path: "/client/:clientId/sdk",
    element: <ClientSDKPage />,
  },
  {
    path: "/admin/plugins",
    element: <AdminPluginsPage />,
  },
  {
    path: "/client/:clientId/plugins",
    element: <ClientPluginsPage />,
  },
  {
    path: "/admin/extensions",
    element: <AdminExtensionsPage />,
  },
  {
    path: "/client/:clientId/extensions",
    element: <ClientExtensionsPage />,
  },
  {
    path: "/admin/addons",
    element: <AdminAddonsPage />,
  },
  {
    path: "/client/:clientId/addons",
    element: <ClientAddonsPage />,
  },
  {
    path: "/admin/modules",
    element: <AdminModulesPage />,
  },
  {
    path: "/client/:clientId/modules",
    element: <ClientModulesPage />,
  },
  {
    path: "/admin/components",
    element: <AdminComponentsPage />,
  },
  {
    path: "/client/:clientId/components",
    element: <ClientComponentsPage />,
  },
  {
    path: "/admin/templates-directory",
    element: <AdminTemplatesDirectoryPage />,
  },
  {
    path: "/client/:clientId/templates-directory",
    element: <ClientTemplatesDirectoryPage />,
  },
  {
    path: "/admin/themes",
    element: <AdminThemesPage />,
  },
  {
    path: "/client/:clientId/themes",
    element: <ClientThemesPage />,
  },
  {
    path: "/admin/styles",
    element: <AdminStylesPage />,
  },
  {
    path: "/client/:clientId/styles",
    element: <ClientStylesPage />,
  },
  {
    path: "/admin/design",
    element: <AdminDesignPage />,
  },
  {
    path: "/client/:clientId/design",
    element: <ClientDesignPage />,
  },
  {
    path: "/admin/branding",
    element: <AdminBrandingPage />,
  },
  {
    path: "/client/:clientId/branding",
    element: <ClientBrandingPage />,
  },
  {
    path: "/admin/localization",
    element: <AdminLocalizationPage />,
  },
  {
    path: "/client/:clientId/localization",
    element: <ClientLocalizationPage />,
  },
  {
    path: "/admin/accessibility",
    element: <AdminAccessibilityPage />,
  },
  {
    path: "/client/:clientId/accessibility",
    element: <ClientAccessibilityPage />,
  },
  {
    path: "/admin/performance",
    element: <AdminPerformancePage />,
  },
  {
    path: "/client/:clientId/performance",
    element: <ClientPerformancePage />,
  },
  {
    path: "/admin/scalability",
    element: <AdminScalabilityPage />,
  },
  {
    path: "/client/:clientId/scalability",
    element: <ClientScalabilityPage />,
  },
  {
    path: "/admin/reliability",
    element: <AdminReliabilityPage />,
  },
  {
    path: "/client/:clientId/reliability",
    element: <ClientReliabilityPage />,
  },
  {
    path: "/admin/security-audits",
    element: <AdminSecurityAuditsPage />,
  },
  {
    path: "/client/:clientId/security-audits",
    element: <ClientSecurityAuditsPage />,
  },
  {
    path: "/admin/privacy-shield",
    element: <AdminPrivacyShieldPage />,
  },
  {
    path: "/client/:clientId/privacy-shield",
    element: <ClientPrivacyShieldPage />,
  },
  {
    path: "/admin/terms-of-service",
    element: <AdminTermsOfServicePage />,
  },
  {
    path: "/client/:clientId/terms-of-service",
    element: <ClientTermsOfServicePage />,
  },
  {
    path: "/admin/legal",
    element: <AdminLegalPage />,
  },
  {
    path: "/client/:clientId/legal",
    element: <ClientLegalPage />,
  },
  {
    path: "/admin/compliance-reports",
    element: <AdminComplianceReportsPage />,
  },
  {
    path: "/client/:clientId/compliance-reports",
    element: <ClientComplianceReportsPage />,
  },
  {
    path: "/admin/risk-assessments",
    element: <AdminRiskAssessmentsPage />,
  },
  {
    path: "/client/:clientId/risk-assessments",
    element: <ClientRiskAssessmentsPage />,
  },
  {
    path: "/admin/data-breach-response",
    element: <AdminDataBreachResponsePage />,
  },
  {
    path: "/client/:clientId/data-breach-response",
    element: <ClientDataBreachResponsePage />,
  },
  {
    path: "/admin/insurance",
    element: <AdminInsurancePage />,
  },
  {
    path: "/client/:clientId/insurance",
    element: <ClientInsurancePage />,
  },
  {
    path: "/admin/certifications",
    element: <AdminCertificationsPage />,
  },
  {
    path: "/client/:clientId/certifications",
    element: <ClientCertificationsPage />,
  },
  {
    path: "/admin/training-programs",
    element: <AdminTrainingProgramsPage />,
  },
  {
    path: "/client/:clientId/training-programs",
    element: <ClientTrainingProgramsPage />,
  },
  {
    path: "/admin/consulting-services",
    element: <AdminConsultingServicesPage />,
  },
  {
    path: "/client/:clientId/consulting-services",
    element: <ClientConsultingServicesPage />,
  },
  {
    path: "/admin/ebooks-directory",
    element: <AdminEbooksDirectoryPage />,
  },
  {
    path: "/client/:clientId/ebooks-directory",
    element: <ClientEbooksDirectoryPage />,
  },
  {
    path: "/admin/webinars-directory",
    element: <AdminWebinarsDirectoryPage />,
  },
  {
    path: "/client/:clientId/webinars-directory",
    element: <ClientWebinarsDirectoryPage />,
  },
  {
    path: "/admin/support-channels",
    element: <AdminSupportChannelsPage />,
  },
  {
    path: "/client/:clientId/support-channels",
    element: <ClientSupportChannelsPage />,
  },
  {
    path: "/admin/knowledge-base-directory",
    element: <AdminKnowledgeBaseDirectoryPage />,
  },
  {
    path: "/client/:clientId/knowledge-base-directory",
    element: <ClientKnowledgeBaseDirectoryPage />,
  },
  {
    path: "/admin/community-forums",
    element: <AdminCommunityForumsPage />,
  },
  {
    path: "/client/:clientId/community-forums",
    element: <ClientCommunityForumsPage />,
  },
  {
    path: "/admin/events-calendar",
    element: <AdminEventsCalendarPage />,
  },
  {
    path: "/client/:clientId/events-calendar",
    element: <ClientEventsCalendarPage />,
  },
  {
    path: "/admin/marketplace-directory",
    element: <AdminMarketplaceDirectoryPage />,
  },
  {
    path: "/client/:clientId/marketplace-directory",
    element: <ClientMarketplaceDirectoryPage />,
  },
  {
    path: "/admin/app-store",
    element: <AdminAppStorePage />,
  },
  {
    path: "/client/:clientId/app-store",
    element: <ClientAppStorePage />,
  },
  {
    path: "/admin/partner-network",
    element: <AdminPartnerNetworkPage />,
  },
  {
    path: "/client/:clientId/partner-network",
    element: <ClientPartnerNetworkPage />,
  },
  {
    path: "/admin/affiliate-program",
    element: <AdminAffiliateProgramPage />,
  },
  {
    path: "/client/:clientId/affiliate-program",
    element: <ClientAffiliateProgramPage />,
  },
  {
    path: "/admin/referral-program",
    element: <AdminReferralProgramPage />,
  },
  {
    path: "/client/:clientId/referral-program",
    element: <ClientReferralProgramPage />,
  },
  {
    path: "/admin/reward-programs",
    element: <AdminRewardProgramsPage />,
  },
  {
    path: "/client/:clientId/reward-programs",
    element: <ClientRewardProgramsPage />,
  },
  {
    path: "/admin/storage-browser",
    element: <StorageBrowserPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export const routes = appRoutes;
