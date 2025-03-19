
import { AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the type here since it's not exported from useUrlAccessCheck
interface UrlAccessResult {
  isAccessible: boolean;
  status?: number;
  canScrape: boolean;
  hasScrapingRestrictions: boolean;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
}

interface ScrapabilityInfoProps {
  lastResult: UrlAccessResult | null;
  isValidated: boolean;
  isContentStored: boolean;
}

export const ScrapabilityInfo = ({
  lastResult,
  isValidated,
  isContentStored,
}: ScrapabilityInfoProps) => {
  if (!lastResult || !isValidated) return null;
  
  if (lastResult.canScrape === false) {
    return (
      <Alert variant="warning" className="bg-amber-50 border-amber-200 mt-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Scraping Restrictions Detected</AlertTitle>
        <AlertDescription className="text-amber-700">
          <p>This website has restrictions that may limit scraping:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {lastResult.robotsRestrictions?.map((restriction, i) => (
              <li key={`robot-${i}`}>{restriction}</li>
            ))}
            {lastResult.metaRestrictions?.map((restriction, i) => (
              <li key={`meta-${i}`}>{restriction}</li>
            ))}
            {!lastResult.robotsRestrictions?.length && !lastResult.metaRestrictions?.length && 
              <li>General restrictions detected</li>
            }
          </ul>
          <p className="mt-2">
            Your AI agent may have limited access to this website's content.
          </p>
        </AlertDescription>
      </Alert>
    );
  } else if (lastResult.hasScrapingRestrictions) {
    return (
      <Alert variant="warning" className="bg-amber-50 border-amber-200 mt-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Partial Scraping Restrictions</AlertTitle>
        <AlertDescription className="text-amber-700">
          This website has some scraping restrictions in its robots.txt file, but 
          your AI agent should still be able to access most content.
        </AlertDescription>
      </Alert>
    );
  } else {
    return (
      <Alert variant="success" className="bg-green-50 border-green-200 mt-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Fully Scrapable</AlertTitle>
        <AlertDescription className="text-green-700">
          <p>This website is accessible and can be scraped without restrictions.</p>
          {isContentStored && (
            <p className="mt-1">
              <Database className="h-4 w-4 inline-block mr-1 text-green-600" />
              Content successfully imported to your AI agent's knowledge base.
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }
};
