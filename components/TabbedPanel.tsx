import React, { useState, ReactNode } from 'react';

interface Tab {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  content: ReactNode;
}

interface TabbedPanelProps {
  tabs: Tab[];
}

const TabbedPanel: React.FC<TabbedPanelProps> = ({ tabs }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => setActiveTabIndex(index)}
              className={`
                group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  index === activeTabIndex
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              aria-current={index === activeTabIndex ? 'page' : undefined}
            >
              <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${index === activeTabIndex ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6 flex-grow overflow-y-auto">
        {tabs.map((tab, index) => (
            <div key={tab.label} style={{ display: index === activeTabIndex ? 'block' : 'none' }}>
                {tab.content}
            </div>
        ))}
      </div>
    </div>
  );
};

export default TabbedPanel;
