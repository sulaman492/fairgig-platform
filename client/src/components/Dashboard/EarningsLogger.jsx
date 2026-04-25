// src/components/Dashboard/EarningsLogger.jsx
import { useEffect, useRef, useState } from 'react';
import {
  Eye,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { authApi, getApiErrorMessage } from '../../lib/authApi';

const defaultFormState = {
  platform: 'Uber',
  date: '',
  grossEarnings: '',
  fees: '',
  hoursWorked: '',
  screenshot: null,
};

const statusStyles = {
  verified: 'bg-green-100 text-green-700 ring-green-200',
  pending: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  flagged: 'bg-red-100 text-red-700 ring-red-200',
};

const mapBackendStatusToUi = (status) => {
  if (status === 'confirmed') {
    return 'verified';
  }
  if (status === 'discrepancy' || status === 'unverifiable') {
    return 'flagged';
  }
  return 'pending';
};

const normalizeShift = (shift) => ({
  id: shift.id,
  platform: shift.platform,
  date: shift.shift_date,
  grossEarnings: Number(shift.gross_earned || 0),
  fees: Number(shift.platform_deductions || 0),
  hoursWorked: Number(shift.hours_worked || 0),
  verificationStatus: mapBackendStatusToUi(shift.verification_status),
  screenshotName: shift.screenshot_url || '',
});

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const parseCsvText = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const dataLines = lines.slice(1);

  return dataLines.map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] || '']));

    const grossEarnings = Number(row.grossearnings || row.gross || 0);
    const fees = Number(row.fees || row.deductions || 0);
    const hoursWorked = Number(row.hoursworked || row.hours || 0);
    const verificationStatus = ['verified', 'pending', 'flagged'].includes((row.verificationstatus || '').toLowerCase())
      ? row.verificationstatus.toLowerCase()
      : 'pending';

    return {
      id: Date.now() + index,
      platform: row.platform || 'Uber',
      date: row.date || new Date().toISOString().slice(0, 10),
      grossEarnings,
      fees,
      hoursWorked,
      verificationStatus,
      screenshotName: row.screenshot || '',
    };
  });
};

export default function EarningsLogger() {
  const [shiftLogs, setShiftLogs] = useState([]);
  const [summary, setSummary] = useState({
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [formData, setFormData] = useState(defaultFormState);
  const [formError, setFormError] = useState('');
  const [tableError, setTableError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState(null);
  const csvInputRef = useRef(null);

  const loadShiftData = async () => {
    setIsLoading(true);
    setTableError('');

    try {
      const [shiftsResponse, summaryResponse] = await Promise.all([
        authApi.get('/api/shifts/my'),
        authApi.get('/api/shifts/summary'),
      ]);

      setShiftLogs((shiftsResponse.data.shifts || []).map(normalizeShift));
      setSummary(
        summaryResponse.data.summary || {
          total_gross: 0,
          total_deductions: 0,
          total_net: 0,
        },
      );
    } catch (error) {
      setTableError(getApiErrorMessage(error, 'Unable to load earnings right now.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadShiftData);
  }, []);

  const handleFormChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(defaultFormState);
    setFormError('');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const addNewShift = async (event) => {
    event.preventDefault();

    if (!formData.platform || !formData.date || !formData.grossEarnings || !formData.hoursWorked) {
      setFormError('Please complete the required fields before saving the shift.');
      return;
    }

    const grossEarnings = Number(formData.grossEarnings);
    const fees = Number(formData.fees || 0);
    const hoursWorked = Number(formData.hoursWorked);
    const netReceived = grossEarnings - fees;

    if (hoursWorked <= 0) {
      setFormError('Hours worked must be greater than zero.');
      return;
    }

    if (netReceived < 0) {
      setFormError('Net earnings cannot be negative.');
      return;
    }

    setIsSaving(true);

    try {
      let screenshotBase64 = '';

      if (formData.screenshot) {
        screenshotBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Unable to read screenshot.'));
          reader.readAsDataURL(formData.screenshot);
        });
      }

      await authApi.post('/api/shifts', {
        platform: formData.platform,
        shift_date: formData.date,
        hours_worked: hoursWorked,
        gross_earned: grossEarnings,
        platform_deductions: fees,
        net_received: netReceived,
        screenshot: screenshotBase64,
      });

      closeForm();
      await loadShiftData();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to save this shift right now.'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteShift = async (id) => {
    setDeletingShiftId(id);

    try {
      await authApi.delete(`/api/shifts/${id}`);

      if (selectedShift?.id === id) {
        setSelectedShift(null);
      }

      await loadShiftData();
    } catch (error) {
      setTableError(getApiErrorMessage(error, 'Unable to delete this shift right now.'));
    } finally {
      setDeletingShiftId(null);
    }
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const csvText = await file.text();
    const importedRows = parseCsvText(csvText);

    if (importedRows.length > 0) {
      setShiftLogs((current) => [...importedRows, ...current]);
    }

    event.target.value = '';
  };

  const totalGross = Number(summary.total_gross || 0);
  const totalDeductions = Number(summary.total_deductions || 0);
  const totalNet = Number(summary.total_net || 0);
  const totalHours = shiftLogs.reduce((sum, shift) => sum + shift.hoursWorked, 0);
  const avgHourlyRate = totalHours > 0 ? totalNet / totalHours : 0;

  return (
    <>
      <div className="flex h-full min-h-0 flex-col bg-transparent">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Earnings Logger</h2>
            <p className="mt-2 text-sm text-gray-600">
              Track shifts, upload proof, and keep payout records organized.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvImport}
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import CSV
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Log New Shift
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Gross</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalGross)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Deductions</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Net</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(totalNet)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Hourly Rate</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(avgHourlyRate)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="h-full overflow-auto">
            {tableError && (
              <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {tableError}
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-4">Platform</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Gross</th>
                  <th className="px-4 py-4">Deductions</th>
                  <th className="px-4 py-4">Net</th>
                  <th className="px-4 py-4">Hours</th>
                  <th className="px-4 py-4">Hourly Rate</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-10">
                      <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading shifts...
                      </div>
                    </td>
                  </tr>
                ) : shiftLogs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-sm text-gray-500">
                      No shifts logged yet.
                    </td>
                  </tr>
                ) : (
                  shiftLogs.map((shift) => {
                    const net = shift.grossEarnings - shift.fees;
                    const hourlyRate = shift.hoursWorked > 0 ? net / shift.hoursWorked : 0;

                    return (
                      <tr key={shift.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{shift.platform}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{formatDate(shift.date)}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{formatCurrency(shift.grossEarnings)}</td>
                        <td className="px-4 py-4 text-sm text-red-600">{formatCurrency(shift.fees)}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-green-600">{formatCurrency(net)}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{shift.hoursWorked} hrs</td>
                        <td className="px-4 py-4 text-sm font-medium text-blue-600">{formatCurrency(hourlyRate)}</td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[shift.verificationStatus]}`}
                          >
                            {shift.verificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedShift(shift)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteShift(shift.id)}
                              disabled={deletingShiftId === shift.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingShiftId === shift.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Shift Modal - FairGig Color Scheme */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Log New Shift</h3>
                <p className="mt-1 text-sm text-gray-600">Add a new shift log to your earnings table.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addNewShift} className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(event) => handleFormChange('platform', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {['Uber', 'Careem', 'Foodpanda', 'Bykea', 'DoorDash'].map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(event) => handleFormChange('date', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Gross Earnings (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.grossEarnings}
                    onChange={(event) => handleFormChange('grossEarnings', event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Deductions (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fees}
                    onChange={(event) => handleFormChange('fees', event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours Worked</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hoursWorked}
                    onChange={(event) => handleFormChange('hoursWorked', event.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Screenshot (Optional)</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600 transition hover:border-blue-400 hover:bg-blue-50">
                    <Upload className="h-4 w-4" />
                    <span>{formData.screenshot?.name || 'Choose screenshot'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleFormChange('screenshot', event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {formError && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Shift Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Shift Details</h3>
                <p className="mt-1 text-sm text-gray-600">{selectedShift.platform} shift summary</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShift(null)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Platform</p>
                  <p className="mt-1 font-medium text-gray-900">{selectedShift.platform}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date</p>
                  <p className="mt-1 text-gray-900">{formatDate(selectedShift.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross Earnings</p>
                  <p className="mt-1 font-medium text-gray-900">{formatCurrency(selectedShift.grossEarnings)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Deductions</p>
                  <p className="mt-1 text-red-600">{formatCurrency(selectedShift.fees)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Earnings</p>
                  <p className="mt-1 text-lg font-bold text-green-600">
                    {formatCurrency(selectedShift.grossEarnings - selectedShift.fees)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hours Worked</p>
                  <p className="mt-1 text-gray-900">{selectedShift.hoursWorked} hrs</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hourly Rate</p>
                  <p className="mt-1 font-medium text-blue-600">
                    {formatCurrency(selectedShift.hoursWorked > 0 ? (selectedShift.grossEarnings - selectedShift.fees) / selectedShift.hoursWorked : 0)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[selectedShift.verificationStatus]}`}
                  >
                    {selectedShift.verificationStatus}
                  </span>
                </div>
                {selectedShift.screenshotName && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Screenshot</p>
                    <p className="mt-1 text-sm text-gray-600 break-all">{selectedShift.screenshotName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}