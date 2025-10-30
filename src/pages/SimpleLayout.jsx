import React from 'react';

export default function SimpleLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold">Music Space</h1>
      </nav>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
