
import { Client } from './client';
import { DocumentLink } from './document-processing';
import { WebsiteUrl } from './website-url';

export interface ClientData {
  client: Client | null;
  isLoading: boolean;
  error: Error | null;
}

export interface ClientResourcesData {
  documentLinks: DocumentLink[];
  websiteUrls: WebsiteUrl[];
  isLoadingDocuments: boolean;
  isLoadingWebsites: boolean;
  documentsError: Error | null;
  websitesError: Error | null;
}
