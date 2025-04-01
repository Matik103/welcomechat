
import React from 'react';
import { WebsiteUrl } from '@/types/website-url';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { truncateString } from '@/utils/stringUtils';
import { ScrapabilityInfo } from './ScrapabilityInfo';

interface WebsiteUrlsTableProps {
  urls: WebsiteUrl[];
  onDelete: (id: number) => void;
  onProcess?: (website: WebsiteUrl) => void;
  isDeleting: boolean;
  isProcessing?: boolean;
  processingUrlId?: number | null;
}

export function WebsiteUrlsTable({ 
  urls, 
  onDelete, 
  onProcess, 
  isDeleting, 
  isProcessing = false,
  processingUrlId 
}: WebsiteUrlsTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              URL
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Scrapability
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Crawled
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {urls.map((url) => (
            <tr key={url.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <a 
                    href={url.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {truncateString(url.url, 40)}
                    <ExternalLink size={14} />
                  </a>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${url.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    url.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    url.status === 'failed' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {url.status || 'pending'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ScrapabilityInfo website={url} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {url.last_crawled ? new Date(url.last_crawled).toLocaleString() : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  {onProcess && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onProcess(url)}
                      disabled={isProcessing && processingUrlId === url.id}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {isProcessing && processingUrlId === url.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Process'
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(url.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
