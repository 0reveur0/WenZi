import React from 'react';

interface CharBreakdownProps {
  word: string;
}

const CharBreakdown: React.FC<CharBreakdownProps> = ({ word }) => {
  return (
    <div className="p-4 border rounded">
      <h2 className="font-bold">Phân tích chữ</h2>
      {word.split('').map((char, index) => (
        <div key={index} className="mt-4">
          <h3 className="text-2xl font-bold">{char}</h3>
          {/* Placeholder for character details */}
          <p>Thứ tự nét: [Animation]</p>
          <p>Bộ thủ: [Radical]</p>
          <p>Số nét: [Number]</p>
          {/* Add other character details here */}
        </div>
      ))}
    </div>
  );
};

export default CharBreakdown;
