import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center">
        <img src="/logo.svg" alt="WenZi Logo" className="h-8 w-8 mr-2" />
        <h1 className="text-xl font-bold">WenZi</h1>
      </div>
      <nav>
        <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">Từ điển</a>
        <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">Ngữ pháp</a>
        <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">Bài học</a>
      </nav>
    </header>
  );
};

export default Header;
