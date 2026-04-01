import React, { useEffect, useState } from 'react';
import { FiCalendar, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/api';
import PageDoodle from '../components/common/PageDoodle';
import { useAuth } from '../context/AuthContext';

const getToday = () => new Date().toISOString().split('T')[0];

const createEmptySlot = () => ({
  time: '',
  fee: '',
});

const DoctorSlotsManager = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [slots, setSlots] = useState([createEmptySlot()]);
  const [savedSlots, setSavedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSchedule();
    }
  }, [selectedDate, user?.id]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/schedule?doctorId=${user.id}&date=${selectedDate}`);
      const existingSlots = response.data?.data?.schedule?.slots || [];
      setSavedSlots(existingSlots);
      setSlots(existingSlots.length ? existingSlots.map((slot) => ({ time: slot.time, fee: slot.fee })) : [createEmptySlot()]);
    } catch (error) {
      setSavedSlots([]);
      setSlots([createEmptySlot()]);
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = (index, field, value) => {
    setSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, [field]: value } : slot))
    );
  };

  const addSlot = () => setSlots((current) => [...current, createEmptySlot()]);

  const removeSlot = (index) => {
    setSlots((current) => {
      const next = current.filter((_, slotIndex) => slotIndex !== index);
      return next.length ? next : [createEmptySlot()];
    });
  };

  const saveSlots = async () => {
    const normalizedSlots = slots
      .map((slot) => ({
        time: slot.time.trim(),
        fee: Number(slot.fee),
      }))
      .filter((slot) => slot.time && Number.isFinite(slot.fee) && slot.fee >= 0);

    if (!normalizedSlots.length) {
      toast.error('Add at least one valid slot before saving.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/appointments/schedule/create', {
        date: selectedDate,
        slots: normalizedSlots,
      });
      toast.success('Free slots saved successfully.');
      fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save slots');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-700 p-6 text-white shadow-xl">
        <PageDoodle type="schedule" className="absolute right-4 top-4 hidden md:block" />
        <h1 className="text-3xl font-extrabold tracking-tight">Manage Free Slots</h1>
        <p className="mt-2 text-blue-100">
          Upload the times patients can see and book for you.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            <FiCalendar className="h-4 w-4" />
            <span>Select Date</span>
            <input
              type="date"
              min={getToday()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </label>

          <button
            type="button"
            onClick={addSlot}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add Slot
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div
                key={`${selectedDate}-${index}`}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_180px_auto] dark:border-gray-700"
              >
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 10:30 AM"
                  value={slot.time}
                  onChange={(e) => updateSlot(index, 'time', e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Fee"
                  value={slot.fee}
                  onChange={(e) => updateSlot(index, 'fee', e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  className="inline-flex items-center justify-center rounded-xl bg-red-50 px-4 py-3 text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveSlots}
            disabled={saving}
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Slots'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Free Slots</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Saved slots for {selectedDate}
            </p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {savedSlots.length} slot{savedSlots.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : savedSlots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600 dark:border-gray-600 dark:bg-gray-900/40 dark:text-slate-300">
            No saved free slots for this date yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {savedSlots.map((slot, index) => (
              <div
                key={`${selectedDate}-saved-${slot.time}-${index}`}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20"
              >
                <p className="text-base font-semibold text-slate-900 dark:text-white">{slot.time}</p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Fee: Rs. {slot.fee}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {slot.isBooked ? 'Booked' : 'Free Slot Added'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSlotsManager;
