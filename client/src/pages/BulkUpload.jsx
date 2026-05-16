import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Send,
} from 'lucide-react';
import { api, PLATFORMS } from '../utils/api';
import PlatformBadge from '../components/PlatformBadge';

const PLATFORM_IDS = PLATFORMS.map((p) => p.id);

const CSV_TEMPLATE = `platform,scheduled_date,scheduled_time,title,caption,hashtags,status
instagram,2026-06-01,09:00,Morning Post,"Rise and shine! Start your day right.","morning,motivation,lifestyle",scheduled
facebook,2026-06-01,12:00,Lunch Feature,"Check out our new lunch menu!","food,lunch,restaurant",scheduled
instagram,2026-06-02,18:00,Evening Vibes,"Sunset views from the rooftop.","sunset,vibes,evening",draft`;

export default function BulkUpload() {
  const fileInputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  function handleDownloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'postflow-bulk-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      parseCSV(ev.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function parseCSV(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      setErrors({ global: 'CSV must have a header row and at least one data row' });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['platform', 'title', 'caption'];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      setErrors({ global: `Missing required columns: ${missing.join(', ')}` });
      return;
    }

    const parsed = [];
    const rowErrors = {};

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });

      row._rowIndex = i;
      const lineErrors = validateRow(row, i);
      if (lineErrors.length > 0) {
        rowErrors[i] = lineErrors;
      }
      parsed.push(row);
    }

    setRows(parsed);
    setErrors(rowErrors);
    setImportResult(null);
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function validateRow(row, idx) {
    const errs = [];
    if (!row.platform || !PLATFORM_IDS.includes(row.platform)) {
      errs.push(`Invalid platform "${row.platform}". Must be: ${PLATFORM_IDS.join(', ')}`);
    }
    if (!row.title) errs.push('Title is required');
    if (!row.caption) errs.push('Caption is required');
    if (row.scheduled_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.scheduled_date)) {
      errs.push('Invalid date format. Use YYYY-MM-DD');
    }
    if (row.scheduled_time && !/^\d{2}:\d{2}$/.test(row.scheduled_time)) {
      errs.push('Invalid time format. Use HH:MM');
    }
    if (row.status && !['draft', 'scheduled'].includes(row.status)) {
      errs.push('Status must be draft or scheduled');
    }
    return errs;
  }

  function handleCellEdit(rowIndex, field, value) {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      // Re-validate
      const lineErrors = validateRow(updated[rowIndex], updated[rowIndex]._rowIndex);
      setErrors((prevErrs) => {
        const next = { ...prevErrs };
        if (lineErrors.length > 0) {
          next[updated[rowIndex]._rowIndex] = lineErrors;
        } else {
          delete next[updated[rowIndex]._rowIndex];
        }
        return next;
      });
      return updated;
    });
    setEditingCell(null);
  }

  function handleDeleteRow(index) {
    setRows((prev) => {
      const removed = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      if (removed) {
        setErrors((prevErrs) => {
          const next = { ...prevErrs };
          delete next[removed._rowIndex];
          return next;
        });
      }
      return updated;
    });
  }

  async function handleImport() {
    const validationErrors = {};
    rows.forEach((row) => {
      const errs = validateRow(row, row._rowIndex);
      if (errs.length > 0) validationErrors[row._rowIndex] = errs;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        let scheduledDate = null;
        if (row.scheduled_date) {
          const time = row.scheduled_time || '09:00';
          scheduledDate = new Date(`${row.scheduled_date}T${time}:00`).toISOString();
        }

        const hashtags = row.hashtags
          ? row.hashtags.split(/[,;]/).map((h) => h.trim().replace(/^#/, '')).filter(Boolean)
          : [];

        await api.createPost({
          title: row.title,
          platforms: [row.platform],
          scheduled_date: scheduledDate,
          status: row.status || 'draft',
          hashtags,
          variants: [{ variant_label: 'Direct', caption_text: row.caption }],
        });
        success++;
      } catch {
        failed++;
      }
    }

    setImporting(false);
    setImportResult({ success, failed, total: rows.length });
    if (failed === 0) setRows([]);
  }

  const hasErrors = Object.keys(errors).filter((k) => k !== 'global').length > 0;
  const FIELDS = ['platform', 'scheduled_date', 'scheduled_time', 'title', 'caption', 'hashtags', 'status'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Upload</h2>
          <p className="text-sm text-gray-400 mt-1">Import multiple posts from a CSV file</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Upload zone */}
      {rows.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500/50 hover:bg-gray-900/50 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Click to upload CSV file</p>
          <p className="text-gray-500 text-sm mt-1">Or drag and drop your file here</p>
          <p className="text-gray-600 text-xs mt-3">
            Required columns: platform, title, caption. Optional: scheduled_date, scheduled_time, hashtags, status
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Global error */}
      {errors.global && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{errors.global}</p>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          importResult.failed === 0
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-yellow-500/10 border border-yellow-500/30'
        }`}>
          {importResult.failed === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          )}
          <div>
            <p className={`font-medium ${importResult.failed === 0 ? 'text-green-300' : 'text-yellow-300'}`}>
              {importResult.success} of {importResult.total} posts imported successfully
            </p>
            {importResult.failed > 0 && (
              <p className="text-sm text-yellow-400/80 mt-0.5">
                {importResult.failed} post(s) failed to import
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {rows.length} post(s) ready to import
              {hasErrors && <span className="text-red-400 ml-2">({Object.keys(errors).length} row(s) with errors)</span>}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setRows([]); setErrors({}); setImportResult(null); }}
                className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                Re-upload
              </button>
              <button
                onClick={handleImport}
                disabled={importing || hasErrors}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {importing ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Import {rows.length} Posts
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
                  {FIELDS.map((f) => (
                    <th key={f} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {f.replace('_', ' ')}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Errors</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const rowErrs = errors[row._rowIndex] || [];
                  return (
                    <tr
                      key={idx}
                      className={`border-b border-gray-800/50 ${
                        rowErrs.length > 0 ? 'bg-red-500/5' : 'bg-gray-950 even:bg-gray-900/50'
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                      {FIELDS.map((field) => {
                        const isEditing = editingCell?.row === idx && editingCell?.field === field;
                        return (
                          <td key={field} className="px-3 py-2">
                            {isEditing ? (
                              <input
                                autoFocus
                                defaultValue={row[field] || ''}
                                onBlur={(e) => handleCellEdit(idx, field, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellEdit(idx, field, e.target.value);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full bg-gray-800 border border-purple-500 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                              />
                            ) : (
                              <span
                                onClick={() => setEditingCell({ row: idx, field })}
                                className="cursor-pointer hover:bg-gray-800 px-1 py-0.5 rounded text-gray-300 block truncate max-w-[150px]"
                                title={row[field] || '—'}
                              >
                                {field === 'platform' ? (
                                  row[field] ? <PlatformBadge platform={row[field]} /> : '—'
                                ) : (
                                  row[field] || <span className="text-gray-600">—</span>
                                )}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2">
                        {rowErrs.length > 0 && (
                          <span
                            className="text-red-400 cursor-help"
                            title={rowErrs.join('\n')}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
