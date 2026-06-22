import React from 'react';

interface TabsProps {
  activeTab: 'words' | 'characters';
  onTabChange: (tab: 'words' | 'characters') => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-700">
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === 'words'
            ? 'border-b-2 border-blue-500 text-white'
            : 'text-gray-400 hover:bg-gray-700'
        }`}
        onClick={() => onTabChange('words')}
      >
        Từ
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === 'characters'
            ? 'border-b-2 border-blue-500 text-white'
            : 'text-gray-400 hover:bg-gray-700'
        }`}
        onClick={() => onTabChange('characters')}
      >
        Ký tự
      </button>
    </div>
  );
};

export default Tabs;
