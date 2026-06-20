import React, {useState} from "react"
import {  CheckCircle } from 'lucide-react';

const ProgressIndicator = ({ currentStep, totalSteps, stepLabels }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {currentStep > step ? <CheckCircle size={20} /> : step}
          </div>
          <span className="text-xs mt-2 text-center">{stepLabels[step - 1]}</span>
        </div>
      ))}
    </div>
    <div className="relative">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-300" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  </div>
);


export default ProgressIndicator