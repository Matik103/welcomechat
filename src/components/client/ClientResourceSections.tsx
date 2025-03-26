
// Update for line 198
urls={websiteUrls?.map(url => ({
  ...url,
  refresh_rate: url.refresh_rate || 30,
  status: url.status as "pending" | "processing" | "failed" | "completed" || "pending"
})) || []}
