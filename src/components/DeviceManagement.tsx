import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Device, Employee } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Monitor, Plus, Edit2, Trash2, Search, Smartphone, Laptop, Tablet, Watch, Box, User, Calendar, Clock, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceManagementProps {
  employees: Employee[];
}

export default function DeviceManagement({ employees }: DeviceManagementProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Laptop',
    serialNumber: '',
    status: 'Available' as Device['status'],
    assignedTo: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'devices'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deviceList: Device[] = [];
      snapshot.forEach((doc) => {
        deviceList.push({ id: doc.id, ...doc.data() } as Device);
      });
      setDevices(deviceList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'devices');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deviceId = editingDevice?.id || Math.random().toString(36).substr(2, 9);
    
    const deviceData: Partial<Device> = {
      ...formData,
      updatedBy: auth.currentUser?.email || 'Unknown',
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'devices', deviceId), deviceData, { merge: true });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `devices/${deviceId}`);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      serialNumber: device.serialNumber || '',
      status: device.status,
      assignedTo: device.assignedTo || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await deleteDoc(doc(db, 'devices', deviceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `devices/${deviceId}`);
    }
  };

  const resetForm = () => {
    setEditingDevice(null);
    setFormData({
      name: '',
      type: 'Laptop',
      serialNumber: '',
      status: 'Available',
      assignedTo: ''
    });
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'laptop' || t === 'mac') return <Laptop className="w-5 h-5" />;
    if (t === 'smartphone' || t === 'pixel 7' || t === 'pixel 5' || t === 'iphone') return <Smartphone className="w-5 h-5" />;
    if (t === 'tablet') return <Tablet className="w-5 h-5" />;
    if (t === 'watch') return <Watch className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'Assigned': return 'bg-blue-100 text-blue-700';
      case 'Repaired': return 'bg-orange-100 text-orange-700';
      case 'Retired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading devices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-[#1A2233]">Device Management</h2>
          <p className="text-[13px] text-[#718096]">Tracker for company hardware assets</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[6px] text-[14px] font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-sm">
          <div className="text-[11px] text-[#718096] uppercase font-bold tracking-wider mb-1">Total Devices</div>
          <div className="text-[24px] font-bold text-[#1A2233]">{devices.length}</div>
        </div>
        <div className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-sm">
          <div className="text-[11px] text-[#718096] uppercase font-bold tracking-wider mb-1">Available</div>
          <div className="text-[24px] font-bold text-[#2C7A7B]">{devices.filter(d => d.status === 'Available').length}</div>
        </div>
        <div className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-sm">
          <div className="text-[11px] text-[#718096] uppercase font-bold tracking-wider mb-1">Assigned</div>
          <div className="text-[24px] font-bold text-[#2B6CB0]">{devices.filter(d => d.status === 'Assigned').length}</div>
        </div>
        <div className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-sm">
          <div className="text-[11px] text-[#718096] uppercase font-bold tracking-wider mb-1">Under Repair</div>
          <div className="text-[24px] font-bold text-[#C2410C]">{devices.filter(d => d.status === 'Repaired').length}</div>
        </div>
      </div>

      <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input 
              type="text"
              placeholder="Search by name, serial number, or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] bg-[#F7FAFC] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-6 py-4 text-[12px] font-bold text-[#718096] uppercase tracking-wider">Device</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#718096] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#718096] uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#718096] uppercase tracking-wider">Last Edited</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#718096] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredDevices.map((device) => {
                const assignedEmployee = employees.find(e => e.id === device.assignedTo);
                return (
                  <tr key={device.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EDF2F7] flex items-center justify-center text-[#4A5568]">
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#1A2233]">{device.name}</p>
                          <p className="text-[12px] text-[#718096]">{device.type} • {device.serialNumber || 'No Serial'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignedEmployee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#E2E8F0] overflow-hidden">
                            {assignedEmployee.avatarUrl ? (
                              <img src={assignedEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                {assignedEmployee.firstName[0]}
                              </div>
                            )}
                          </div>
                          <span className="text-[13px]">{assignedEmployee.firstName} {assignedEmployee.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#A0AEC0]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-[12px] text-[#1A2233]">
                          <User className="w-3 h-3 text-[#A0AEC0]" />
                          {device.updatedBy}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#718096]">
                          <Clock className="w-3 h-3" />
                          {new Date(device.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(device)}
                          className="p-1.5 text-[#718096] hover:text-[#4A90E2] hover:bg-[#E2E8F0] rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(device.id)}
                          className="p-1.5 text-[#718096] hover:text-[#C53030] hover:bg-[#FED7D7] rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#718096]">
                    <div className="flex flex-col items-center gap-2">
                      <Box className="w-10 h-10 text-[#E2E8F0]" />
                      <p className="text-[14px]">No devices found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[12px] shadow-xl w-full max-w-md overflow-hidden z-10"
            >
              <div className="bg-[#1A2233] p-4 text-white flex justify-between items-center">
                <h3 className="font-bold">{editingDevice ? 'Edit Device' : 'Add New Device'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#718096] uppercase tracking-wider mb-1">Device Name</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                    placeholder='e.g. MacBook Pro 14"'
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#718096] uppercase tracking-wider mb-1">Type</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Mac">Mac</option>
                      <option value="Smartphone">Smartphone</option>
                      <option value="iPhone">iPhone</option>
                      <option value="Pixel 7">Pixel 7</option>
                      <option value="Pixel 5">Pixel 5</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Watch">Watch</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#718096] uppercase tracking-wider mb-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={e => {
                        const newStatus = e.target.value as Device['status'];
                        setFormData({ 
                          ...formData, 
                          status: newStatus,
                          assignedTo: newStatus === 'Assigned' ? formData.assignedTo : '' 
                        });
                      }}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                    >
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Repaired">Under Repair</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#718096] uppercase tracking-wider mb-1">Serial Number</label>
                  <input 
                    type="text"
                    value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                    placeholder="e.g. LNV-123456"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#718096] uppercase tracking-wider mb-1">Assign to Employee</label>
                  <select 
                    value={formData.assignedTo}
                    onChange={e => {
                      const val = e.target.value;
                      const newStatus = val ? 'Assigned' : (formData.status === 'Assigned' ? 'Available' : formData.status);
                      setFormData({ ...formData, assignedTo: val, status: newStatus as any });
                    }}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#718096] rounded-[6px] text-[14px] font-medium hover:bg-[#F7FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#4A90E2] text-white rounded-[6px] text-[14px] font-medium hover:bg-[#3A80D2] transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingDevice ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
