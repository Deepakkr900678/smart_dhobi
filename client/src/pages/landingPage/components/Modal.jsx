
import React, { useState } from 'react';
import {  XCircle } from 'lucide-react';


function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl mx-4 border border-white/20">
        <div className="flex justify-between items-center border-b border-gray-200/50 px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
          >
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
export default Modal;