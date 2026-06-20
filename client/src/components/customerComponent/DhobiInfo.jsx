
import React from 'react';
import { User, Star, Phone, Mail, MapPin } from 'lucide-react';

const DhobiInfo = ({ dhobi }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 capitalize">{dhobi.name}</h1>
        <p className="text-gray-600 flex items-center mt-1">
          <User className="w-4 h-4 mr-1" />
          Owner: {dhobi.owner}
        </p>
      </div>
      <div className="text-right">
        <div className="flex items-center text-yellow-500 mb-1">
          <Star className="w-4 h-4 fill-current mr-1" />
          <span className="font-semibold">{dhobi.rating}</span>
        </div>
        <p className="text-sm text-gray-500">{dhobi.ordersCompleted} orders</p>
      </div>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          <span>{dhobi.mobile}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          <span>{dhobi.email}</span>
        </div>
      </div>
      <div className="flex items-start text-gray-600">
        <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
        <span className="text-sm">{dhobi.serviceAreas}</span>
      </div>
    </div>
  </div>
);

export default DhobiInfo;