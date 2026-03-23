import React from 'react';
import type { NewsArticle } from '../types';
import { NewspaperIcon } from './icons/Icons';

interface FinancialNewsProps {
  articles: NewsArticle[] | null;
  isLoading: boolean;
}

const NewsSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

const FinancialNews: React.FC<FinancialNewsProps> = ({ articles, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400 flex items-center">
        <NewspaperIcon />
        <span className="ml-2">Actualités Récentes</span>
      </h3>
      {isLoading ? (
        <NewsSkeleton />
      ) : articles && articles.length > 0 ? (
        <ul className="space-y-4">
          {articles.map((article, index) => (
            <li key={index}>
              <p className="font-medium text-gray-800 dark:text-gray-200">{article.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{article.uri}</p>
              <a
                href={article.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-1 inline-block transition-colors duration-200"
              >
                Lire la suite &rarr;
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune actualité pertinente n'a été trouvée ou une analyse doit être lancée.</p>
      )}
    </div>
  );
};

export default FinancialNews;